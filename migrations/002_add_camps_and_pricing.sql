-- Open Camp - Enhanced Schema for Multiple Camps & Pricing
-- Migration 002: Add camps and pricing tables

-- Camps table
CREATE TABLE IF NOT EXISTS camps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,  -- ISO date format
    end_date TEXT NOT NULL,
    age_min INTEGER,
    age_max INTEGER,
    max_spots INTEGER NOT NULL DEFAULT 20,
    spots_taken INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',  -- active, full, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing items table
CREATE TABLE IF NOT EXISTS pricing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    camp_id INTEGER,  -- NULL means applies to all camps
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,  -- in pounds/currency
    item_type TEXT NOT NULL,  -- base_fee, add_on, discount
    is_required INTEGER DEFAULT 0,  -- 1 for base fee
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE CASCADE
);

-- Update registrations table to link to camps
ALTER TABLE registrations ADD COLUMN camp_id INTEGER REFERENCES camps(id);
ALTER TABLE registrations ADD COLUMN total_amount REAL DEFAULT 0;
ALTER TABLE registrations ADD COLUMN payment_status TEXT DEFAULT 'pending';  -- pending, paid, refunded
ALTER TABLE registrations ADD COLUMN payment_reference TEXT;

-- Registration items junction table (what they purchased)
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

-- Indexes
CREATE INDEX idx_camps_status ON camps(status);
CREATE INDEX idx_camps_dates ON camps(start_date, end_date);
CREATE INDEX idx_pricing_items_camp ON pricing_items(camp_id);
CREATE INDEX idx_registration_items_reg ON registration_items(registration_id);
CREATE INDEX idx_registrations_camp ON registrations(camp_id);
CREATE INDEX idx_registrations_payment ON registrations(payment_status);

-- Insert default camp (migrate existing data)
INSERT INTO camps (name, description, start_date, end_date, age_min, age_max, max_spots, status)
VALUES (
    'Summer Camp 2025',
    'Fun-filled summer activities for kids',
    '2025-07-01',
    '2025-07-05',
    5,
    15,
    20,
    'active'
);

-- Insert default pricing
INSERT INTO pricing_items (camp_id, name, description, amount, item_type, is_required, display_order)
VALUES 
    (1, 'Camp Fee', 'Full week camp registration', 150.00, 'base_fee', 1, 1),
    (NULL, 'Sibling Discount', '10% off for additional siblings', -15.00, 'discount', 0, 2),
    (NULL, 'Lunch Package', 'Hot lunch provided daily', 25.00, 'add_on', 0, 3),
    (NULL, 'Extended Hours', 'Early drop-off and late pick-up', 30.00, 'add_on', 0, 4),
    (NULL, 'Camp T-Shirt', 'Official camp t-shirt', 12.00, 'add_on', 0, 5);

