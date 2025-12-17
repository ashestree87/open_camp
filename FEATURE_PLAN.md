# Feature Implementation Plan

## 1. Multi-Child Registration ✅ (Implementing Now)

### Changes Needed:
- Update registration form to allow adding multiple children
- Each child gets their own form section
- Calculate total for all children
- Submit all registrations together with one payment
- Link registrations together with a `family_id` or `batch_id`

### UI Flow:
1. Select camp
2. Fill in parent/guardian info (once)
3. Add first child's info
4. Click "+ Add Another Child" button
5. Fill additional children
6. See total for all children
7. Complete one payment for all

## 2. Admin Pricing Management ✅ (Next)

### Changes Needed:
- Add pricing management UI in admin
- CRUD operations for pricing items
- Link pricing items to specific camps
- Set base price per camp
- Add/edit add-ons and discounts

### UI:
- New "Pricing" tab with full editor
- Create/Edit/Delete pricing items
- Toggle active/inactive
- Assign to specific camps or "all camps"

## 3. Form Customization (Future Enhancement)

### Changes Needed:
- Database table for form field configuration
- Admin UI to toggle fields on/off
- Mark fields as required/optional
- Reorder fields
- Add custom fields
- Dynamic form rendering based on config

### Complexity:
- High - requires significant refactoring
- Database schema changes
- Dynamic validation
- Conditional logic management

### Recommendation:
Start with fixed form fields, add customization later if needed.

---

## Implementation Order:
1. ✅ Multi-child registration (2-3 hours)
2. ✅ Pricing management UI (1-2 hours)
3. ⏳ Form customization (4-6 hours) - Optional

