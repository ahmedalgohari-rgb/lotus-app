/**
 * Supabase Edge Function: Research Plant
 *
 * Automatically researches unknown plants using external APIs
 * and caches results in the researched_plants table.
 *
 * APIs Used (in order of preference):
 * 1. Perenual API (free tier: 300 requests/day)
 * 2. Trefle API (fallback)
 * 3. Family-based fallback (if APIs fail)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchRequest {
  scientificName: string;
  commonName?: string;
  family?: string;
}

interface CareData {
  plant_type: string;
  watering: {
    schedule: string;
    description: string;
  };
  light: {
    requirement: string;
    description: string;
  };
  temperature: {
    min: number;
    max: number;
    optimal?: number;
  };
  humidity: string;
  soil: string;
  fertilizer: string;
  plant_info: string;
  pet_safe: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const { scientificName, commonName, family }: ResearchRequest = await req.json();

    if (!scientificName) {
      return new Response(
        JSON.stringify({ error: 'Scientific name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Researching plant: ${scientificName}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if already in cache
    const { data: cachedPlant, error: cacheError } = await supabaseClient
      .from('researched_plants')
      .select('*')
      .eq('scientific_name', scientificName)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedPlant && !cacheError) {
      console.log(`✅ Found in cache: ${scientificName}`);

      // Increment request counter
      await supabaseClient.rpc('increment_plant_request_count', {
        plant_scientific_name: scientificName
      });

      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          plant: cachedPlant
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Not in cache - research it!
    console.log(`🌐 Researching online: ${scientificName}`);

    let careData: CareData | null = null;
    let source = 'unknown';

    // Try Perenual API first
    careData = await researchWithPerenual(scientificName);
    if (careData) {
      source = 'perenual';
    }

    // Fallback to family-based care if research failed
    if (!careData && family) {
      careData = getFamilyBasedCare(family);
      source = 'family_fallback';
    }

    // Ultimate fallback
    if (!careData) {
      careData = getDefaultCare();
      source = 'default_fallback';
    }

    // Store in cache
    const { data: newPlant, error: insertError } = await supabaseClient
      .from('researched_plants')
      .insert({
        scientific_name: scientificName,
        common_names: commonName ? [commonName] : [],
        family: family || 'Unknown',
        genus: scientificName.split(' ')[0],
        care_data: careData,
        research_source: source,
        confidence_score: source === 'perenual' ? 80 : (source === 'family_fallback' ? 60 : 40),
        times_requested: 1
      })
      .select()
      .single();

    if (insertError) {
      console.error('Cache insert error:', insertError);
      // Return data anyway even if cache fails
      return new Response(
        JSON.stringify({
          success: true,
          cached: false,
          careData,
          source,
          cacheError: insertError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Researched and cached: ${scientificName} (source: ${source})`);

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        plant: newPlant
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Research error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Research plant using Perenual API
 * Free tier: 300 requests/day
 * Docs: https://perenual.com/docs/api
 */
async function researchWithPerenual(scientificName: string): Promise<CareData | null> {
  try {
    const apiKey = Deno.env.get('PERENUAL_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ PERENUAL_API_KEY not set');
      return null;
    }

    // Search for plant by scientific name
    const searchUrl = `https://perenual.com/api/species-list?key=${apiKey}&q=${encodeURIComponent(scientificName)}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      console.log(`❌ Perenual: Plant not found: ${scientificName}`);
      return null;
    }

    const plantId = searchData.data[0].id;

    // Get detailed plant info
    const detailUrl = `https://perenual.com/api/species/details/${plantId}?key=${apiKey}`;
    const detailResponse = await fetch(detailUrl);
    const plantData = await detailResponse.json();

    console.log(`✅ Perenual: Found data for ${scientificName}`);

    // Map Perenual data to our schema
    return {
      plant_type: mapPlantType(plantData.type),
      watering: {
        schedule: mapWateringSchedule(plantData.watering),
        description: plantData.watering_general_benchmark?.value || 'Water when soil is dry'
      },
      light: {
        requirement: mapLightRequirement(plantData.sunlight),
        description: Array.isArray(plantData.sunlight) ? plantData.sunlight.join(', ') : 'Bright indirect light'
      },
      temperature: {
        min: 15,
        max: 30,
        optimal: 22
      },
      humidity: plantData.humidity || 'medium',
      soil: plantData.soil || 'well_draining_potting',
      fertilizer: 'monthly',
      plant_info: plantData.description || `${plantData.common_name || scientificName} is a beautiful plant.`,
      pet_safe: plantData.poisonous_to_pets === 0 || plantData.poisonous_to_pets === false
    };

  } catch (error) {
    console.error('Perenual API error:', error);
    return null;
  }
}

