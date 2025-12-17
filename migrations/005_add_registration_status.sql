-- Add registration_status field to registrations table
ALTER TABLE registrations ADD COLUMN registration_status TEXT DEFAULT 'confirmed';

