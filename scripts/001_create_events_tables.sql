-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  full_date TEXT,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  confirmed_guests INTEGER DEFAULT 0,
  total_guests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'declined')),
  contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_photos table
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  tags TEXT[]
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can view their own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for guests
CREATE POLICY "Users can view guests of their events" ON guests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert guests to their events" ON guests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update guests of their events" ON guests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guests from their events" ON guests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid()
    )
  );

-- Create RLS policies for items
CREATE POLICY "Users can view items of their events" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = items.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their events" ON items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = items.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of their events" ON items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = items.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their events" ON items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = items.event_id AND events.user_id = auth.uid()
    )
  );

-- Create RLS policies for event_photos
CREATE POLICY "Users can view photos of their events" ON event_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_photos.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to their events" ON event_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_photos.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of their events" ON event_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_photos.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their events" ON event_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_photos.event_id AND events.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_items_event_id ON items(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