/**
 * Get family-based care fallback
 */
function getFamilyBasedCare(family: string): CareData {
  const familyCare: Record<string, Partial<CareData>> = {
    'Cactaceae': {
      plant_type: 'cactus',
      watering: { schedule: '100_dry', description: 'Water sparingly, let soil dry completely' },
      light: { requirement: 'bright_direct', description: 'Full sun, 5+ hours daily' },
      humidity: 'low',
      soil: 'cactus_mix'
    },
    'Crassulaceae': {
      plant_type: 'succulent',
      watering: { schedule: '75_dry', description: 'Water when mostly dry' },
      light: { requirement: 'bright_indirect', description: 'Bright indirect to full sun' },
      humidity: 'low',
      soil: 'cactus_mix'
    },
    'Araceae': {
      plant_type: 'foliage',
      watering: { schedule: '60_dry', description: 'Keep soil lightly moist' },
      light: { requirement: 'medium_indirect', description: 'Medium to bright indirect' },
      humidity: 'high',
      soil: 'well_draining_potting'
    }
  };

  const baseCare = familyCare[family] || {};

  return {
    plant_type: baseCare.plant_type || 'foliage',
    watering: baseCare.watering || { schedule: '60_dry', description: 'Water when top soil is dry' },
    light: baseCare.light || { requirement: 'medium_indirect', description: 'Bright indirect light' },
    temperature: { min: 15, max: 30, optimal: 22 },
    humidity: baseCare.humidity || 'medium',
    soil: baseCare.soil || 'well_draining_potting',
    fertilizer: 'monthly',
    plant_info: `A member of the ${family} family. Requires typical care for this plant family.`,
    pet_safe: false
  };
}

/**
 * Default safe care fallback
 */
function getDefaultCare(): CareData {
  return {
    plant_type: 'foliage',
    watering: {
      schedule: '60_dry',
      description: 'Water when top 2 inches of soil are dry'
    },
    light: {
      requirement: 'medium_indirect',
      description: 'Bright indirect light, avoid direct sun'
    },
    temperature: {
      min: 15,
      max: 30,
      optimal: 22
    },
    humidity: 'medium',
    soil: 'well_draining_potting',
    fertilizer: 'monthly',
    plant_info: 'General care guidelines. We recommend researching this specific plant for best results.',
    pet_safe: false
  };
}

/**
 * Mapping functions
 */
function mapPlantType(type: string): string {
  const typeMap: Record<string, string> = {
    'cactus': 'cactus',
    'succulent': 'succulent',
    'palm': 'palm',
    'fern': 'fern',
    'orchid': 'orchid',
    'bromeliad': 'bromeliad'
  };
  return typeMap[type?.toLowerCase()] || 'foliage';
}

function mapWateringSchedule(watering: string): string {
  if (!watering) return '60_dry';

  const lower = watering.toLowerCase();
  if (lower.includes('frequent') || lower.includes('daily')) return '30_dry';
  if (lower.includes('average') || lower.includes('weekly')) return '60_dry';
  if (lower.includes('minimum') || lower.includes('rare')) return '100_dry';

  return '60_dry';
}

function mapLightRequirement(sunlight: string[] | string): string {
  const lightStr = Array.isArray(sunlight) ? sunlight.join(' ') : (sunlight || '');
  const lower = lightStr.toLowerCase();

  if (lower.includes('full sun')) return 'bright_direct';
  if (lower.includes('partial')) return 'medium_indirect';
  if (lower.includes('shade')) return 'low_indirect';

  return 'bright_indirect';
}
