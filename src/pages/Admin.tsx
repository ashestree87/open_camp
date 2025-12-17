import { useState, useEffect, useMemo } from 'react'
import type { Registration } from '../types'

interface AdminConfig {
  max_spots: number
  current_registrations: number
  spots_remaining: number
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  loading: boolean
}

const STORAGE_KEY = 'opencamp_admin_token'

export default function Admin() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    loading: true,
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMaxSpots, setNewMaxSpots] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY)
    if (storedToken) {
      validateToken(storedToken)
    } else {
      setAuth({ isAuthenticated: false, token: null, loading: false })
    }
  }, [])

  // Validate stored token
  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/registrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        setAuth({ isAuthenticated: true, token, loading: false })
        fetchDashboardData(token)
      } else {
        localStorage.removeItem(STORAGE_KEY)
        setAuth({ isAuthenticated: false, token: null, loading: false })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setAuth({ isAuthenticated: false, token: null, loading: false })
    }
  }

  // Fetch dashboard data
  const fetchDashboardData = async (token: string) => {
    setDataLoading(true)
    try {
      const [regResponse, configResponse] = await Promise.all([
        fetch('/api/registrations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }),
        fetch('/api/admin-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }),
      ])

      if (regResponse.ok) {
        const regData = await regResponse.json()
        setRegistrations(regData.registrations || [])
      }

      if (configResponse.ok) {
        const configData = await configResponse.json()
        setConfig(configData.config)
        setNewMaxSpots(configData.config.max_spots.toString())
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setDataLoading(false)
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      const token = data.token
      localStorage.setItem(STORAGE_KEY, token)
      setAuth({ isAuthenticated: true, token, loading: false })
      fetchDashboardData(token)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth({ isAuthenticated: false, token: null, loading: false })
    setRegistrations([])
    setConfig(null)
    setUsername('')
    setPassword('')
  }

  // Update max spots
  const handleUpdateMaxSpots = async () => {
    if (!auth.token || !newMaxSpots) return
    
    const value = parseInt(newMaxSpots, 10)
    if (isNaN(value) || value < 0) {
      setUpdateError('Please enter a valid number')
      return
    }

    setUpdateError('')
    setUpdateSuccess(false)

    try {
      const response = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ max_spots: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      const data = await response.json()
      setConfig(data.config)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch {
      setUpdateError('Failed to update max spots')
    }
  }

  // Filter registrations by search query
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return registrations
    
    const query = searchQuery.toLowerCase()
    return registrations.filter(reg => 
      reg.childFullName?.toLowerCase().includes(query) ||
      reg.parentFullName?.toLowerCase().includes(query) ||
      reg.email?.toLowerCase().includes(query)
    )
  }, [registrations, searchQuery])

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      'ID', 'Created At', 'Email', 'Child Name', 'Child Age', 'Child DOB',
      'Parent Name', 'Address', 'Phone',
      'Emergency 1 Name', 'Emergency 1 Phone', 'Emergency 1 Relationship',
      'Emergency 2 Name', 'Emergency 2 Phone', 'Emergency 2 Relationship',
      'Authorised Collectors', 'Walk Home Alone',
      'Medical Conditions', 'Medical Details',
      'Additional Needs', 'Additional Needs Details',
      'Allergies', 'Allergies Details',
      'Medication', 'Medication Details',
      'Further Info', 'Further Info Details',
      'Permission Photos', 'Permission Health', 'Permission Activities',
      'Permission Locations', 'Permission Meals', 'Permission Bathroom',
      'Permission First Aid', 'Permission Equipment', 'Permission Waiver'
    ]

    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = registrations.map(r => [
      r.id,
      r.createdAt,
      r.email,
      r.childFullName,
      r.childAge,
      r.childDob,
      r.parentFullName,
      r.address,
      r.phone,
      r.emergency1Name,
      r.emergency1Phone,
      r.emergency1Relationship,
      r.emergency2Name,
      r.emergency2Phone,
      r.emergency2Relationship,
      r.authorisedCollectors,
      r.walkHomeAlone,
      r.hasMedicalConditions,
      r.medicalConditionsDetails,
      r.hasAdditionalNeeds,
      r.additionalNeedsDetails,
      r.hasAllergies,
      r.allergiesDetails,
      r.hasMedication,
      r.medicationDetails,
      r.hasFurtherInfo,
      r.furtherInfoDetails,
      r.permissionPhotos ? 'Yes' : 'No',
      r.permissionHealth ? 'Yes' : 'No',
      r.permissionActivities ? 'Yes' : 'No',
      r.permissionLocations ? 'Yes' : 'No',
      r.permissionMeals ? 'Yes' : 'No',
      r.permissionBathroom ? 'Yes' : 'No',
      r.permissionFirstAid ? 'Yes' : 'No',
      r.permissionEquipment ? 'Yes' : 'No',
      r.permissionAppWaiver ? 'Yes' : 'No',
    ].map(escapeCSV))

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `open-camp-registrations-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Loading state
  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-400 font-heading text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  // Login form
  if (!auth.isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-white uppercase">
              Admin Login
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Authorised personnel only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="input-field"
                placeholder="Enter username"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="Enter password"
              />
            </div>

            {loginError && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 text-red-200 text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        <p className="text-gray-600 text-xs text-center mt-4">
          Contact the administrator if you need access
        </p>
      </div>
    )
  }

  // Dashboard
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-3xl font-bold text-white uppercase">Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Manage registrations and camp settings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => auth.token && fetchDashboardData(auth.token)}
            disabled={dataLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {config && (
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-4xl font-heading font-bold text-brand-primary">{config.current_registrations}</p>
            <p className="text-gray-400 text-sm mt-1">Registered</p>
          </div>
          <div className="card text-center">
            <p className={`text-4xl font-heading font-bold ${config.spots_remaining === 0 ? 'text-red-400' : config.spots_remaining <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {config.spots_remaining}
            </p>
            <p className="text-gray-400 text-sm mt-1">Spots Left</p>
          </div>
          <div className="card text-center">
            <p className="text-4xl font-heading font-bold text-white">{config.max_spots}</p>
            <p className="text-gray-400 text-sm mt-1">Max Capacity</p>
          </div>
          <div className="card">
            <label className="text-gray-400 text-xs uppercase tracking-wide block mb-2">Update Capacity</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={newMaxSpots}
                onChange={(e) => setNewMaxSpots(e.target.value)}
                className="input-field py-2 text-center flex-1"
                min="0"
              />
              <button
                onClick={handleUpdateMaxSpots}
                className="btn-primary py-2 px-4 text-sm"
              >
                Save
              </button>
            </div>
            {updateError && <p className="text-red-400 text-xs mt-1">{updateError}</p>}
            {updateSuccess && <p className="text-green-400 text-xs mt-1">✓ Updated</p>}
          </div>
        </div>
      )}

      {/* Registrations Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="font-heading text-xl font-semibold text-white uppercase">
            Registrations ({filteredRegistrations.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="input-field pl-10 py-2 text-sm w-full sm:w-64"
              />
            </div>
            {/* Export */}
            <button
              onClick={exportCSV}
              disabled={registrations.length === 0}
              className="btn-secondary py-2 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {dataLoading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-500 mt-3">Loading registrations...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">
              {searchQuery ? 'No registrations match your search' : 'No registrations yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table Header */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Child Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4 hidden sm:table-cell">Parent</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4 hidden md:table-cell">Phone</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4 hidden lg:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide py-3 px-4">Date</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    registration={reg}
                    isExpanded={expandedId === reg.id}
                    onToggle={() => setExpandedId(expandedId === reg.id ? null : reg.id ?? null)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Registration Row Component
interface RegistrationRowProps {
  registration: Registration
  isExpanded: boolean
  onToggle: () => void
}

function RegistrationRow({ registration: reg, isExpanded, onToggle }: RegistrationRowProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{reg.childFullName}</span>
            {reg.childAge && (
              <span className="text-xs bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded">
                {reg.childAge}y
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-gray-400 hidden sm:table-cell">{reg.parentFullName}</td>
        <td className="py-3 px-4 hidden md:table-cell">
          <a href={`tel:${reg.phone}`} className="text-gray-400 hover:text-white" onClick={e => e.stopPropagation()}>
            {reg.phone}
          </a>
        </td>
        <td className="py-3 px-4 hidden lg:table-cell">
          <a href={`mailto:${reg.email}`} className="text-brand-primary hover:underline" onClick={e => e.stopPropagation()}>
            {reg.email}
          </a>
        </td>
        <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(reg.createdAt)}</td>
        <td className="py-3 px-4">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-gray-900/50 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Child & Contact Info */}
              <DetailSection title="Child Information">
                <DetailItem label="Full Name" value={reg.childFullName} />
                <DetailItem label="Age" value={reg.childAge ? `${reg.childAge} years old` : '-'} />
                <DetailItem label="Date of Birth" value={formatDate(reg.childDob)} />
              </DetailSection>

              <DetailSection title="Parent/Guardian">
                <DetailItem label="Name" value={reg.parentFullName} />
                <DetailItem label="Email" value={reg.email} isLink={`mailto:${reg.email}`} />
                <DetailItem label="Phone" value={reg.phone} isLink={`tel:${reg.phone}`} />
                <DetailItem label="Address" value={reg.address || '-'} />
              </DetailSection>

              {/* Emergency Contacts */}
              <DetailSection title="Emergency Contact 1">
                <DetailItem label="Name" value={reg.emergency1Name} />
                <DetailItem label="Phone" value={reg.emergency1Phone} isLink={`tel:${reg.emergency1Phone}`} />
                <DetailItem label="Relationship" value={reg.emergency1Relationship} />
              </DetailSection>

              {reg.emergency2Name && (
                <DetailSection title="Emergency Contact 2">
                  <DetailItem label="Name" value={reg.emergency2Name} />
                  <DetailItem label="Phone" value={reg.emergency2Phone} isLink={`tel:${reg.emergency2Phone}`} />
                  <DetailItem label="Relationship" value={reg.emergency2Relationship} />
                </DetailSection>
              )}

              {/* Collection */}
              <DetailSection title="Collection & Safety">
                <DetailItem label="Walk Home Alone" value={reg.walkHomeAlone === 'yes' ? 'Yes' : 'No'} highlight={reg.walkHomeAlone === 'yes' ? 'green' : undefined} />
                <DetailItem label="Authorised Collectors" value={reg.authorisedCollectors || 'None specified'} />
              </DetailSection>

              {/* Medical Info */}
              <DetailSection title="Medical Information">
                <MedicalItem
                  label="Medical Conditions"
                  hasCondition={reg.hasMedicalConditions === 'yes'}
                  details={reg.medicalConditionsDetails}
                  type="warning"
                />
                <MedicalItem
                  label="Additional Needs"
                  hasCondition={reg.hasAdditionalNeeds === 'yes'}
                  details={reg.additionalNeedsDetails}
                  type="warning"
                />
                <MedicalItem
                  label="Allergies"
                  hasCondition={reg.hasAllergies === 'yes'}
                  details={reg.allergiesDetails}
                  type="danger"
                />
                <MedicalItem
                  label="Medication Required"
                  hasCondition={reg.hasMedication === 'yes'}
                  details={reg.medicationDetails}
                  type="info"
                />
                <MedicalItem
                  label="Further Information"
                  hasCondition={reg.hasFurtherInfo === 'yes'}
                  details={reg.furtherInfoDetails}
                  type="default"
                />
              </DetailSection>

              {/* Permissions */}
              <DetailSection title="Permissions" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <PermissionBadge label="Photos" granted={!!reg.permissionPhotos} />
                  <PermissionBadge label="Health" granted={!!reg.permissionHealth} />
                  <PermissionBadge label="Activities" granted={!!reg.permissionActivities} />
                  <PermissionBadge label="Locations" granted={!!reg.permissionLocations} />
                  <PermissionBadge label="Meals" granted={!!reg.permissionMeals} />
                  <PermissionBadge label="Bathroom" granted={!!reg.permissionBathroom} />
                  <PermissionBadge label="First Aid" granted={!!reg.permissionFirstAid} />
                  <PermissionBadge label="Equipment" granted={!!reg.permissionEquipment} />
                  <PermissionBadge label="Waiver" granted={!!reg.permissionAppWaiver} />
                </div>
              </DetailSection>

              {/* Registration Info */}
              <div className="md:col-span-2 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-600">
                  Registration ID: {reg.id} • Submitted: {formatDate(reg.createdAt)}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// Helper Components
function DetailSection({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h4 className="font-heading text-sm font-semibold text-brand-primary uppercase mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DetailItem({ label, value, isLink, highlight }: { label: string; value?: string; isLink?: string; highlight?: 'green' }) {
  const content = (
    <span className={`${highlight === 'green' ? 'text-green-400' : 'text-gray-300'}`}>
      {value || '-'}
    </span>
  )

  return (
    <div className="flex text-sm">
      <span className="text-gray-500 w-28 flex-shrink-0">{label}:</span>
      {isLink ? (
        <a href={isLink} className="text-brand-primary hover:underline">{value}</a>
      ) : content}
    </div>
  )
}

function MedicalItem({ label, hasCondition, details, type }: { 
  label: string; 
  hasCondition: boolean; 
  details?: string;
  type: 'warning' | 'danger' | 'info' | 'default'
}) {
  if (!hasCondition) {
    return (
      <div className="flex text-sm">
        <span className="text-gray-500 w-36 flex-shrink-0">{label}:</span>
        <span className="text-gray-600">No</span>
      </div>
    )
  }

  const colorMap = {
    warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-200',
    danger: 'bg-red-900/30 border-red-700 text-red-200',
    info: 'bg-blue-900/30 border-blue-700 text-blue-200',
    default: 'bg-gray-800 border-gray-700 text-gray-300',
  }

  return (
    <div className={`p-2 rounded border ${colorMap[type]} text-sm`}>
      <span className="font-medium">{label}:</span> {details || 'Yes (no details provided)'}
    </div>
  )
}

function PermissionBadge({ label, granted }: { label: string; granted: boolean }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      granted 
        ? 'bg-green-900/50 text-green-400 border border-green-700' 
        : 'bg-red-900/50 text-red-400 border border-red-700'
    }`}>
      {label}: {granted ? '✓' : '✗'}
    </span>
  )
}
