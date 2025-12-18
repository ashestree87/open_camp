// ============================================================================
// Open Camp - Enhanced Worker with Camps, Pricing & Stripe Integration
// ============================================================================

interface Env {
  DB: D1Database
  KV: KVNamespace
  ALLOWED_ORIGIN?: string
  RESEND_API_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

// Types
interface Camp {
  id?: number
  name: string
  description: string
  start_date: string
  end_date: string
  age_min: number
  age_max: number
  max_spots: number
  spots_taken?: number
  status: 'active' | 'full' | 'archived'
  registration_status?: 'open' | 'paused' | 'closed'
  waitlist_enabled?: number
  waitlist_message?: string
  created_at?: string
  updated_at?: string
}

interface PricingItem {
  id?: number
  camp_id: number | null
  name: string
  description: string
  amount: number
  item_type: 'base_fee' | 'add_on' | 'discount'
  is_required: boolean
  is_active: boolean
  display_order: number
  created_at?: string
}

// Child-specific data
interface ChildData {
  childFullName: string
  childDob: string
  walkHomeAlone: string
  hasMedicalConditions: string
  medicalConditionsDetails: string
  hasAdditionalNeeds: string
  additionalNeedsDetails: string
  hasAllergies: string
  allergiesDetails: string
  hasMedication: string
  medicationDetails: string
  hasFurtherInfo: string
  furtherInfoDetails: string
}

interface RegistrationData {
  camp_id?: number  // Legacy format
  campId?: number   // New format
  selected_items?: number[]  // Legacy format
  selectedItems?: number[]   // New format
  email: string
  parentFullName: string
  address?: string
  phone: string
  emergency1Name: string
  emergency1Phone: string
  emergency1Relationship: string
  emergency2Name?: string
  emergency2Phone?: string
  emergency2Relationship?: string
  authorisedCollectors?: string
  // Multi-child support
  children?: ChildData[]
  // Legacy single-child fields (backwards compatibility)
  childFullName?: string
  childAge?: string
  childDob?: string
  walkHomeAlone?: string
  hasMedicalConditions?: string
  medicalConditionsDetails?: string
  hasAdditionalNeeds?: string
  additionalNeedsDetails?: string
  hasAllergies?: string
  allergiesDetails?: string
  hasMedication?: string
  medicationDetails?: string
  hasFurtherInfo?: string
  furtherInfoDetails?: string
  // Permissions (shared for all children)
  permissionPhotos: boolean
  permissionHealth: boolean
  permissionActivities: boolean
  permissionLocations: boolean
  permissionMeals: boolean
  permissionBathroom: boolean
  permissionFirstAid: boolean
  permissionEquipment: boolean
  permissionAppWaiver: boolean
  // Total and payment
  totalAmount?: number
  paymentStatus?: string
}

// Constants
const CLUB_EMAIL = 'camp@example.com'
const FROM_EMAIL = 'Open Camp <noreply@example.com>'

// Helper Functions
function corsHeaders(origin: string | null, allowedOrigin?: string): HeadersInit {
  const allowed = allowedOrigin || '*'
  return {
    'Access-Control-Allow-Origin': origin && (allowed === '*' || origin.includes(allowed)) ? origin : allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function errorResponse(message: string, status = 400, headers: HeadersInit = {}): Response {
  return jsonResponse({ error: message, success: false }, status, headers)
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization')
  console.log('Auth header present:', !!authHeader)
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('No Bearer token found')
    return false
  }
  
  const token = authHeader.substring(7)
  console.log('Token length:', token?.length)
  
  const storedHash = await env.KV.get('admin_password_hash')
  console.log('Stored hash present:', !!storedHash)
  if (!storedHash) {
    console.log('No stored hash found')
    return false
  }
  
  const tokenHash = await hashPassword(token)
  const matches = tokenHash === storedHash
  console.log('Auth matches:', matches)
  
  return matches
}

// Convert snake_case to camelCase for camp objects
function convertCampToCamelCase(camp: any): any {
  if (!camp) return null
  return {
    id: camp.id,
    name: camp.name,
    description: camp.description,
    startDate: camp.start_date,
    endDate: camp.end_date,
    ageMin: camp.age_min,
    ageMax: camp.age_max,
    maxSpots: camp.max_spots,
    spotsTaken: camp.spots_taken || 0,
    status: camp.status,
    registrationStatus: camp.registration_status || 'open',
    waitlistEnabled: camp.waitlist_enabled === 1,
    waitlistMessage: camp.waitlist_message || '',
    siblingDiscountEnabled: camp.sibling_discount_enabled === 1,
    siblingDiscountAmount: camp.sibling_discount_amount || 0,
    siblingDiscountType: camp.sibling_discount_type || 'fixed',
    createdAt: camp.created_at,
    updatedAt: camp.updated_at,
  }
}

// Convert snake_case to camelCase for pricing item objects
function convertPricingItemToCamelCase(item: any): any {
  if (!item) return null
  return {
    id: item.id,
    campId: item.camp_id,
    name: item.name,
    description: item.description,
    amount: item.amount,
    itemType: item.item_type,
    isRequired: item.is_required === 1 || item.is_required === true,
    isActive: item.is_active === 1 || item.is_active === true,
    displayOrder: item.display_order || 0,
    createdAt: item.created_at,
  }
}

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

async function createStripePaymentIntent(
  env: Env,
  amount: number,
  currency: string,
  metadata: Record<string, string>
): Promise<any> {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured')
  }

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: Math.round(amount * 100).toString(), // Convert to cents
      currency: currency,
      'automatic_payment_methods[enabled]': 'true',
      ...Object.entries(metadata).reduce((acc, [key, value]) => ({
        ...acc,
        [`metadata[${key}]`]: value
      }), {})
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`)
  }

  return response.json()
}

async function verifyStripeWebhook(
  request: Request,
  env: Env
): Promise<any> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Webhook secret not configured')
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    throw new Error('No signature provided')
  }

  // For production, implement full webhook verification
  // This is a simplified version
  const payload = await request.json()
  return payload
}

// ============================================================================
// CAMPS ENDPOINTS
// ============================================================================

async function handleGetCamps(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('includeArchived') === 'true'
    
    const statusFilter = includeArchived 
      ? "status IN ('active', 'full', 'archived')"
      : "status IN ('active', 'full')"
    
    const { results } = await env.DB.prepare(`
      SELECT 
        id, name, description, start_date, end_date,
        age_min, age_max, max_spots, spots_taken, status,
        registration_status, waitlist_enabled, waitlist_message,
        sibling_discount_enabled, sibling_discount_amount, sibling_discount_type,
        created_at, updated_at
      FROM camps 
      WHERE ${statusFilter}
      ORDER BY start_date ASC
    `).all()
    
    const camps = (results as any[]).map(convertCampToCamelCase)
    
    return jsonResponse({ success: true, camps }, 200, cors)
  } catch (error) {
    console.error('Get camps error:', error)
    return errorResponse('Failed to fetch camps', 500, cors)
  }
}

async function handleGetCamp(campId: string, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const camp = await env.DB.prepare(`
      SELECT * FROM camps WHERE id = ?
    `).bind(campId).first()
    
    if (!camp) {
      return errorResponse('Camp not found', 404, cors)
    }
    
    // Get pricing items for this camp
    const { results: pricingItems } = await env.DB.prepare(`
      SELECT * FROM pricing_items 
      WHERE (camp_id = ? OR camp_id IS NULL) AND is_active = 1
      ORDER BY display_order ASC
    `).bind(campId).all()
    
    return jsonResponse({
      success: true,
      camp,
      pricingItems,
      spotsRemaining: (camp.max_spots as number) - (camp.spots_taken as number || 0)
    }, 200, cors)
  } catch (error) {
    console.error('Get camp error:', error)
    return errorResponse('Failed to fetch camp', 500, cors)
  }
}

async function handleCreateCamp(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) {
      console.log('Create camp: Auth failed')
      return jsonResponse({
        success: false,
        error: 'Unauthorized - please login again',
        hint: 'Your session may have expired. Try refreshing the page and logging in again.'
      }, 401, cors)
    }
    
    const data: any = await request.json()
    
    // Handle both camelCase (from frontend) and snake_case
    const startDate = data.startDate || data.start_date
    const endDate = data.endDate || data.end_date
    const ageMin = data.ageMin || data.age_min
    const ageMax = data.ageMax || data.age_max
    const maxSpots = data.maxSpots || data.max_spots
    
    // Registration controls
    const registrationStatus = data.registrationStatus || data.registration_status || 'open'
    const waitlistEnabled = data.waitlistEnabled ?? data.waitlist_enabled ?? false
    const waitlistMessage = data.waitlistMessage || data.waitlist_message || ''
    
    // Sibling discount settings
    const siblingDiscountEnabled = data.siblingDiscountEnabled || data.sibling_discount_enabled || false
    const siblingDiscountAmount = data.siblingDiscountAmount || data.sibling_discount_amount || 0
    const siblingDiscountType = data.siblingDiscountType || data.sibling_discount_type || 'fixed'
    
    console.log('Creating camp with data:', {
      name: data.name,
      description: data.description,
      startDate,
      endDate,
      ageMin,
      ageMax,
      maxSpots,
      status: data.status,
      siblingDiscountEnabled,
      siblingDiscountAmount,
      siblingDiscountType
    })
    
    const result = await env.DB.prepare(`
      INSERT INTO camps (
        name, description, start_date, end_date, age_min, age_max, max_spots, status,
        registration_status, waitlist_enabled, waitlist_message,
        sibling_discount_enabled, sibling_discount_amount, sibling_discount_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description || '',
      startDate,
      endDate,
      ageMin,
      ageMax,
      maxSpots,
      data.status || 'active',
      registrationStatus,
      waitlistEnabled ? 1 : 0,
      waitlistMessage,
      siblingDiscountEnabled ? 1 : 0,
      siblingDiscountAmount,
      siblingDiscountType
    ).run()
    
    return jsonResponse({
      success: true,
      id: result.meta.last_row_id,
      message: 'Camp created successfully'
    }, 201, cors)
  } catch (error) {
    console.error('Create camp error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', errorMsg)
    console.error('Stack:', errorStack)
    
    // Return detailed error for debugging
    return jsonResponse({
      success: false,
      error: 'Failed to create camp',
      details: errorMsg,
      stack: errorStack?.split('\n').slice(0, 3).join('\n')
    }, 500, cors)
  }
}

