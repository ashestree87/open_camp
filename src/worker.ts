// ============================================================================
// Open Camp - Kids Camp Registration - Cloudflare Worker
// ============================================================================

interface Env {
  DB: D1Database
  KV: KVNamespace
  ALLOWED_ORIGIN?: string
  RESEND_API_KEY?: string
}

interface RegistrationData {
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

// Resend API types
interface ResendEmailRequest {
  from: string
  to: string | string[]
  subject: string
  text: string
  html?: string
}

interface ResendEmailResponse {
  id?: string
  error?: {
    message: string
    name: string
  }
}

// Club email for notifications - UPDATE THIS FOR YOUR ORGANIZATION
const CLUB_EMAIL = 'camp@example.com'
const FROM_EMAIL = 'Open Camp <noreply@example.com>'

const DEFAULT_MAX_SPOTS = 20

// ============================================================================
// Helper Functions
// ============================================================================

// CORS headers
function corsHeaders(origin: string | null, allowedOrigin?: string): HeadersInit {
  const allowed = allowedOrigin || '*'
  return {
    'Access-Control-Allow-Origin': origin && (allowed === '*' || origin.includes(allowed)) ? origin : allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

// JSON response helper
function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

// Error response helper
function errorResponse(message: string, status = 400, headers: HeadersInit = {}): Response {
  return jsonResponse({ error: message, success: false }, status, headers)
}

// Hash password with SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify auth token
async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  const storedHash = await env.KV.get('admin_password_hash')
  
  if (!storedHash) {
    return false
  }
  
  const tokenHash = await hashPassword(token)
  return tokenHash === storedHash
}

// Get max spots from KV
async function getMaxSpots(env: Env): Promise<number> {
  const maxSpots = await env.KV.get('max_spots')
  return maxSpots ? parseInt(maxSpots, 10) : DEFAULT_MAX_SPOTS
}

// Get registration count from D1
async function getRegistrationCount(env: Env): Promise<number> {
  const result = await env.DB.prepare('SELECT COUNT(*) as count FROM registrations').first<{ count: number }>()
  return result?.count || 0
}

// ============================================================================
// Email Functions (Resend API)
// ============================================================================

async function sendEmail(
  apiKey: string,
  email: ResendEmailRequest
): Promise<ResendEmailResponse> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(email),
    })

    const data = await response.json() as ResendEmailResponse
    
    if (!response.ok) {
      console.error('Resend API error:', data.error)
      return { error: data.error }
    }

    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    return { error: { message: 'Failed to send email', name: 'SendError' } }
  }
}

// Send confirmation email to parent
async function sendParentConfirmationEmail(
  apiKey: string,
  data: RegistrationData
): Promise<void> {
  const emailContent = `
Hello ${data.parentFullName},

Thank you for registering ${data.childFullName} for Kids Camp!

REGISTRATION DETAILS
--------------------
Child: ${data.childFullName}
Age: ${data.childAge || 'Not specified'}
Date of Birth: ${data.childDob}

Parent/Guardian: ${data.parentFullName}
Email: ${data.email}
Phone: ${data.phone}

WHAT'S NEXT?
------------
1. You will receive payment details separately
2. Please ensure your child wears comfortable clothing and trainers
3. Bring a water bottle and packed lunch (if applicable)
4. Arrive 10 minutes before the start time

IMPORTANT INFORMATION
---------------------
- Emergency Contact: ${data.emergency1Name} (${data.emergency1Phone})
- Walk Home Alone: ${data.walkHomeAlone === 'yes' ? 'Yes' : 'No'}

If you have any questions, please don't hesitate to contact us.

See you at camp!

Open Camp
--------------------
This is an automated confirmation email. Please do not reply directly to this email.
`.trim()

  await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: data.email,
    subject: `Registration Confirmed: ${data.childFullName} - Kids Camp`,
    text: emailContent,
  })
}

