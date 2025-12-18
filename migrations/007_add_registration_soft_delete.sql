-- Add soft delete support to registrations table
ALTER TABLE registrations ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE registrations ADD COLUMN deleted_reason TEXT DEFAULT NULL;