async function handleUpdateCamp(campId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) {
      console.log('Update camp: Auth failed')
      return errorResponse('Unauthorized - please login again', 401, cors)
    }
    
    const data: any = await request.json()
    
    // Fetch existing camp to support partial updates
    const existingCamp = await env.DB.prepare(`
      SELECT * FROM camps WHERE id = ?
    `).bind(campId).first()
    
    if (!existingCamp) {
      return errorResponse('Camp not found', 404, cors)
    }
    
    // Merge with existing data - use incoming data if provided, else keep existing
    const name = data.name ?? existingCamp.name
    const description = data.description ?? existingCamp.description
    const startDate = data.startDate || data.start_date || existingCamp.start_date
    const endDate = data.endDate || data.end_date || existingCamp.end_date
    const ageMin = data.ageMin ?? data.age_min ?? existingCamp.age_min
    const ageMax = data.ageMax ?? data.age_max ?? existingCamp.age_max
    const maxSpots = data.maxSpots ?? data.max_spots ?? existingCamp.max_spots
    const status = data.status ?? existingCamp.status
    
    // Registration controls
    const registrationStatus = data.registrationStatus ?? data.registration_status ?? existingCamp.registration_status ?? 'open'
    const waitlistEnabled = data.waitlistEnabled ?? data.waitlist_enabled ?? existingCamp.waitlist_enabled ?? 0
    const waitlistMessage = data.waitlistMessage ?? data.waitlist_message ?? existingCamp.waitlist_message ?? ''
    
    // Sibling discount settings
    const siblingDiscountEnabled = data.siblingDiscountEnabled ?? data.sibling_discount_enabled ?? existingCamp.sibling_discount_enabled ?? 0
    const siblingDiscountAmount = data.siblingDiscountAmount ?? data.sibling_discount_amount ?? existingCamp.sibling_discount_amount ?? 0
    const siblingDiscountType = data.siblingDiscountType || data.sibling_discount_type || existingCamp.sibling_discount_type || 'fixed'
    
    await env.DB.prepare(`
      UPDATE camps 
      SET name = ?, description = ?, start_date = ?, end_date = ?,
          age_min = ?, age_max = ?, max_spots = ?, status = ?,
          registration_status = ?, waitlist_enabled = ?, waitlist_message = ?,
          sibling_discount_enabled = ?, sibling_discount_amount = ?, sibling_discount_type = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name,
      description,
      startDate,
      endDate,
      ageMin,
      ageMax,
      maxSpots,
      status,
      registrationStatus,
      waitlistEnabled ? 1 : 0,
      waitlistMessage,
      siblingDiscountEnabled ? 1 : 0,
      siblingDiscountAmount,
      siblingDiscountType,
      campId
    ).run()
    
    return jsonResponse({ success: true, message: 'Camp updated successfully' }, 200, cors)
  } catch (error) {
    console.error('Update camp error:', error)
    return errorResponse('Failed to update camp', 500, cors)
  }
}

async function handleDeleteCamp(campId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    // Archive instead of delete
    await env.DB.prepare(`
      UPDATE camps SET status = 'archived', updated_at = datetime('now') WHERE id = ?
    `).bind(campId).run()
    
    return jsonResponse({ success: true, message: 'Camp archived successfully' }, 200, cors)
  } catch (error) {
    console.error('Delete camp error:', error)
    return errorResponse('Failed to archive camp', 500, cors)
  }
}

// ============================================================================
// PRICING ENDPOINTS
// ============================================================================

async function handleGetPricing(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('includeArchived') === 'true'
    
    const activeFilter = includeArchived ? '' : 'WHERE p.is_active = 1'
    
    const { results } = await env.DB.prepare(`
      SELECT p.*, c.name as camp_name
      FROM pricing_items p
      LEFT JOIN camps c ON p.camp_id = c.id
      ${activeFilter}
      ORDER BY p.display_order ASC
    `).all()
    
    const items = (results as any[]).map(convertPricingItemToCamelCase)
    
    return jsonResponse({ success: true, items }, 200, cors)
  } catch (error) {
    console.error('Get pricing error:', error)
    return errorResponse('Failed to fetch pricing', 500, cors)
  }
}

async function handleCreatePricing(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const data: any = await request.json()
    
    // Handle both camelCase (frontend) and snake_case
    const campId = data.campId ?? data.camp_id ?? null
    const name = data.name
    const description = data.description || ''
    const amount = data.amount
    const itemType = data.itemType || data.item_type || 'add_on'
    const isRequired = data.isRequired ?? data.is_required ?? false
    const isActive = data.isActive ?? data.is_active ?? true
    const displayOrder = data.displayOrder ?? data.display_order ?? 0
    
    const result = await env.DB.prepare(`
      INSERT INTO pricing_items (
        camp_id, name, description, amount, item_type, is_required, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      campId,
      name,
      description,
      amount,
      itemType,
      isRequired ? 1 : 0,
      isActive ? 1 : 0,
      displayOrder
    ).run()
    
    return jsonResponse({
      success: true,
      id: result.meta.last_row_id,
      message: 'Pricing item created successfully'
    }, 201, cors)
  } catch (error) {
    console.error('Create pricing error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return errorResponse(`Failed to create pricing item: ${errorMsg}`, 500, cors)
  }
}

