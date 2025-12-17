-- Open Camp - Kids Camp Registration
-- D1 Database Schema

-- Drop table if exists (for clean migrations)
DROP TABLE IF EXISTS registrations;

-- Create registrations table
CREATE TABLE registrations (
    -- Primary key
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contact Information
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Child Information
    child_full_name TEXT NOT NULL,
    child_age TEXT DEFAULT '',
    child_dob TEXT NOT NULL,
    
    -- Parent/Guardian Information
    parent_full_name TEXT NOT NULL,
    address TEXT DEFAULT '',
    
    -- Emergency Contact 1 (Required)
    emergency1_name TEXT NOT NULL,
    emergency1_phone TEXT NOT NULL,
    emergency1_relationship TEXT NOT NULL,
    
    -- Emergency Contact 2 (Optional)
    emergency2_name TEXT DEFAULT '',
    emergency2_phone TEXT DEFAULT '',
    emergency2_relationship TEXT DEFAULT '',
    
    -- Collection & Safety
    authorised_collectors TEXT DEFAULT '',
    walk_home_alone TEXT NOT NULL,
    
    -- Medical Conditions
    has_medical_conditions TEXT NOT NULL,
    medical_conditions_details TEXT DEFAULT '',
    
    -- Additional Needs
    has_additional_needs TEXT NOT NULL,
    additional_needs_details TEXT DEFAULT '',
    
    -- Allergies
    has_allergies TEXT NOT NULL,
    allergies_details TEXT DEFAULT '',
    
    -- Medication
    has_medication TEXT NOT NULL,
    medication_details TEXT DEFAULT '',
    
    -- Further Information
    has_further_info TEXT NOT NULL,
    further_info_details TEXT DEFAULT '',
    
    -- Permissions (stored as INTEGER 0/1)
    permission_photos INTEGER DEFAULT 0,
    permission_health INTEGER DEFAULT 0,
    permission_activities INTEGER DEFAULT 0,
    permission_locations INTEGER DEFAULT 0,
    permission_meals INTEGER DEFAULT 0,
    permission_bathroom INTEGER DEFAULT 0,
    permission_first_aid INTEGER DEFAULT 0,
    permission_equipment INTEGER DEFAULT 0,
    permission_app_waiver INTEGER DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_created_at ON registrations(created_at);
CREATE INDEX idx_registrations_child_name ON registrations(child_full_name);
CREATE INDEX idx_registrations_parent_name ON registrations(parent_full_name);