// Send notification email to club
async function sendClubNotificationEmail(
  apiKey: string,
  data: RegistrationData,
  registrationId: number | null
): Promise<void> {
  const medicalInfo = []
  if (data.hasMedicalConditions === 'yes') {
    medicalInfo.push(`Medical Conditions: ${data.medicalConditionsDetails}`)
  }
  if (data.hasAllergies === 'yes') {
    medicalInfo.push(`Allergies: ${data.allergiesDetails}`)
  }
  if (data.hasMedication === 'yes') {
    medicalInfo.push(`Medication: ${data.medicationDetails}`)
  }
  if (data.hasAdditionalNeeds === 'yes') {
    medicalInfo.push(`Additional Needs: ${data.additionalNeedsDetails}`)
  }

  const emailContent = `
NEW REGISTRATION RECEIVED
=========================

Registration ID: ${registrationId || 'N/A'}
Date: ${new Date().toISOString()}

CHILD INFORMATION
-----------------
Name: ${data.childFullName}
Age: ${data.childAge || 'Not specified'}
Date of Birth: ${data.childDob}

PARENT/GUARDIAN
---------------
Name: ${data.parentFullName}
Email: ${data.email}
Phone: ${data.phone}
Address: ${data.address || 'Not provided'}

EMERGENCY CONTACTS
------------------
Contact 1: ${data.emergency1Name} - ${data.emergency1Phone} (${data.emergency1Relationship})
${data.emergency2Name ? `Contact 2: ${data.emergency2Name} - ${data.emergency2Phone} (${data.emergency2Relationship})` : ''}

COLLECTION
----------
Walk Home Alone: ${data.walkHomeAlone === 'yes' ? 'YES' : 'NO'}
Authorised Collectors: ${data.authorisedCollectors || 'None specified'}

MEDICAL/HEALTH NOTES
--------------------
${medicalInfo.length > 0 ? medicalInfo.join('\n') : 'No medical information flagged'}

${data.hasFurtherInfo === 'yes' ? `Additional Info: ${data.furtherInfoDetails}` : ''}

---
View all registrations in the admin dashboard.
`.trim()

  await sendEmail(apiKey, {
    from: FROM_EMAIL,
    to: CLUB_EMAIL,
    subject: `New Registration: ${data.childFullName} (${data.parentFullName})`,
    text: emailContent,
  })
}