async function handleUpdatePricing(itemId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const data: any = await request.json()
    
    console.log('Updating pricing item:', itemId, 'with data:', JSON.stringify(data))
    
    // Get existing item first
    const existingItem = await env.DB.prepare(`
      SELECT * FROM pricing_items WHERE id = ?
    `).bind(parseInt(itemId)).first()
    
    if (!existingItem) {
      return errorResponse('Pricing item not found', 404, cors)
    }
    
    // Handle both camelCase (frontend) and snake_case, with fallback to existing values
    const name = data.name ?? (existingItem as any).name
    const description = data.description ?? (existingItem as any).description ?? ''
    const amount = data.amount ?? (existingItem as any).amount ?? 0
    const itemType = data.itemType ?? data.item_type ?? (existingItem as any).item_type ?? 'add_on'
    const isRequired = data.isRequired ?? data.is_required ?? (existingItem as any).is_required ?? false
    const isActive = data.isActive ?? data.is_active ?? (existingItem as any).is_active ?? true
    const displayOrder = data.displayOrder ?? data.display_order ?? (existingItem as any).display_order ?? 0
    // Special handling for campId - null is a valid value to unassign from camp
    const campId = 'campId' in data ? data.campId : ('camp_id' in data ? data.camp_id : (existingItem as any).camp_id)
    
    console.log('Parsed values:', { name, description, amount, itemType, isRequired, isActive, displayOrder, campId })
    
    await env.DB.prepare(`
      UPDATE pricing_items 
      SET name = ?, description = ?, amount = ?, item_type = ?,
          is_required = ?, is_active = ?, display_order = ?, camp_id = ?
      WHERE id = ?
    `).bind(
      name,
      description,
      amount,
      itemType,
      (isRequired === 1 || isRequired === true) ? 1 : 0,
      (isActive === 1 || isActive === true) ? 1 : 0,
      displayOrder,
      campId,
      parseInt(itemId)
    ).run()
    
    return jsonResponse({ success: true, message: 'Pricing item updated successfully' }, 200, cors)
  } catch (error) {
    console.error('Update pricing error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Stack:', errorStack)
    return jsonResponse({
      success: false,
      error: 'Failed to update pricing item',
      details: errorMsg,
    }, 500, cors)
  }
}

