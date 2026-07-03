-- Add optional image_url column to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS image_url TEXT;
