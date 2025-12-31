-- V1__initial_schema.sql
-- Encore Database Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Profiles (extends Cognito users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artists
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  genius_id VARCHAR(50) UNIQUE,
  mbid VARCHAR(50) UNIQUE,
  image_url TEXT,
  genres TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  setlist_fm_id VARCHAR(50) UNIQUE,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concerts (the core entity)
CREATE TABLE concerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id),
  venue_id UUID REFERENCES venues(id),
  concert_date DATE,
  confidence_score DECIMAL(3, 2),
  notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concert_id UUID REFERENCES concerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  original_filename VARCHAR(255),
  taken_at TIMESTAMPTZ,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setlists
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
  setlist_fm_id VARCHAR(50),
  songs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concert Artists (for multiple performers/openers)
CREATE TABLE concert_artists (
  concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id),
  is_headliner BOOLEAN DEFAULT FALSE,
  set_order INTEGER,
  PRIMARY KEY (concert_id, artist_id)
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concert_id UUID REFERENCES concerts(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source VARCHAR(50),
  source_id VARCHAR(255),
  pdf_storage_path TEXT,
  purchase_price DECIMAL(10, 2),
  section VARCHAR(50),
  row VARCHAR(20),
  seat VARCHAR(20),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social: Following
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX idx_concerts_user_id ON concerts(user_id);
CREATE INDEX idx_concerts_date ON concerts(concert_date);
CREATE INDEX idx_concerts_artist_id ON concerts(artist_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_concert_id ON photos(concert_id);
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_genius_id ON artists(genius_id);
CREATE INDEX idx_artists_mbid ON artists(mbid);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
