# Pricing Management Guide

## ✅ New Feature: Full Pricing Management UI

### Access:
1. Login to `/admin`
2. Click the **"Pricing"** tab

### Features:

#### Create Pricing Items
- Click **"+ Create Pricing Item"**
- Fill in:
  - **Name**: e.g., "Lunch Package"
  - **Description**: e.g., "Hot lunch provided daily"
  - **Amount**: e.g., 25.00 (use negative for discounts like -10)
  - **Type**: Base Fee, Add-on, or Discount
  - **Assign to Camp**: Choose specific camp or "All Camps"
  - **Display Order**: 1, 2, 3... (controls order shown to parents)
  - **Required**: Auto-select this item (can't deselect)
  - **Active**: Show/hide this item

#### Edit Pricing Items
- Click **"Edit"** on any item
- Update any field
- Click **"Update Item"**

#### Delete Pricing Items
- Click **"Delete"** on any item
- Confirm deletion

### Example Setup:

**Summer Camp Base Pricing:**
```
1. Camp Fee (Base Fee): £150.00 - Required, Active
2. Lunch Package (Add-on): £25.00 - Optional, Active
3. Extended Care (Add-on): £10.00 - Optional, Active
4. T-Shirt (Add-on): £8.00 - Optional, Active
5. Sibling Discount (Discount): -£15.00 - Optional, Active
6. Early Bird (Discount): -£10.00 - Optional, Inactive (expired)
```

### Tips:

1. **Base Fees**: Set as Required so they're automatically added
2. **Discounts**: Use negative amounts (e.g., -15)
3. **Camp-Specific**: Assign items to specific camps for unique pricing
4. **Global Items**: Leave "All Camps" for items available everywhere
5. **Inactive Items**: Keep for records but hide from parents
6. **Display Order**: Lower numbers show first

### How It Appears to Parents:

When registering, parents will see:

```
✅ Camp Fee (+£150.00) [Required, can't uncheck]
☐ Lunch Package (+£25.00)
☐ Extended Care (+£10.00)
☐ Sibling Discount (-£15.00)

Total: £150.00
```

As they check boxes, the total updates in real-time!

---

## 🚧 Next: Multi-Child Registration

**Status**: In Progress
**ETA**: Next

This will allow parents to:
- Register multiple children at once
- Share parent/emergency contact info
- Pay for all kids in one transaction
- Automatic sibling discounts (if configured)

