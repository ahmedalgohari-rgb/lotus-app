import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CAIRO_COORDS = {
  lat: 30.0444,
  lon: 31.2357
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variable (secure - not exposed to client)
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')

    if (!OPENWEATHER_API_KEY) {
      console.error('OPENWEATHER_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse language from query params (no auth needed - weather is public)
    const url = new URL(req.url)
    const language = url.searchParams.get('lang') || 'en'

    console.log(`Weather request for Cairo: language=${language}`)

    // Call OpenWeather Forecast API for more accurate daily temperature data
    // Using 5-day forecast gives us min/max temperatures for better plant care recommendations
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${CAIRO_COORDS.lat}&lon=${CAIRO_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=${language}`

    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text()
      console.error('OpenWeather Forecast API error:', forecastResponse.status, errorText)
      return new Response(
        JSON.stringify({
          error: 'Weather API error',
          status: forecastResponse.status,
          message: errorText
        }),
        { status: forecastResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const forecastData = await forecastResponse.json()

    // Extract today's forecasts (next 24 hours)
    const now = Date.now() / 1000 // Unix timestamp in seconds
    const todayEnd = now + (24 * 60 * 60) // 24 hours from now

    const todayForecasts = forecastData.list.filter((item: any) => {
      return item.dt >= now && item.dt <= todayEnd
    })

    // Calculate daily temperature statistics for accurate plant care
    const temps = todayForecasts.map((item: any) => item.main.temp)
    const minTemp = Math.min(...temps)
    const maxTemp = Math.max(...temps)
    const avgTemp = (minTemp + maxTemp) / 2 // Representative daily average

    // Get current conditions from first forecast entry
    const current = todayForecasts[0] || forecastData.list[0]

    // Build response in same format as current weather API (backward compatible)
    const weatherData = {
      coord: forecastData.city.coord,
      weather: current.weather,
      main: {
        temp: avgTemp, // Daily average temperature (min+max)/2
        temp_min: minTemp,
        temp_max: maxTemp,
        feels_like: current.main.feels_like,
        pressure: current.main.pressure,
        humidity: current.main.humidity,
      },
      wind: current.wind,
      clouds: current.clouds,
      dt: current.dt,
      sys: {
        country: forecastData.city.country,
        sunrise: forecastData.city.sunrise,
        sunset: forecastData.city.sunset,
      },
      timezone: forecastData.city.timezone,
      name: forecastData.city.name,
      // Additional metadata for debugging
      _forecast_meta: {
        source: 'forecast_api',
        forecasts_analyzed: todayForecasts.length,
        temp_range: `${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`,
        avg_calculation: `(${minTemp.toFixed(1)} + ${maxTemp.toFixed(1)}) / 2 = ${avgTemp.toFixed(1)}°C`
      }
    }

    console.log('Weather forecast data processed:', weatherData._forecast_meta)

    // Return weather data with 24-hour cache (4x longer than before!)
    // This reduces API calls by 75% while providing more accurate daily averages
    return new Response(
      JSON.stringify(weatherData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400', // 24 hours (was 6 hours)
        }
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
