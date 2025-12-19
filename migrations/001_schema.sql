-- Open Camp - Kids Camp Registration
-- Complete Database Schema
-- Run this single migration for fresh installations

-- ============================================
-- CAMPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS camps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    age_min INTEGER,
    age_max INTEGER,
    max_spots INTEGER NOT NULL DEFAULT 20,
    spots_taken INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',  -- active, archived
    
    -- Registration controls
    registration_status TEXT DEFAULT 'open',  -- open, paused, closed
    waitlist_enabled INTEGER DEFAULT 0,
    waitlist_message TEXT DEFAULT '',
    
    -- Sibling discount
    sibling_discount_enabled INTEGER DEFAULT 0,
    sibling_discount_amount REAL DEFAULT 0,
    sibling_discount_type TEXT DEFAULT 'fixed',  -- fixed, percentage
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRICING ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    camp_id INTEGER,  -- NULL means applies to all camps
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    item_type TEXT NOT NULL,  -- base_fee, add_on, discount
    is_required INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE CASCADE
);

-- ============================================
-- REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Camp & Payment
    camp_id INTEGER REFERENCES camps(id),
    total_amount REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',  -- pending, paid, free
    payment_reference TEXT,
    registration_status TEXT DEFAULT 'confirmed',  -- confirmed, pending, waitlist, cancelled, attended, no-show
    
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
    permission_app_waiver INTEGER DEFAULT 0,
    
    -- Admin
    admin_notes TEXT,
    
    -- Soft delete
    deleted_at TEXT DEFAULT NULL,
    deleted_reason TEXT DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REGISTRATION ITEMS TABLE (purchases)
-- ============================================
CREATE TABLE IF NOT EXISTS registration_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    pricing_item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (pricing_item_id) REFERENCES pricing_items(id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_camps_status ON camps(status);
CREATE INDEX IF NOT EXISTS idx_camps_dates ON camps(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_camps_registration_status ON camps(registration_status);

CREATE INDEX IF NOT EXISTS idx_pricing_items_camp ON pricing_items(camp_id);
CREATE INDEX IF NOT EXISTS idx_pricing_items_active ON pricing_items(is_active);

CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_child_name ON registrations(child_full_name);
CREATE INDEX IF NOT EXISTS idx_registrations_parent_name ON registrations(parent_full_name);
CREATE INDEX IF NOT EXISTS idx_registrations_camp ON registrations(camp_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_registrations_deleted ON registrations(deleted_at);

CREATE INDEX IF NOT EXISTS idx_registration_items_reg ON registration_items(registration_id);

