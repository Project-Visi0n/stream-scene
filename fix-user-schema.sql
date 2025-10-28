-- Fix User table schema to match User model
-- Add missing columns for Threads integration

ALTER TABLE users 
ADD COLUMN threads_access_token VARCHAR(500) NULL AFTER google_id,
ADD COLUMN threads_user_id VARCHAR(100) NULL AFTER threads_access_token;