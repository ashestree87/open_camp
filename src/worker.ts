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

interface RegistrationData {
  camp_id: number
  selected_items: number[]
  email: string
  childFullName: string
  childAge: string
  childDob: string
  parentFullName: string
  address: string
  phone: string
  emergency1Name: string
  emergency1Phone: string
  emergency1Relationship: string
  emergency2Name: string
  emergency2Phone: string
  emergency2Relationship: string
  authorisedCollectors: string
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
  permissionPhotos: boolean
  permissionHealth: boolean
  permissionActivities: boolean
  permissionLocations: boolean
  permissionMeals: boolean
  permissionBathroom: boolean
  permissionFirstAid: boolean
  permissionEquipment: boolean
  permissionAppWaiver: boolean
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
    isRequired: item.is_required,
    isActive: item.is_active,
    displayOrder: item.display_order,
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

async function handleGetCamps(env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        id, name, description, start_date, end_date,
        age_min, age_max, max_spots, spots_taken, status,
        created_at, updated_at
      FROM camps 
      WHERE status IN ('active', 'full')
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
    
    console.log('Creating camp with data:', {
      name: data.name,
      description: data.description,
      startDate,
      endDate,
      ageMin,
      ageMax,
      maxSpots,
      status: data.status
    })
    
    const result = await env.DB.prepare(`
      INSERT INTO camps (
        name, description, start_date, end_date, age_min, age_max, max_spots, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description || '',
      startDate,
      endDate,
      ageMin,
      ageMax,
      maxSpots,
      data.status || 'active'
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
    
    // Handle both camelCase (from frontend) and snake_case
    const startDate = data.startDate || data.start_date
    const endDate = data.endDate || data.end_date
    const ageMin = data.ageMin || data.age_min
    const ageMax = data.ageMax || data.age_max
    const maxSpots = data.maxSpots || data.max_spots
    
    await env.DB.prepare(`
      UPDATE camps 
      SET name = ?, description = ?, start_date = ?, end_date = ?,
          age_min = ?, age_max = ?, max_spots = ?, status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name,
      data.description,
      startDate,
      endDate,
      ageMin,
      ageMax,
      maxSpots,
      data.status,
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

async function handleGetPricing(env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT p.*, c.name as camp_name
      FROM pricing_items p
      LEFT JOIN camps c ON p.camp_id = c.id
      WHERE p.is_active = 1
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
    
    const data: PricingItem = await request.json()
    
    const result = await env.DB.prepare(`
      INSERT INTO pricing_items (
        camp_id, name, description, amount, item_type, is_required, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.camp_id,
      data.name,
      data.description || '',
      data.amount,
      data.item_type,
      data.is_required ? 1 : 0,
      data.is_active ? 1 : 0,
      data.display_order || 0
    ).run()
    
    return jsonResponse({
      success: true,
      id: result.meta.last_row_id,
      message: 'Pricing item created successfully'
    }, 201, cors)
  } catch (error) {
    console.error('Create pricing error:', error)
    return errorResponse('Failed to create pricing item', 500, cors)
  }
}

async function handleUpdatePricing(itemId: string, request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) return errorResponse('Unauthorized', 401, cors)
    
    const data: Partial<PricingItem> = await request.json()
    
    await env.DB.prepare(`
      UPDATE pricing_items 
      SET name = ?, description = ?, amount = ?, item_type = ?,
          is_required = ?, is_active = ?, display_order = ?
      WHERE id = ?
    `).bind(
      data.name,
      data.description,
      data.amount,
      data.item_type,
      data.is_required ? 1 : 0,
      data.is_active ? 1 : 0,
      data.display_order,
      itemId
    ).run()
    
    return jsonResponse({ success: true, message: 'Pricing item updated successfully' }, 200, cors)
  } catch (error) {
    console.error('Update pricing error:', error)
    return errorResponse('Failed to update pricing item', 500, cors)
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
    const { campId, selectedItems, email, childName } = await request.json() as {
      campId: number
      selectedItems: number[]
      email: string
      childName: string
    }
    
    // Calculate total amount
    const placeholders = selectedItems.map(() => '?').join(',')
    const { results } = await env.DB.prepare(`
      SELECT id, name, amount FROM pricing_items WHERE id IN (${placeholders})
    `).bind(...selectedItems).all()
    
    const totalAmount = (results as any[]).reduce((sum, item) => sum + item.amount, 0)
    
    // Create Stripe payment intent
    const paymentIntent = await createStripePaymentIntent(env, totalAmount, 'gbp', {
      camp_id: campId.toString(),
      email: email,
      child_name: childName,
    })
    
    return jsonResponse({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      currency: 'gbp'
    }, 200, cors)
  } catch (error) {
    console.error('Create payment intent error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Payment setup failed', 500, cors)
  }
}

// ============================================================================
// ENHANCED REGISTRATION SUBMISSION
// ============================================================================

async function handleSubmit(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const data: RegistrationData = await request.json()
    
    // Validate required fields
    if (!data.camp_id) {
      return errorResponse('Camp selection required', 400, cors)
    }
    
    // Check camp capacity
    const camp = await env.DB.prepare(`
      SELECT id, max_spots, spots_taken, status FROM camps WHERE id = ?
    `).bind(data.camp_id).first()
    
    if (!camp) {
      return errorResponse('Camp not found', 404, cors)
    }
    
    if (camp.status !== 'active') {
      return errorResponse('Camp is not available for registration', 400, cors)
    }
    
    const spotsRemaining = (camp.max_spots as number) - (camp.spots_taken as number || 0)
    if (spotsRemaining <= 0) {
      return errorResponse('Camp is full', 400, cors)
    }
    
    // Calculate total amount
    let totalAmount = 0
    if (data.selected_items && data.selected_items.length > 0) {
      const placeholders = data.selected_items.map(() => '?').join(',')
      const { results } = await env.DB.prepare(`
        SELECT SUM(amount) as total FROM pricing_items WHERE id IN (${placeholders})
      `).bind(...data.selected_items).all()
      totalAmount = (results[0] as any)?.total || 0
    }
    
    // Insert registration
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
        total_amount, payment_status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, datetime('now')
      )
    `).bind(
      data.camp_id,
      data.email,
      data.childFullName,
      data.childAge || '',
      data.childDob,
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
      data.walkHomeAlone,
      data.hasMedicalConditions,
      data.medicalConditionsDetails || '',
      data.hasAdditionalNeeds,
      data.additionalNeedsDetails || '',
      data.hasAllergies,
      data.allergiesDetails || '',
      data.hasMedication,
      data.medicationDetails || '',
      data.hasFurtherInfo,
      data.furtherInfoDetails || '',
      data.permissionPhotos ? 1 : 0,
      data.permissionHealth ? 1 : 0,
      data.permissionActivities ? 1 : 0,
      data.permissionLocations ? 1 : 0,
      data.permissionMeals ? 1 : 0,
      data.permissionBathroom ? 1 : 0,
      data.permissionFirstAid ? 1 : 0,
      data.permissionEquipment ? 1 : 0,
      data.permissionAppWaiver ? 1 : 0,
      totalAmount,
      totalAmount > 0 ? 'pending' : 'paid'
    ).run()
    
    const registrationId = regResult.meta.last_row_id
    
    // Insert registration items
    if (data.selected_items && data.selected_items.length > 0) {
      for (const itemId of data.selected_items) {
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
    
    // Update camp spots
    await env.DB.prepare(`
      UPDATE camps SET spots_taken = spots_taken + 1 WHERE id = ?
    `).bind(data.camp_id).run()
    
    return jsonResponse({
      success: true,
      id: registrationId,
      totalAmount,
      message: 'Registration successful'
    }, 201, cors)
  } catch (error) {
    console.error('Submit error:', error)
    return errorResponse('Failed to submit registration', 500, cors)
  }
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
    
    const { results } = await env.DB.prepare(`
      SELECT 
        r.id, r.camp_id, r.email, r.child_full_name as childFullName,
        r.child_age as childAge, r.child_dob as childDob,
        r.parent_full_name as parentFullName, r.address, r.phone,
        r.total_amount as totalAmount, r.payment_status as paymentStatus,
        r.payment_reference as paymentReference, r.created_at as createdAt,
        c.name as campName
      FROM registrations r
      LEFT JOIN camps c ON r.camp_id = c.id
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
        return handleGetCamps(env, cors)
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
        return handleGetPricing(env, cors)
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
      
      // Registrations endpoint
      if (path === '/api/registrations' && method === 'GET') {
        return handleGetRegistrations(request, env, cors)
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

