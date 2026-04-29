import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-mode',
}

type ApiConfig = {
  api_name: string
  enabled: boolean
  rate_limit_per_hour: number
  max_calls_per_day: number | null
  maintenance_message: string | null
}

// Module-scope cache survives across invocations on a warm Deno isolate.
// One DB read per minute per warm instance instead of per request.
const CONFIG_TTL_MS = 60_000
let configCache: { value: ApiConfig; expiresAt: number } | null = null

async function getConfig(supabase: SupabaseClient, apiName: string): Promise<ApiConfig | null> {
  const now = Date.now()
  if (configCache && configCache.value.api_name === apiName && configCache.expiresAt > now) {
    return configCache.value
  }
  const { data, error } = await supabase
    .from('api_config')
    .select('api_name, enabled, rate_limit_per_hour, max_calls_per_day, maintenance_message')
    .eq('api_name', apiName)
    .single()
  if (error || !data) {
    console.warn(`api_config row missing for ${apiName}; falling through with permissive defaults`)
    return null
  }
  configCache = { value: data as ApiConfig, expiresAt: now + CONFIG_TTL_MS }
  return data as ApiConfig
}

function currentHourBucket(): string {
  const d = new Date()
  d.setUTCMinutes(0, 0, 0)
  return d.toISOString()
}

function secondsUntilNextUtcMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
  ))
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000)
}

function jsonResponse(status: number, body: unknown) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const PLANTNET_API_KEY = Deno.env.get('PLANTNET_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    if (!PLANTNET_API_KEY) {
      console.error('PLANTNET_API_KEY not configured')
      return jsonResponse(500, { error: 'API key not configured' })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse(401, { error: 'Unauthorized - No auth header' })
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return jsonResponse(401, { error: 'Unauthorized - Invalid token' })
    }

    console.log(`PlantNet request from user: ${user.id}`)

    const isDevMode = req.headers.get('X-Dev-Mode') === 'true'
    if (isDevMode) {
      console.log('🧪 DEV MODE: rate limiting + caps disabled')
    }

    // ── Live-tunable governance (cached 60s in module scope) ───────────
    const config = await getConfig(supabase, 'plantnet')

    // 1. Kill switch — flip api_config.enabled = FALSE in dashboard to pause
    if (config && !config.enabled && !isDevMode) {
      console.warn('PlantNet paused via api_config.enabled = FALSE')
      return jsonResponse(503, {
        error: 'Service paused',
        message: config.maintenance_message ?? 'Plant identification is temporarily unavailable.',
      })
    }

    // 2. Global daily cap — protects from runaway usage across all users
    if (config?.max_calls_per_day && !isDevMode) {
      const { data: globalCount, error: globalErr } = await supabase
        .rpc('get_api_global_daily_count', { p_api_name: 'plantnet' })

      if (globalErr) {
        console.error('Global count RPC failed (failing open):', globalErr)
      } else if (typeof globalCount === 'number' && globalCount >= config.max_calls_per_day) {
        console.warn(`Global daily cap hit: ${globalCount}/${config.max_calls_per_day}`)
        return jsonResponse(429, {
          error: 'Daily quota exhausted',
          message: 'Plant identification limit reached for today. Please try again tomorrow.',
          retryAfter: secondsUntilNextUtcMidnight(),
        })
      }
    }

    // 3. Per-user hourly limit — fast PK lookup against own bucket row
    if (config && !isDevMode) {
      const hourBucket = currentHourBucket()
      const { data: bucket, error: bucketErr } = await supabase
        .from('api_usage_buckets')
        .select('count')
        .eq('api_name', 'plantnet')
        .eq('user_id', user.id)
        .eq('hour_bucket', hourBucket)
        .maybeSingle()

      if (bucketErr) {
        console.error('Bucket read failed (failing open):', bucketErr)
      } else if (bucket && bucket.count >= config.rate_limit_per_hour) {
        console.warn(`User ${user.id} hit hourly limit: ${bucket.count}/${config.rate_limit_per_hour}`)
        return jsonResponse(429, {
          error: 'Rate limit exceeded',
          message: `Maximum ${Math.floor(config.rate_limit_per_hour / 3)} plant scans per hour. Please try again later.`,
          retryAfter: 3600 - Math.floor((Date.now() % 3600000) / 1000),
        })
      }
    }

    // ── PlantNet call ─────────────────────────────────────────────────
    const { imageBase64, imageUri, organ = 'leaf', language = 'en' } = await req.json()

    if (!imageBase64 && !imageUri) {
      return jsonResponse(400, { error: 'imageBase64 or imageUri is required' })
    }

    console.log(`Calling PlantNet API: organ=${organ}, language=${language}`)

    const formData = new FormData()
    let imageBlob: Blob
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      imageBlob = new Blob([binaryData], { type: 'image/jpeg' })
      console.log(`✅ Base64 converted: blob size=${imageBlob.size} bytes`)
    } else {
      const imageResponse = await fetch(imageUri!)
      imageBlob = await imageResponse.blob()
      console.log(`✅ Image fetched: blob size=${imageBlob.size} bytes`)
    }

    formData.append('images', imageBlob, 'plant.jpg')
    formData.append('organs', organ)

    const plantNetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&lang=${language}`
    console.log(`📤 Sending request to PlantNet... (blob size: ${imageBlob.size} bytes)`)
    const plantNetResponse = await fetch(plantNetUrl, { method: 'POST', body: formData })

    console.log(`📥 PlantNet response: status=${plantNetResponse.status}`)

    if (!plantNetResponse.ok) {
      const errorText = await plantNetResponse.text()
      console.error('❌ PlantNet API error:', {
        status: plantNetResponse.status,
        statusText: plantNetResponse.statusText,
        errorBody: errorText,
        blobSize: imageBlob.size,
      })
      return jsonResponse(plantNetResponse.status, {
        error: 'PlantNet API error',
        status: plantNetResponse.status,
        statusText: plantNetResponse.statusText,
        message: errorText,
        details: { blobSize: imageBlob.size, organ, language },
      })
    }

    const plantNetData = await plantNetResponse.json()

    if (plantNetData.results && plantNetData.results.length > 0) {
      const topResult = plantNetData.results[0]
      const confidence = Math.round(topResult.score * 100)
      console.log(`✅ Plant identified: ${topResult.species?.scientificNameWithoutAuthor || 'unknown'} (${confidence}% confidence)`)
      if (confidence < 60) {
        console.warn(`⚠️ Low confidence result: ${confidence}% — may be rejected by client`)
      }
    } else {
      console.warn('⚠️ PlantNet returned no results — likely not a plant')
    }

    // ── Increment counter atomically (UPSERT into bucket via SQL function) ─
    if (!isDevMode) {
      const { error: upsertErr } = await supabase.rpc('increment_api_usage_bucket', {
        p_api_name: 'plantnet',
        p_hour_bucket: currentHourBucket(),
      })
      if (upsertErr) {
        console.error('Bucket UPSERT failed (non-fatal):', upsertErr)
      }
    }

    return jsonResponse(200, plantNetData)

  } catch (error) {
    console.error('Edge Function error:', error)
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