async function handleDeletePricing(itemId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    await env.DB.prepare(`DELETE FROM pricing_items WHERE id = ?`).bind(itemId).run()
    
    return jsonResponse({ success: true, message: 'Pricing item deleted successfully' }, 200, cors)
  } catch (error) {
    console.error('Delete pricing error:', error)
    return errorResponse('Failed to delete pricing item', 500, cors)
  }
}

// ============================================================================
// PAYMENT INTENT ENDPOINT
// ============================================================================

async function handleCreatePaymentIntent(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const { campId, selectedItems, email, childrenCount } = await request.json() as {
      campId: number
      selectedItems: number[]
      email: string
      childrenCount: number
    }
    
    const numChildren = childrenCount || 1
    
    // Get camp details for sibling discount
    const camp = await env.DB.prepare(`
      SELECT sibling_discount_enabled, sibling_discount_amount, sibling_discount_type 
      FROM camps WHERE id = ?
    `).bind(campId).first()
    
    // Calculate base total from pricing items
    let itemTotal = 0
    if (selectedItems && selectedItems.length > 0) {
      const placeholders = selectedItems.map(() => '?').join(',')
      const { results } = await env.DB.prepare(`
        SELECT id, name, amount FROM pricing_items WHERE id IN (${placeholders})
      `).bind(...selectedItems).all()
      itemTotal = (results as any[]).reduce((sum: number, item: any) => sum + item.amount, 0)
    }
    
    // Calculate total: per-child pricing × number of children
    let totalAmount = itemTotal * numChildren
    
    // Apply sibling discount for 2+ children
    let siblingDiscount = 0
    if (numChildren >= 2 && camp && (camp as any).sibling_discount_enabled === 1) {
      const discountAmount = (camp as any).sibling_discount_amount || 0
      const discountType = (camp as any).sibling_discount_type || 'fixed'
      
      // Apply discount for each additional child (2nd, 3rd, etc.)
      const additionalChildren = numChildren - 1
      
      if (discountType === 'percentage') {
        // Percentage discount on each additional child's total
        siblingDiscount = (itemTotal * (discountAmount / 100)) * additionalChildren
      } else {
        // Fixed discount per additional child
        siblingDiscount = discountAmount * additionalChildren
      }
      
      totalAmount = Math.max(totalAmount - siblingDiscount, 0)
    }
    
    // Skip Stripe for free registrations (amount < 2 AED minimum)
    if (totalAmount < 2) {
      return jsonResponse({
        success: true,
        clientSecret: null,
        amount: 0,
        siblingDiscount,
        currency: 'aed',
        isFree: true
      }, 200, cors)
    }
    
    // Create Stripe payment intent
    const paymentIntent = await createStripePaymentIntent(env, totalAmount, 'aed', {
      camp_id: campId.toString(),
      email: email,
      children_count: numChildren.toString(),
      sibling_discount: siblingDiscount.toString(),
    })
    
    return jsonResponse({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      siblingDiscount,
      currency: 'aed',
      isFree: false
    }, 200, cors)
  } catch (error) {
    console.error('Create payment intent error:', error)
    const message = error instanceof Error ? error.message : 'Payment setup failed'
    // Include more details for debugging
    const envKeys = Object.keys(env || {})
    return jsonResponse({ 
      error: message,
      debug: env.STRIPE_SECRET_KEY ? 'Key exists' : 'Key missing',
      availableEnvKeys: envKeys,
      hasEnv: !!env
    }, 500, cors)
  }
}

