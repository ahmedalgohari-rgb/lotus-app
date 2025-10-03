-- Lotus App Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Plant species (static reference data)
CREATE TABLE plant_species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  scientific_name TEXT,
  watering_frequency_days INTEGER DEFAULT 7 CHECK (watering_frequency_days > 0),
  light_requirement TEXT CHECK (light_requirement IN ('low', 'medium', 'bright_indirect', 'direct')),
  window_ratings JSONB DEFAULT '{"north": 3, "east": 4, "south": 2, "west": 3}',
  care_tips_en TEXT[] DEFAULT '{}',
  care_tips_ar TEXT[] DEFAULT '{}',
  cairo_specific_tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plants table (user's plant collection)
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  species_id UUID REFERENCES plant_species(id),
  nickname TEXT NOT NULL,
  location TEXT CHECK (location IN ('living_room', 'bedroom', 'kitchen', 'bathroom', 'balcony')),
  window_direction TEXT CHECK (window_direction IN ('north', 'east', 'south', 'west')),
  image_url TEXT,
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'needs_attention', 'critical')),
  last_watered_at TIMESTAMPTZ,
  next_watering_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- Plants policies
CREATE POLICY "Users can view their own plants" ON plants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plants" ON plants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plants" ON plants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plants" ON plants
  FOR DELETE USING (auth.uid() = user_id);

-- Care events (plant care history)
CREATE TABLE care_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT CHECK (event_type IN ('water', 'fertilize', 'prune', 'repot')) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

-- Care events policies
CREATE POLICY "Users can view their own care events" ON care_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own care events" ON care_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own care events" ON care_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own care events" ON care_events
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_plants_user_id ON plants(user_id);
CREATE INDEX idx_plants_next_watering ON plants(next_watering_at) WHERE next_watering_at IS NOT NULL;
CREATE INDEX idx_care_events_plant_id ON care_events(plant_id);
CREATE INDEX idx_care_events_user_date ON care_events(user_id, completed_at);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for plants updated_at
CREATE TRIGGER update_plants_updated_at 
  BEFORE UPDATE ON plants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next watering date
CREATE OR REPLACE FUNCTION calculate_next_watering(
  last_watered TIMESTAMPTZ,
  frequency_days INTEGER
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN last_watered + (frequency_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Insert some common plant species data
INSERT INTO plant_species (name_en, name_ar, scientific_name, watering_frequency_days, light_requirement, window_ratings, care_tips_en, care_tips_ar, cairo_specific_tips) VALUES
('Golden Pothos', 'البوتس الذهبي', 'Epipremnum aureum', 7, 'bright_indirect', 
 '{"north": 5, "east": 4, "south": 2, "west": 3}',
 '{"Water when top inch of soil is dry", "Wipe leaves monthly", "Trim yellow leaves"}',
 '{"اسقي عندما تجف البوصة العلوية من التربة", "امسح الأوراق شهرياً", "قلم الأوراق الصفراء"}',
 'Needs more water during Cairo summer heat (May-September)'),

('Snake Plant', 'نبات الثعبان', 'Sansevieria trifasciata', 14, 'low',
 '{"north": 4, "east": 5, "south": 3, "west": 4}',
 '{"Water sparingly, every 2-3 weeks", "Tolerates neglect well", "Perfect for beginners"}',
 '{"اسقي قليلاً كل 2-3 أسابيع", "يتحمل الإهمال جيداً", "مثالي للمبتدئين"}',
 'Very drought tolerant - perfect for Cairo climate'),

('Monstera Deliciosa', 'مونستيرا', 'Monstera deliciosa', 7, 'bright_indirect',
 '{"north": 5, "east": 4, "south": 1, "west": 2}',
 '{"Provide moss pole for support", "Mist regularly for humidity", "Fenestrations appear with maturity"}',
 '{"وفر عمود طحلب للدعم", "رش بانتظام للرطوبة", "تظهر الثقوب مع النضج"}',
 'Needs extra humidity during dry Cairo winters'),

('Peace Lily', 'زنبق السلام', 'Spathiphyllum wallisii', 5, 'medium',
 '{"north": 4, "east": 5, "south": 2, "west": 3}',
 '{"Droops when thirsty", "Blooms with proper care", "Remove spent flowers"}',
 '{"يذبل عند العطش", "يزهر مع العناية المناسبة", "أزل الزهور الذابلة"}',
 'Benefits from Cairo bathroom humidity'),

('Rubber Plant', 'نبات المطاط', 'Ficus elastica', 10, 'bright_indirect',
 '{"north": 3, "east": 4, "south": 2, "west": 3}',
 '{"Wipe leaves for shine", "Rotate monthly for even growth", "Prune to control size"}',
 '{"امسح الأوراق للمعان", "أدر شهرياً للنمو المتساوي", "قلم للتحكم في الحجم"}',
 'Dust leaves frequently due to Cairo sand storms');

-- Storage bucket for plant images
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-images', 'plant-images', true);

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'plant-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'plant-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (bucket_id = 'plant-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (bucket_id = 'plant-images' AND auth.uid()::text = (storage.foldername(name))[1]);