# Open Camp Enhancement Plan

## ✅ Completed
- [x] Database schema updated with camps, pricing_items, and registration_items tables
- [x] Added camp_id, total_amount, payment_status to registrations
- [x] Created default camp and sample pricing items
- [x] Updated TypeScript types

## 🚧 In Progress

### Phase 1: Admin UI Enhancement
- [ ] Create tabbed admin interface (Dashboard, Camps, Pricing, Registrations)
- [ ] Camps management page (CRUD operations)
- [ ] Pricing management page (CRUD operations)
- [ ] Update registrations view to show camp and pricing details

### Phase 2: Registration Form Updates  
- [ ] Add camp selection dropdown
- [ ] Display camp details (dates, age range, spots available)
- [ ] Show pricing calculator with selected items
- [ ] Add payment information capture
- [ ] Calculate total with discounts

### Phase 3: Worker API Updates
- [ ] GET /api/camps - list all active camps
- [ ] GET /api/camps/:id - get camp with pricing
- [ ] POST /api/camps - create camp (admin)
- [ ] PUT /api/camps/:id - update camp (admin)
- [ ] DELETE /api/camps/:id - archive camp (admin)
- [ ] GET /api/pricing - list pricing items
- [ ] POST /api/pricing - create pricing item (admin)
- [ ] PUT /api/pricing/:id - update pricing item (admin)
- [ ] DELETE /api/pricing/:id - delete pricing item (admin)
- [ ] Update POST /api/submit to handle camp selection and pricing
- [ ] Update GET /api/registrations to include camp and pricing data

### Phase 4: Advanced Features
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email invoices with payment details
- [ ] Discount code system
- [ ] Waitlist functionality
- [ ] Multi-camp registration discount

## 🎯 Next Steps
1. Start with Admin UI - create camp management interface
2. Update Worker API endpoints
3. Update registration form
4. Test end-to-end flow

## 💡 Design Decisions
- Keep base camp free model, but allow pricing configuration
- Support both global and camp-specific pricing items
- Allow percentage or fixed-amount discounts
- Track payment status separately from registration
- Support partial payments and refunds