// ============================================================================
// ENHANCED REGISTRATION SUBMISSION
// ============================================================================

async function handleSubmit(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const data: RegistrationData = await request.json()
    
    // Normalize field names (support both formats)
    const campId = data.campId || data.camp_id
    const selectedItems = data.selectedItems || data.selected_items || []
    
    if (!campId) {
      return errorResponse('Camp selection required', 400, cors)
    }
    
    // Check camp capacity
    const camp = await env.DB.prepare(`
      SELECT id, max_spots, spots_taken, status FROM camps WHERE id = ?
    `).bind(campId).first()
    
    if (!camp) {
      return errorResponse('Camp not found', 404, cors)
    }
    
    if (camp.status !== 'active') {
      return errorResponse('Camp is not available for registration', 400, cors)
    }
    
    // Determine children to register
    const children: ChildData[] = data.children && data.children.length > 0
      ? data.children
      : [{
          // Legacy single-child format
          childFullName: data.childFullName || '',
          childDob: data.childDob || '',
          walkHomeAlone: data.walkHomeAlone || 'no',
          hasMedicalConditions: data.hasMedicalConditions || 'no',
          medicalConditionsDetails: data.medicalConditionsDetails || '',
          hasAdditionalNeeds: data.hasAdditionalNeeds || 'no',
          additionalNeedsDetails: data.additionalNeedsDetails || '',
          hasAllergies: data.hasAllergies || 'no',
          allergiesDetails: data.allergiesDetails || '',
          hasMedication: data.hasMedication || 'no',
          medicationDetails: data.medicationDetails || '',
          hasFurtherInfo: data.hasFurtherInfo || 'no',
          furtherInfoDetails: data.furtherInfoDetails || '',
        }]
    
    const numChildren = children.length
    const spotsRemaining = (camp.max_spots as number) - (camp.spots_taken as number || 0)
    
    if (numChildren > spotsRemaining) {
      return errorResponse(`Only ${spotsRemaining} spots available, but ${numChildren} children submitted`, 400, cors)
    }
    
    // Calculate total amount (per child × number of children)
    let itemTotal = 0
    if (selectedItems.length > 0) {
      const placeholders = selectedItems.map(() => '?').join(',')
      const { results } = await env.DB.prepare(`
        SELECT SUM(amount) as total FROM pricing_items WHERE id IN (${placeholders})
      `).bind(...selectedItems).all()
      itemTotal = (results[0] as any)?.total || 0
    }
    
    // Calculate base total
    let totalAmount = data.totalAmount || (itemTotal * numChildren)
    
    // Apply sibling discount if enabled and multiple children
    let siblingDiscount = 0
    if (numChildren >= 2 && (camp as any).sibling_discount_enabled === 1) {
      const discountAmount = (camp as any).sibling_discount_amount || 0
      const discountType = (camp as any).sibling_discount_type || 'fixed'
      
      // Discount applies to each additional child (2nd, 3rd, etc.)
      const additionalChildren = numChildren - 1
      
      if (discountType === 'percentage') {
        siblingDiscount = (itemTotal * (discountAmount / 100)) * additionalChildren
      } else {
        siblingDiscount = discountAmount * additionalChildren
      }
      
      // Only apply discount if not already provided in totalAmount
      if (!data.totalAmount) {
        totalAmount = Math.max(totalAmount - siblingDiscount, 0)
      }
    }
    
    // Insert registrations (one per child)
    const registrationIds: number[] = []
    
    // Determine registration status (waitlist if camp is full and waitlist enabled)
    const regStatus = data.registrationStatus || 'confirmed'
    
    for (const child of children) {
      const regResult = await env.DB.prepare(`
        INSERT INTO registrations (
          camp_id, email, child_full_name, child_age, child_dob, parent_full_name,
          address, phone, emergency1_name, emergency1_phone, emergency1_relationship,
          emergency2_name, emergency2_phone, emergency2_relationship,
          authorised_collectors, walk_home_alone,
          has_medical_conditions, medical_conditions_details,
          has_additional_needs, additional_needs_details,
          has_allergies, allergies_details,
          has_medication, medication_details,
          has_further_info, further_info_details,
          permission_photos, permission_health, permission_activities,
          permission_locations, permission_meals, permission_bathroom,
          permission_first_aid, permission_equipment, permission_app_waiver,
          total_amount, payment_status, registration_status, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, datetime('now')
        )
      `).bind(
        campId,
        data.email,
        child.childFullName,
        '', // childAge deprecated
        child.childDob,
        data.parentFullName,
        data.address || '',
        data.phone,
        data.emergency1Name,
        data.emergency1Phone,
        data.emergency1Relationship,
        data.emergency2Name || '',
        data.emergency2Phone || '',
        data.emergency2Relationship || '',
        data.authorisedCollectors || '',
        child.walkHomeAlone,
        child.hasMedicalConditions,
        child.medicalConditionsDetails || '',
        child.hasAdditionalNeeds,
        child.additionalNeedsDetails || '',
        child.hasAllergies,
        child.allergiesDetails || '',
        child.hasMedication,
        child.medicationDetails || '',
        child.hasFurtherInfo,
        child.furtherInfoDetails || '',
        data.permissionPhotos ? 1 : 0,
        data.permissionHealth ? 1 : 0,
        data.permissionActivities ? 1 : 0,
        data.permissionLocations ? 1 : 0,
        data.permissionMeals ? 1 : 0,
        data.permissionBathroom ? 1 : 0,
        data.permissionFirstAid ? 1 : 0,
        data.permissionEquipment ? 1 : 0,
        data.permissionAppWaiver ? 1 : 0,
        totalAmount / numChildren, // Split total across children
        data.paymentStatus || (totalAmount > 0 ? 'pending' : 'paid'),
        regStatus
      ).run()
      
      const registrationId = regResult.meta.last_row_id as number
      registrationIds.push(registrationId)
      
      // Insert registration items for this child
      if (selectedItems.length > 0) {
        for (const itemId of selectedItems) {
          const item = await env.DB.prepare(`
            SELECT amount FROM pricing_items WHERE id = ?
          `).bind(itemId).first()
          
          if (item) {
            await env.DB.prepare(`
              INSERT INTO registration_items (registration_id, pricing_item_id, quantity, amount)
              VALUES (?, ?, 1, ?)
            `).bind(registrationId, itemId, item.amount).run()
          }
        }
      }
    }
    
    // Update camp spots (by number of children) - only if not on waitlist
    if (regStatus !== 'waitlist') {
      await env.DB.prepare(`
        UPDATE camps SET spots_taken = spots_taken + ? WHERE id = ?
      `).bind(numChildren, campId).run()
    }
    
    // Send emails (async, don't block response)
    const childNames = children.map(c => c.childFullName).join(', ')
    sendEmails(env, data.email, childNames, data.parentFullName, data.phone, campId)
      .catch(err => console.error('Email send error:', err))
    
    return jsonResponse({
      success: true,
      ids: registrationIds,
      childCount: numChildren,
      totalAmount,
      message: `Successfully registered ${numChildren} ${numChildren === 1 ? 'child' : 'children'}`
    }, 201, cors)
  } catch (error) {
    console.error('Submit error:', error)
    return errorResponse('Failed to submit registration', 500, cors)
  }
}

