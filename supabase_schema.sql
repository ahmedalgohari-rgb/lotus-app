CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  scientific_name TEXT,
  common_name TEXT,
  image_url TEXT,
  location TEXT, -- e.g., Living Room, Bedroom
  window_direction TEXT, -- e.g., North, East, South, West
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_watered_at TIMESTAMP WITH TIME ZONE,
  next_watering_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plants."
  ON plants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plants."
  ON plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plants."
  ON plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plants."
  ON plants FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE care_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'water', 'prune', 'feed'
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own care events."
  ON care_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own care events."
  ON care_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own care events."
  ON care_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own care events."
  ON care_events FOR DELETE
  USING (auth.uid() = user_id);