-- Add registration controls to camps table
ALTER TABLE camps ADD COLUMN registration_status TEXT DEFAULT 'open';
ALTER TABLE camps ADD COLUMN waitlist_enabled INTEGER DEFAULT 0;
ALTER TABLE camps ADD COLUMN waitlist_message TEXT DEFAULT '';