// Helper function to send registration emails
async function sendEmails(env: Env, parentEmail: string, childNames: string, parentName: string, phone: string, campId: number) {
  if (!env.RESEND_API_KEY) return
  
  const camp = await env.DB.prepare('SELECT name FROM camps WHERE id = ?').bind(campId).first()
  const campName = (camp as any)?.name || 'Camp'
  
  // Send confirmation to parent
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: parentEmail,
      subject: `Registration Confirmed - ${campName}`,
      text: `Dear ${parentName},\n\nThank you for registering ${childNames} for ${campName}.\n\nWe look forward to seeing you!\n\nBest regards,\nOpen Camp Team`
    }),
  })
  
  // Send notification to club
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: CLUB_EMAIL,
      subject: `New Registration - ${campName}`,
      text: `New registration received!\n\nChild(ren): ${childNames}\nParent: ${parentName}\nEmail: ${parentEmail}\nPhone: ${phone}\nCamp: ${campName}`
    }),
  })
}

// ============================================================================
// AUTH & ADMIN ENDPOINTS
// ============================================================================

async function handleAuth(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const { username, password } = await request.json() as { username: string; password: string }
    
    if (!username || !password) {
      return errorResponse('Username and password required', 400, cors)
    }
    
    const storedUsername = await env.KV.get('admin_username') || 'admin'
    if (username !== storedUsername) {
      return errorResponse('Invalid credentials', 401, cors)
    }
    
    const storedHash = await env.KV.get('admin_password_hash')
    if (!storedHash) {
      return errorResponse('Admin not configured', 500, cors)
    }
    
    const passwordHash = await hashPassword(password)
    if (passwordHash !== storedHash) {
      return errorResponse('Invalid credentials', 401, cors)
    }
    
    return jsonResponse({
      success: true,
      token: password,
      message: 'Authentication successful',
    }, 200, cors)
  } catch (error) {
    console.error('Auth error:', error)
    return errorResponse('Authentication failed', 500, cors)
  }
}