// Send all notification emails (non-blocking)
async function sendRegistrationEmails(
  env: Env,
  data: RegistrationData,
  registrationId: number | null
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping emails')
    return
  }

  // Send emails in parallel, don't await - fire and forget
  // This ensures email failures don't block the response
  Promise.allSettled([
    sendParentConfirmationEmail(env.RESEND_API_KEY, data),
    sendClubNotificationEmail(env.RESEND_API_KEY, data, registrationId),
  ]).then(results => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Email ${index + 1} failed:`, result.reason)
      }
    })
  })
}

// ============================================================================
// Route Handlers
// ============================================================================

// Handle GET /api/status
async function handleStatus(env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const maxSpots = await getMaxSpots(env)
    const total = await getRegistrationCount(env)
    const spotsLeft = Math.max(0, maxSpots - total)
    
    return jsonResponse({
      spotsLeft,
      total,
      max: maxSpots,
      isFull: spotsLeft === 0,
    }, 200, cors)
  } catch (error) {
    console.error('Status error:', error)
    return errorResponse('Failed to get status', 500, cors)
  }
}

// Handle POST /api/submit
async function handleSubmit(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const data: RegistrationData = await request.json()
    
    // Validate required fields
    const required = [
      'email', 'childFullName', 'childDob', 'parentFullName', 'phone',
      'emergency1Name', 'emergency1Phone', 'emergency1Relationship',
      'walkHomeAlone', 'hasMedicalConditions', 'hasAdditionalNeeds',
      'hasAllergies', 'hasMedication', 'hasFurtherInfo'
    ]
    
    for (const field of required) {
      if (!data[field as keyof RegistrationData]) {
        return errorResponse(`Missing required field: ${field}`, 400, cors)
      }
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return errorResponse('Invalid email address', 400, cors)
    }
    
    // Validate all permissions
    const permissions = [
      'permissionPhotos', 'permissionHealth', 'permissionActivities',
      'permissionLocations', 'permissionMeals', 'permissionBathroom',
      'permissionFirstAid', 'permissionEquipment', 'permissionAppWaiver'
    ]
    
    for (const perm of permissions) {
      if (!data[perm as keyof RegistrationData]) {
        return errorResponse('All permissions must be accepted', 400, cors)
      }
    }
    
    // Check capacity
    const maxSpots = await getMaxSpots(env)
    const currentCount = await getRegistrationCount(env)
    
    if (currentCount >= maxSpots) {
      return errorResponse('Registration is full. No spots available.', 400, cors)
    }
    
    // Insert registration
    const result = await env.DB.prepare(`
      INSERT INTO registrations (
        email, child_full_name, child_age, child_dob, parent_full_name,
        address, phone,
        emergency1_name, emergency1_phone, emergency1_relationship,
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
        created_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
        ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20,
        ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30,
        ?31, ?32, ?33, ?34, datetime('now')
      )
    `).bind(
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
      data.permissionAppWaiver ? 1 : 0
    ).run()
    
    const registrationId = result.meta.last_row_id
    const newCount = currentCount + 1
    const spotsLeft = Math.max(0, maxSpots - newCount)
    
    // Send notification emails (non-blocking - don't await)
    // Emails are sent after successful DB insert, but failures don't affect the response
    sendRegistrationEmails(env, data, registrationId)
    
    return jsonResponse({
      success: true,
      id: registrationId,
      spotsLeft,
      total: newCount,
      max: maxSpots,
    }, 201, cors)
  } catch (error) {
    console.error('Submit error:', error)
    return errorResponse('Failed to submit registration', 500, cors)
  }
}

// Handle GET /api/registrations
async function handleRegistrations(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) {
      return errorResponse('Unauthorized', 401, cors)
    }
    
    const { results } = await env.DB.prepare(`
      SELECT 
        id,
        email,
        child_full_name as childFullName,
        child_age as childAge,
        child_dob as childDob,
        parent_full_name as parentFullName,
        address,
        phone,
        emergency1_name as emergency1Name,
        emergency1_phone as emergency1Phone,
        emergency1_relationship as emergency1Relationship,
        emergency2_name as emergency2Name,
        emergency2_phone as emergency2Phone,
        emergency2_relationship as emergency2Relationship,
        authorised_collectors as authorisedCollectors,
        walk_home_alone as walkHomeAlone,
        has_medical_conditions as hasMedicalConditions,
        medical_conditions_details as medicalConditionsDetails,
        has_additional_needs as hasAdditionalNeeds,
        additional_needs_details as additionalNeedsDetails,
        has_allergies as hasAllergies,
        allergies_details as allergiesDetails,
        has_medication as hasMedication,
        medication_details as medicationDetails,
        has_further_info as hasFurtherInfo,
        further_info_details as furtherInfoDetails,
        permission_photos as permissionPhotos,
        permission_health as permissionHealth,
        permission_activities as permissionActivities,
        permission_locations as permissionLocations,
        permission_meals as permissionMeals,
        permission_bathroom as permissionBathroom,
        permission_first_aid as permissionFirstAid,
        permission_equipment as permissionEquipment,
        permission_app_waiver as permissionAppWaiver,
        created_at as createdAt
      FROM registrations 
      ORDER BY created_at DESC
    `).all()
    
    return jsonResponse({ 
      success: true, 
      registrations: results,
      count: results.length,
    }, 200, cors)
  } catch (error) {
    console.error('Registrations error:', error)
    return errorResponse('Failed to fetch registrations', 500, cors)
  }
}

// Handle POST /api/auth
async function handleAuth(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const { username, password } = await request.json() as { username: string; password: string }
    
    if (!username || !password) {
      return errorResponse('Username and password required', 400, cors)
    }
    
    // Check username (default: admin)
    const storedUsername = await env.KV.get('admin_username') || 'admin'
    if (username !== storedUsername) {
      return errorResponse('Invalid credentials', 401, cors)
    }
    
    // Check password hash
    const storedHash = await env.KV.get('admin_password_hash')
    if (!storedHash) {
      return errorResponse('Admin not configured', 500, cors)
    }
    
    const passwordHash = await hashPassword(password)
    if (passwordHash !== storedHash) {
      return errorResponse('Invalid credentials', 401, cors)
    }
    
    // Return the password as token (will be hashed on subsequent requests)
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

// Handle GET /api/admin-config
async function handleGetAdminConfig(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) {
      return errorResponse('Unauthorized', 401, cors)
    }
    
    const maxSpots = await getMaxSpots(env)
    const total = await getRegistrationCount(env)
    
    return jsonResponse({
      success: true,
      config: {
        max_spots: maxSpots,
        current_registrations: total,
        spots_remaining: Math.max(0, maxSpots - total),
      },
    }, 200, cors)
  } catch (error) {
    console.error('Get admin config error:', error)
    return errorResponse('Failed to get config', 500, cors)
  }
}

// Handle POST /api/admin-config
async function handlePostAdminConfig(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  try {
    const isAuthed = await verifyAuth(request, env)
    if (!isAuthed) {
      return errorResponse('Unauthorized', 401, cors)
    }
    
    const { max_spots } = await request.json() as { max_spots?: number }
    
    if (max_spots === undefined || typeof max_spots !== 'number' || max_spots < 0) {
      return errorResponse('Invalid max_spots value', 400, cors)
    }
    
    await env.KV.put('max_spots', max_spots.toString())
    
    const total = await getRegistrationCount(env)
    
    return jsonResponse({
      success: true,
      config: {
        max_spots,
        current_registrations: total,
        spots_remaining: Math.max(0, max_spots - total),
      },
    }, 200, cors)
  } catch (error) {
    console.error('Post admin config error:', error)
    return errorResponse('Failed to update config', 500, cors)
  }
}

// ============================================================================
// Main Fetch Handler
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN)
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    
    try {
      // Route handlers
      if (path === '/api/status' && method === 'GET') {
        return handleStatus(env, cors)
      }
      
      if (path === '/api/submit' && method === 'POST') {
        return handleSubmit(request, env, cors)
      }
      
      if (path === '/api/registrations' && method === 'GET') {
        return handleRegistrations(request, env, cors)
      }
      
      if (path === '/api/auth' && method === 'POST') {
        return handleAuth(request, env, cors)
      }
      
      if (path === '/api/admin-config' && method === 'GET') {
        return handleGetAdminConfig(request, env, cors)
      }
      
      if (path === '/api/admin-config' && method === 'POST') {
        return handlePostAdminConfig(request, env, cors)
      }
      
      // 404 for unknown routes
      return errorResponse('Not found', 404, cors)
    } catch (error) {
      console.error('Unhandled error:', error)
      return errorResponse('Internal server error', 500, cors)
    }
  },
}
