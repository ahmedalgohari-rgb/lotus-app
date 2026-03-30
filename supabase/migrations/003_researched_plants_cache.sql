-- Researched Plants Cache Table
-- Stores dynamically researched plant care data from external APIs
-- This creates a "living database" that grows as users scan plants

CREATE TABLE IF NOT EXISTS researched_plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plant Identification
  scientific_name TEXT NOT NULL UNIQUE,
  common_names TEXT[] DEFAULT '{}',
  family TEXT,
  genus TEXT,

  -- Care Data (researched from APIs)
  care_data JSONB NOT NULL,
  -- Structure: {
  --   plant_type: string,
  --   watering: { schedule: string, description: string },
  --   light: { requirement: string, description: string },
  --   temperature: { min: number, max: number, optimal: number },
  --   humidity: string,
  --   soil: string,
  --   fertilizer: string,
  --   plant_info: string,
  --   pet_safe: boolean
  -- }

  -- Research Metadata
  research_source TEXT NOT NULL, -- 'perenual', 'trefle', 'plantnet_extended', etc.
  confidence_score INTEGER DEFAULT 0, -- 0-100
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Usage Statistics
  times_requested INTEGER DEFAULT 1,
  last_requested_at TIMESTAMPTZ DEFAULT NOW(),

  -- Quality Control
  verified BOOLEAN DEFAULT FALSE, -- Manual verification flag
  quality_issues TEXT[], -- Track any data quality problems

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_researched_plants_scientific ON researched_plants(scientific_name);
CREATE INDEX idx_researched_plants_family ON researched_plants(family);
CREATE INDEX idx_researched_plants_expires ON researched_plants(expires_at);
CREATE INDEX idx_researched_plants_verified ON researched_plants(verified);

-- Row Level Security
ALTER TABLE researched_plants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read researched plants (public knowledge)
CREATE POLICY "Researched plants are publicly readable"
  ON researched_plants
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can trigger research (via Edge Function)
CREATE POLICY "Only authenticated users can request research"
  ON researched_plants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_researched_plants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_researched_plants_timestamp
  BEFORE UPDATE ON researched_plants
  FOR EACH ROW
  EXECUTE FUNCTION update_researched_plants_updated_at();

-- Function to increment request counter and update last_requested_at
CREATE OR REPLACE FUNCTION increment_plant_request_count(plant_scientific_name TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE researched_plants
  SET
    times_requested = times_requested + 1,
    last_requested_at = NOW()
  WHERE scientific_name = plant_scientific_name;
END;
$$ LANGUAGE plpgsql;

-- View: Most requested unknown plants (for prioritizing manual curation)
CREATE OR REPLACE VIEW most_requested_plants AS
SELECT
  scientific_name,
  common_names,
  family,
  times_requested,
  last_requested_at,
  verified,
  research_source,
  confidence_score
FROM researched_plants
WHERE verified = FALSE
ORDER BY times_requested DESC, last_requested_at DESC
LIMIT 50;

COMMENT ON TABLE researched_plants IS 'Cache of dynamically researched plant care data from external APIs';
COMMENT ON VIEW most_requested_plants IS 'Plants frequently scanned but not yet manually verified - prioritize these for CSV addition';