async function handleGetRegistrations(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const url = new URL(request.url)
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
    
    const whereClause = includeDeleted ? '' : 'WHERE r.deleted_at IS NULL'
    
    const { results } = await env.DB.prepare(`
      SELECT 
        r.*,
        c.name as camp_name
      FROM registrations r
      LEFT JOIN camps c ON r.camp_id = c.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `).all()
    
    return jsonResponse({ 
      success: true, 
      registrations: results,
      count: results.length,
    }, 200, cors)
  } catch (error) {
    console.error('Get registrations error:', error)
    return errorResponse('Failed to fetch registrations', 500, cors)
  }
}

async function handleDeleteRegistration(regId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const data: any = await request.json().catch(() => ({}))
    const reason = data.reason || 'Deleted by admin'
    
    // Get the registration first to check status and update spots
    const registration = await env.DB.prepare(`
      SELECT id, camp_id, registration_status, deleted_at FROM registrations WHERE id = ?
    `).bind(regId).first()
    
    if (!registration) {
      return errorResponse('Registration not found', 404, cors)
    }
    
    if (registration.deleted_at) {
      return errorResponse('Registration already deleted', 400, cors)
    }
    
    // Soft delete - keep stub of info for historical accuracy
    await env.DB.prepare(`
      UPDATE registrations 
      SET deleted_at = datetime('now'),
          deleted_reason = ?,
          -- Clear sensitive personal data but keep camp and dates for stats
          email = '[deleted]',
          phone = '[deleted]',
          address = '[deleted]',
          emergency1_name = '[deleted]',
          emergency1_phone = '[deleted]',
          emergency2_name = '[deleted]',
          emergency2_phone = '[deleted]',
          authorised_collectors = '[deleted]',
          medical_conditions_details = '[deleted]',
          additional_needs_details = '[deleted]',
          allergies_details = '[deleted]',
          medication_details = '[deleted]',
          further_info_details = '[deleted]'
      WHERE id = ?
    `).bind(reason, regId).run()
    
    // If was confirmed (not waitlist), release the spot back
    if (registration.registration_status !== 'waitlist') {
      await env.DB.prepare(`
        UPDATE camps SET spots_taken = MAX(spots_taken - 1, 0) WHERE id = ?
      `).bind(registration.camp_id).run()
    }
    
    return jsonResponse({ success: true, message: 'Registration deleted' }, 200, cors)
  } catch (error) {
    console.error('Delete registration error:', error)
    return errorResponse('Failed to delete registration', 500, cors)
  }
}

