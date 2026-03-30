import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-mode',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables (secure - not exposed to client)
    const PLANTNET_API_KEY = Deno.env.get('PLANTNET_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    if (!PLANTNET_API_KEY) {
      console.error('PLANTNET_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`PlantNet request from user: ${user.id}`)

    // 🧪 DEV MODE: Check for development bypass header
    const isDevMode = req.headers.get('X-Dev-Mode') === 'true'
    if (isDevMode) {
      console.log('🧪 DEV MODE: Rate limiting disabled for testing')
    }

    // RATE LIMITING: Check API usage per user (skip in dev mode)
    // NOTE: Each scan tries up to 3 organs (leaf, flower, fruit), so multiply scans × 3
    // TESTING: 30 requests/hour (~10 scans). PRODUCTION: reduce to 15 (~5 scans)
    if (!isDevMode) {
      const RATE_LIMIT = 30 // TODO: Reduce to 15 for production launch
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

      const { count, error: countError } = await supabase
        .from('api_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('api_name', 'plantnet')
        .gte('created_at', oneHourAgo)

      if (countError) {
        console.error('Rate limit check failed:', countError)
        // Don't block on rate limit check failure - continue
      } else if (count && count >= RATE_LIMIT) {
        console.warn(`Rate limit exceeded for user ${user.id}: ${count} requests in last hour (limit: ${RATE_LIMIT})`)
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Maximum ${Math.floor(RATE_LIMIT / 3)} plant scans per hour. Please try again later.`,
            retryAfter: 3600 - Math.floor((Date.now() - new Date(oneHourAgo).getTime()) / 1000)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Parse request body
    const { imageBase64, imageUri, organ = 'leaf', language = 'en' } = await req.json()

    if (!imageBase64 && !imageUri) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 or imageUri is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Calling PlantNet API: organ=${organ}, language=${language}`)

    // Call PlantNet API with secure key
    const formData = new FormData()

    // Convert base64 to blob, or fetch from URI (fallback)
    let imageBlob: Blob
    if (imageBase64) {
      // NEW: Accept base64-encoded image (works with local file:// URIs)
      console.log('🔍 Converting base64 to blob...')
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      imageBlob = new Blob([binaryData], { type: 'image/jpeg' })
      console.log(`✅ Base64 converted: blob size=${imageBlob.size} bytes`)
    } else {
      // FALLBACK: Fetch image from URI (only works for http:// URLs)
      console.log('🔍 Fetching image from URI (fallback)...')
      const imageResponse = await fetch(imageUri!)
      imageBlob = await imageResponse.blob()
      console.log(`✅ Image fetched: blob size=${imageBlob.size} bytes`)
    }

    formData.append('images', imageBlob, 'plant.jpg')
    formData.append('organs', organ)

    const plantNetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&lang=${language}`

    console.log(`📤 Sending request to PlantNet... (blob size: ${imageBlob.size} bytes)`)
    const plantNetResponse = await fetch(plantNetUrl, {
      method: 'POST',
      body: formData,
    })

    console.log(`📥 PlantNet response: status=${plantNetResponse.status}`)

    if (!plantNetResponse.ok) {
      const errorText = await plantNetResponse.text()
      console.error('❌ PlantNet API error:', {
        status: plantNetResponse.status,
        statusText: plantNetResponse.statusText,
        errorBody: errorText,
        blobSize: imageBlob.size
      })
      return new Response(
        JSON.stringify({
          error: 'PlantNet API error',
          status: plantNetResponse.status,
          statusText: plantNetResponse.statusText,
          message: errorText,
          details: {
            blobSize: imageBlob.size,
            organ,
            language
          }
        }),
        { status: plantNetResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const plantNetData = await plantNetResponse.json()

    // 🔒 Log confidence scores for monitoring
    if (plantNetData.results && plantNetData.results.length > 0) {
      const topResult = plantNetData.results[0]
      const confidence = Math.round(topResult.score * 100)
      console.log(`✅ Plant identified: ${topResult.species?.scientificNameWithoutAuthor || 'unknown'} (${confidence}% confidence)`)

      // Warn if confidence is low
      if (confidence < 60) {
        console.warn(`⚠️ Low confidence result: ${confidence}% - may be rejected by client`)
      }
    } else {
      console.warn('⚠️ PlantNet returned no results - likely not a plant')
    }

    // Log API usage for rate limiting
    const { error: insertError } = await supabase
      .from('api_usage')
      .insert({
        user_id: user.id,
        api_name: 'plantnet',
        created_at: new Date().toISOString(),
        metadata: {
          confidence: plantNetData.results?.[0]?.score ? Math.round(plantNetData.results[0].score * 100) : 0,
          resultsCount: plantNetData.results?.length || 0
        }
      })

    if (insertError) {
      console.error('Failed to log API usage:', insertError)
      // Don't fail the request, just log the error
    }

    console.log('PlantNet identification successful')

    // Return PlantNet response
    return new Response(
      JSON.stringify(plantNetData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
