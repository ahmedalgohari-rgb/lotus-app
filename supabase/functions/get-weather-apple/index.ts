import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CAIRO_COORDS = { lat: 30.0444, lon: 31.2357 }

// WeatherKit condition code mappings
const CONDITION_MAPPINGS = {
  sunny: ['Clear', 'MostlyClear', 'Hot'],
  cloudy: ['PartlyCloudy', 'MostlyCloudy', 'Cloudy', 'Foggy', 'Haze', 'Smoky'],
  rainy: [
    'Rain', 'HeavyRain', 'Drizzle', 'Thunderstorms', 'IsolatedThunderstorms',
    'ScatteredThunderstorms', 'StrongStorms', 'SunShowers', 'FreezingRain', 'FreezingDrizzle'
  ],
  winter: [
    'Frigid', 'Blizzard', 'Snow', 'HeavySnow', 'Flurries', 'Sleet',
    'WintryMix', 'BlowingSnow', 'SunFlurries'
  ],
  windy: ['Breezy', 'Windy', 'BlowingDust', 'Hurricane', 'TropicalStorm', 'Hail'],
}

// Icon mapping for OpenWeather compatibility
const ICON_MAPPINGS = {
  clear: ['Clear', 'MostlyClear', 'Hot'],
  fewClouds: ['PartlyCloudy'],
  scatteredClouds: ['MostlyCloudy'],
  overcast: ['Cloudy', 'Foggy', 'Haze', 'Smoky'],
  rain: ['Rain', 'HeavyRain', 'FreezingRain', 'FreezingDrizzle'],
  drizzle: ['Drizzle', 'SunShowers'],
  thunder: ['Thunderstorms', 'IsolatedThunderstorms', 'ScatteredThunderstorms', 'StrongStorms'],
  snow: ['Snow', 'HeavySnow', 'Flurries', 'Sleet', 'WintryMix', 'BlowingSnow', 'SunFlurries', 'Blizzard'],
}

// Localized descriptions
const DESCRIPTIONS: Record<string, { en: string; ar: string }> = {
  'Clear': { en: 'Clear', ar: 'صافي' },
  'MostlyClear': { en: 'Mostly Clear', ar: 'صافي غالباً' },
  'PartlyCloudy': { en: 'Partly Cloudy', ar: 'غائم جزئياً' },
  'MostlyCloudy': { en: 'Mostly Cloudy', ar: 'غائم غالباً' },
  'Cloudy': { en: 'Cloudy', ar: 'غائم' },
  'Foggy': { en: 'Foggy', ar: 'ضبابي' },
  'Haze': { en: 'Hazy', ar: 'ضباب خفيف' },
  'Smoky': { en: 'Smoky', ar: 'دخاني' },
  'Breezy': { en: 'Breezy', ar: 'نسيم خفيف' },
  'Windy': { en: 'Windy', ar: 'عاصف' },
  'Drizzle': { en: 'Drizzle', ar: 'رذاذ' },
  'Rain': { en: 'Rain', ar: 'مطر' },
  'HeavyRain': { en: 'Heavy Rain', ar: 'مطر غزير' },
  'Thunderstorms': { en: 'Thunderstorms', ar: 'عواصف رعدية' },
  'IsolatedThunderstorms': { en: 'Isolated Thunderstorms', ar: 'عواصف رعدية متفرقة' },
  'ScatteredThunderstorms': { en: 'Scattered Thunderstorms', ar: 'عواصف رعدية متناثرة' },
  'StrongStorms': { en: 'Strong Storms', ar: 'عواصف قوية' },
  'SunShowers': { en: 'Sun Showers', ar: 'مطر مع شمس' },
  'Hot': { en: 'Hot', ar: 'حار' },
  'Frigid': { en: 'Frigid', ar: 'بارد جداً' },
  'BlowingDust': { en: 'Blowing Dust', ar: 'غبار متطاير' },
  'Hurricane': { en: 'Hurricane', ar: 'إعصار' },
  'TropicalStorm': { en: 'Tropical Storm', ar: 'عاصفة استوائية' },
  'Snow': { en: 'Snow', ar: 'ثلج' },
  'HeavySnow': { en: 'Heavy Snow', ar: 'ثلج كثيف' },
  'Sleet': { en: 'Sleet', ar: 'مطر ثلجي' },
  'Hail': { en: 'Hail', ar: 'برد' },
  'FreezingRain': { en: 'Freezing Rain', ar: 'مطر متجمد' },
  'FreezingDrizzle': { en: 'Freezing Drizzle', ar: 'رذاذ متجمد' },
  'Flurries': { en: 'Snow Flurries', ar: 'زخات ثلجية' },
  'Blizzard': { en: 'Blizzard', ar: 'عاصفة ثلجية' },
  'BlowingSnow': { en: 'Blowing Snow', ar: 'ثلج متطاير' },
  'WintryMix': { en: 'Wintry Mix', ar: 'مزيج شتوي' },
  'SunFlurries': { en: 'Sun Flurries', ar: 'ثلج مع شمس' },
}

function mapWeatherKitCondition(conditionCode: string): string {
  if (CONDITION_MAPPINGS.sunny.includes(conditionCode)) return 'Clear'
  if (CONDITION_MAPPINGS.cloudy.includes(conditionCode)) return 'Clouds'
  if (CONDITION_MAPPINGS.rainy.includes(conditionCode)) return 'Rain'
  if (CONDITION_MAPPINGS.winter.includes(conditionCode)) return 'Snow'
  if (CONDITION_MAPPINGS.windy.includes(conditionCode)) return 'Atmosphere'
  return 'Clear'
}

