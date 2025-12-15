-- Migration to add avatar_type column to user_profiles
-- Run this in your Supabase SQL Editor

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_type INTEGER DEFAULT 1;

-- Add comment
COMMENT ON COLUMN public.user_profiles.avatar_type IS 'Stores selected avatar type (1-12)';