async function handleUpdateRegistration(regId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const data: any = await request.json()
    
    // Build update query dynamically for provided fields
    const allowedFields = [
      'child_full_name', 'child_dob', 'parent_full_name', 'email', 'phone', 'address',
      'emergency1_name', 'emergency1_phone', 'emergency1_relationship',
      'emergency2_name', 'emergency2_phone', 'emergency2_relationship',
      'authorised_collectors', 'walk_home_alone',
      'has_medical_conditions', 'medical_conditions_details',
      'has_additional_needs', 'additional_needs_details',
      'has_allergies', 'allergies_details',
      'has_medication', 'medication_details',
      'has_further_info', 'further_info_details',
      'permission_photos', 'permission_health', 'permission_activities',
      'permission_locations', 'permission_meals', 'permission_bathroom',
      'permission_first_aid', 'permission_equipment', 'permission_app_waiver',
      'payment_status', 'total_amount', 'admin_notes', 'registration_status'
    ]
    
    const updates: string[] = []
    const values: any[] = []
    
    for (const field of allowedFields) {
      if (field in data) {
        updates.push(`${field} = ?`)
        values.push(data[field])
      }
    }
    
    if (updates.length === 0) {
      return errorResponse('No valid fields to update', 400, cors)
    }
    
    values.push(regId)
    
    await env.DB.prepare(`
      UPDATE registrations SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run()
    
    return jsonResponse({ success: true, message: 'Registration updated successfully' }, 200, cors)
  } catch (error: any) {
    console.error('Update registration error:', error)
    return jsonResponse({
      success: false,
      error: 'Failed to update registration',
      details: error.message
    }, 500, cors)
  }
}

async function handleGetAdminConfig(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const { results: camps } = await env.DB.prepare(`
      SELECT id, name, max_spots, spots_taken FROM camps WHERE status = 'active'
    `).all()
    
    return jsonResponse({
      success: true,
      camps: camps || [],
    }, 200, cors)
  } catch (error) {
    console.error('Get admin config error:', error)
    return errorResponse('Failed to get config', 500, cors)
  }
}

async function handlePostAdminConfig(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    // This is now handled by camp-specific updates
    return jsonResponse({
      success: true,
      message: 'Use /api/camps/:id to update camp settings'
    }, 200, cors)
  } catch (error) {
    console.error('Post admin config error:', error)
    return errorResponse('Failed to update config', 500, cors)
  }
}

async function handleLegacyStatus(env: Env, cors: HeadersInit): Promise<Response> {
  try {
    // Get first active camp for legacy compatibility
    const camp = await env.DB.prepare(`
      SELECT max_spots, spots_taken FROM camps WHERE status = 'active' LIMIT 1
    `).first()
    
    if (!camp) {
      return jsonResponse({
        spotsLeft: 0,
        total: 0,
        max: 0,
        isFull: true,
      }, 200, cors)
    }
    
    const spotsLeft = (camp.max_spots as number) - (camp.spots_taken as number || 0)
    
    return jsonResponse({
      spotsLeft: Math.max(0, spotsLeft),
      total: camp.spots_taken || 0,
      max: camp.max_spots,
      isFull: spotsLeft <= 0,
    }, 200, cors)
  } catch (error) {
    console.error('Legacy status error:', error)
    return errorResponse('Failed to get status', 500, cors)
  }
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN)
    
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    
    try {
      // Camps endpoints
      if (path === '/api/camps' && method === 'GET') {
        return handleGetCamps(request, env, cors)
      }
      if (path.match(/^\/api\/camps\/\d+$/) && method === 'GET') {
        const campId = path.split('/')[3]
        return handleGetCamp(campId, env, cors)
      }
      if (path === '/api/camps' && method === 'POST') {
        return handleCreateCamp(request, env, cors)
      }
      if (path.match(/^\/api\/camps\/\d+$/) && method === 'PUT') {
        const campId = path.split('/')[3]
        return handleUpdateCamp(campId, request, env, cors)
      }
      if (path.match(/^\/api\/camps\/\d+$/) && method === 'DELETE') {
        const campId = path.split('/')[3]
        return handleDeleteCamp(campId, request, env, cors)
      }
      
      // Pricing endpoints
      if (path === '/api/pricing' && method === 'GET') {
        return handleGetPricing(request, env, cors)
      }
      if (path === '/api/pricing' && method === 'POST') {
        return handleCreatePricing(request, env, cors)
      }
      if (path.match(/^\/api\/pricing\/\d+$/) && method === 'PUT') {
        const itemId = path.split('/')[3]
        return handleUpdatePricing(itemId, request, env, cors)
      }
      if (path.match(/^\/api\/pricing\/\d+$/) && method === 'DELETE') {
        const itemId = path.split('/')[3]
        return handleDeletePricing(itemId, request, env, cors)
      }
      
      // Payment endpoint
      if (path === '/api/create-payment-intent' && method === 'POST') {
        return handleCreatePaymentIntent(request, env, cors)
      }
      
      // Registration submission
      if (path === '/api/submit' && method === 'POST') {
        return handleSubmit(request, env, cors)
      }
      
      // Auth endpoints
      if (path === '/api/auth' && method === 'POST') {
        return handleAuth(request, env, cors)
      }
      
      // Registrations endpoints
      if (path === '/api/registrations' && method === 'GET') {
        return handleGetRegistrations(request, env, cors)
      }
      if (path.match(/^\/api\/registrations\/\d+$/) && method === 'PUT') {
        const regId = path.split('/')[3]
        return handleUpdateRegistration(regId, request, env, cors)
      }
      if (path.match(/^\/api\/registrations\/\d+$/) && method === 'DELETE') {
        const regId = path.split('/')[3]
        return handleDeleteRegistration(regId, request, env, cors)
      }
      
      // Admin config endpoints  
      if (path === '/api/admin-config' && method === 'GET') {
        return handleGetAdminConfig(request, env, cors)
      }
      if (path === '/api/admin-config' && method === 'POST') {
        return handlePostAdminConfig(request, env, cors)
      }
      
      // Legacy status endpoint (for old single-camp mode)
      if (path === '/api/status' && method === 'GET') {
        return handleLegacyStatus(env, cors)
      }
      
      return errorResponse('Not found', 404, cors)
    } catch (error) {
      console.error('Unhandled error:', error)
      return errorResponse('Internal server error', 500, cors)
    }
  },
}

