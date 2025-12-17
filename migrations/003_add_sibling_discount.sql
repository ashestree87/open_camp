-- Migration: Add sibling discount fields to camps table
-- This allows camps to optionally enable automatic sibling discounts

ALTER TABLE camps ADD COLUMN sibling_discount_enabled INTEGER DEFAULT 0;
ALTER TABLE camps ADD COLUMN sibling_discount_amount REAL DEFAULT 0;
ALTER TABLE camps ADD COLUMN sibling_discount_type TEXT DEFAULT 'fixed'; -- 'fixed' or 'percentage'