function mapConditionToIcon(conditionCode: string, isDay: boolean): string {
  const suffix = isDay ? 'd' : 'n'

  if (ICON_MAPPINGS.clear.includes(conditionCode)) return `01${suffix}`
  if (ICON_MAPPINGS.fewClouds.includes(conditionCode)) return `02${suffix}`
  if (ICON_MAPPINGS.scatteredClouds.includes(conditionCode)) return `03${suffix}`
  if (ICON_MAPPINGS.overcast.includes(conditionCode)) return `04${suffix}`
  if (ICON_MAPPINGS.drizzle.includes(conditionCode)) return `09${suffix}`
  if (ICON_MAPPINGS.rain.includes(conditionCode)) return `10${suffix}`
  if (ICON_MAPPINGS.thunder.includes(conditionCode)) return `11${suffix}`
  if (ICON_MAPPINGS.snow.includes(conditionCode)) return `13${suffix}`

  return `01${suffix}`
}

function getWeatherDescription(conditionCode: string, language: string): string {
  const desc = DESCRIPTIONS[conditionCode]
  return desc ? (language === 'ar' ? desc.ar : desc.en) : (language === 'ar' ? 'صافي' : 'Clear')
}

async function generateWeatherKitToken(): Promise<string> {
  const teamId = Deno.env.get('WEATHERKIT_TEAM_ID')
  const serviceId = Deno.env.get('WEATHERKIT_SERVICE_ID')
  const keyId = Deno.env.get('WEATHERKIT_KEY_ID')
  const privateKeyBase64 = Deno.env.get('WEATHERKIT_PRIVATE_KEY')

  if (!teamId || !serviceId || !keyId || !privateKeyBase64) {
    throw new Error('WeatherKit credentials not configured')
  }

  const privateKeyPem = atob(privateKeyBase64)
  const privateKey = await jose.importPKCS8(privateKeyPem, 'ES256')
  const now = Math.floor(Date.now() / 1000)

  return new jose.SignJWT({
    iss: teamId,
    sub: serviceId,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({
      alg: 'ES256',
      kid: keyId,
      id: `${teamId}.${serviceId}`,
    })
    .sign(privateKey)
}

interface WeatherKitCurrentWeather {
  asOf: string
  cloudCover: number
  conditionCode: string
  daylight: boolean
  humidity: number
  temperature: number
  temperatureApparent: number
  pressure: number
  windDirection: number
  windSpeed: number
}

interface WeatherKitForecastDay {
  temperatureMax: number
  temperatureMin: number
  sunrise: string
  sunset: string
}

interface WeatherKitResponse {
  currentWeather: WeatherKitCurrentWeather
  forecastDaily: {
    days: WeatherKitForecastDay[]
  }
}

function transformToOpenWeatherFormat(data: WeatherKitResponse, language: string): Record<string, unknown> {
  const current = data.currentWeather
  const today = data.forecastDaily.days[0]

  const tempMin = Math.round(today.temperatureMin)
  const tempMax = Math.round(today.temperatureMax)
  const tempAvg = Math.round((tempMin + tempMax) / 2)
  const humidityPercent = Math.round(current.humidity * 100)
  const windSpeedMs = Math.round((current.windSpeed / 3.6) * 10) / 10

  return {
    coord: { lat: CAIRO_COORDS.lat, lon: CAIRO_COORDS.lon },
    weather: [{
      id: 800,
      main: mapWeatherKitCondition(current.conditionCode),
      description: getWeatherDescription(current.conditionCode, language),
      icon: mapConditionToIcon(current.conditionCode, current.daylight)
    }],
    main: {
      temp: tempAvg,
      temp_min: tempMin,
      temp_max: tempMax,
      feels_like: Math.round(current.temperatureApparent),
      pressure: Math.round(current.pressure),
      humidity: humidityPercent,
    },
    wind: {
      speed: windSpeedMs,
      deg: current.windDirection
    },
    clouds: { all: Math.round(current.cloudCover * 100) },
    dt: Math.floor(new Date(current.asOf).getTime() / 1000),
    sys: {
      country: 'EG',
      sunrise: Math.floor(new Date(today.sunrise).getTime() / 1000),
      sunset: Math.floor(new Date(today.sunset).getTime() / 1000),
    },
    timezone: 7200,
    name: language === 'ar' ? 'القاهرة' : 'Cairo',
    _weatherkit_meta: {
      source: 'apple_weatherkit',
      conditionCode: current.conditionCode,
      temp_range: `${tempMin}°C - ${tempMax}°C`,
      avg_calculation: `(${tempMin} + ${tempMax}) / 2 = ${tempAvg}°C`,
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const language = url.searchParams.get('lang') || 'en'
    const weatherKitLang = language === 'ar' ? 'ar' : 'en'

    console.log(`WeatherKit request for Cairo: language=${weatherKitLang}`)

    const token = await generateWeatherKitToken()
    const weatherKitUrl = `https://weatherkit.apple.com/api/v1/weather/${weatherKitLang}/${CAIRO_COORDS.lat}/${CAIRO_COORDS.lon}?dataSets=currentWeather,forecastDaily&timezone=Africa/Cairo`

    const response = await fetch(weatherKitUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WeatherKit API error:', response.status, errorText)

      return new Response(
        JSON.stringify({
          error: 'WeatherKit API error',
          status: response.status,
          message: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const weatherKitData: WeatherKitResponse = await response.json()
    const weatherData = transformToOpenWeatherFormat(weatherKitData, language)

    console.log('WeatherKit data processed:', weatherData._weatherkit_meta)

    return new Response(
      JSON.stringify(weatherData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
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
