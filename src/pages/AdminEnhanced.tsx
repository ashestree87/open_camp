import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Camp, PricingItem } from '../types'
import { useToast } from '../components/Toast'

const STORAGE_KEY = 'opencamp_admin_token'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  loading: boolean
}

type TabType = 'dashboard' | 'camps' | 'pricing' | 'registrations'

const VALID_TABS: TabType[] = ['dashboard', 'camps', 'pricing', 'registrations']

export default function AdminEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    loading: true,
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Get active tab and selected camp from URL
  const tabParam = searchParams.get('tab') as TabType | null
  const activeTab: TabType = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'dashboard'
  const selectedCampId = searchParams.get('campId') ? parseInt(searchParams.get('campId')!) : null
  
  // Helper to update URL params
  const setActiveTab = (tab: TabType) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', tab)
    if (tab !== 'registrations') {
      newParams.delete('campId')
    }
    setSearchParams(newParams)
  }
  
  const setSelectedCampId = (campId: number | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (campId !== null) {
      newParams.set('campId', campId.toString())
      newParams.set('tab', 'registrations')
    } else {
      newParams.delete('campId')
    }
    setSearchParams(newParams)
  }

  // Check for existing token
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY)
    if (storedToken) {
      validateToken(storedToken)
    } else {
      setAuth({ isAuthenticated: false, token: null, loading: false })
    }
  }, [])

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin-config', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        setAuth({ isAuthenticated: true, token, loading: false })
      } else {
        localStorage.removeItem(STORAGE_KEY)
        setAuth({ isAuthenticated: false, token: null, loading: false })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setAuth({ isAuthenticated: false, token: null, loading: false })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      localStorage.setItem(STORAGE_KEY, data.token)
      setAuth({ isAuthenticated: true, token: data.token, loading: false })
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth({ isAuthenticated: false, token: null, loading: false })
  }

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="card">
          <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6 text-center">
            Admin Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            {loginError && (
              <div className="bg-red-900/50 border border-red-600 rounded p-3 text-red-200 text-sm">
                {loginError}
              </div>
            )}
            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-3xl font-bold text-white uppercase">
          Admin Dashboard
        </h1>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'camps', label: 'Camps' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'registrations', label: 'Registrations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 font-heading uppercase transition-colors ${
              activeTab === tab.id
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'camps' && <CampsTab token={auth.token!} onViewRegistrations={(campId) => {
        setSelectedCampId(campId) // This already sets tab to 'registrations'
      }} />}
      {activeTab === 'pricing' && <PricingTab token={auth.token!} />}
      {activeTab === 'registrations' && <RegistrationsTab token={auth.token!} selectedCampId={selectedCampId} onClearFilter={() => setSelectedCampId(null)} />}
    </div>
  )
}

// Dashboard Tab
function DashboardTab() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/camps')
      .then(r => r.json())
      .then(data => setStats(data))
  }, [])

  if (!stats) return <div>Loading...</div>

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card">
        <div className="text-4xl font-heading font-bold text-brand-primary">
          {stats.camps?.length || 0}
        </div>
        <div className="text-gray-400 text-sm mt-1">Active Camps</div>
      </div>
      <div className="card">
        <div className="text-4xl font-heading font-bold text-green-400">
          {stats.camps?.reduce((sum: number, c: any) => sum + (c.maxSpots - c.spotsTaken), 0) || 0}
        </div>
        <div className="text-gray-400 text-sm mt-1">Total Spots Available</div>
      </div>
      <div className="card">
        <div className="text-4xl font-heading font-bold text-white">
          {stats.camps?.reduce((sum: number, c: any) => sum + c.spotsTaken, 0) || 0}
        </div>
        <div className="text-gray-400 text-sm mt-1">Total Registrations</div>
      </div>
    </div>
  )
}

// Camps Tab
function CampsTab({ token, onViewRegistrations }: { token: string; onViewRegistrations: (campId: number) => void }) {
  const [camps, setCamps] = useState<Camp[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null)
  const [duplicatingCamp, setDuplicatingCamp] = useState<Camp | null>(null)
  const { showToast, showConfirm } = useToast()
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('all')
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'open' | 'paused' | 'closed'>('all')
  const [capacityFilter, setCapacityFilter] = useState<'all' | 'available' | 'full'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const handleDuplicate = (camp: Camp) => {
    // Create a copy with modified name and cleared dates
    const duplicate = {
      ...camp,
      id: undefined as any, // Clear ID so it creates a new camp
      name: `${camp.name} (Copy)`,
      startDate: '',
      endDate: '',
      spotsTaken: 0,
      status: 'active' as const,
      registrationStatus: 'open' as const,
    }
    setDuplicatingCamp(duplicate as Camp)
  }

  useEffect(() => {
    loadCamps()
  }, [])

  const loadCamps = async () => {
    const res = await fetch('/api/camps?includeArchived=true')
    const data = await res.json()
    setCamps(data.camps || [])
  }

  // Filter camps based on all criteria
  const filteredCamps = camps.filter(camp => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(camp.startDate)
    const endDate = new Date(camp.endDate)
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        camp.name.toLowerCase().includes(query) ||
        camp.description.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }
    
    // Archived filter
    if (!showArchived && camp.status === 'archived') return false
    
    // Date filter
    if (dateFilter !== 'all') {
      if (dateFilter === 'upcoming' && startDate <= today) return false
      if (dateFilter === 'ongoing' && (startDate > today || endDate < today)) return false
      if (dateFilter === 'past' && endDate >= today) return false
    }
    
    // Registration status filter
    if (registrationFilter !== 'all') {
      const regStatus = camp.registrationStatus || 'open'
      if (registrationFilter !== regStatus) return false
    }
    
    // Capacity filter
    if (capacityFilter !== 'all') {
      const isFull = camp.spotsTaken >= camp.maxSpots
      if (capacityFilter === 'available' && isFull) return false
      if (capacityFilter === 'full' && !isFull) return false
    }
    
    return true
  })

  const handleSubmit = async (campData: Partial<Camp>, pricingItems: PricingItem[], deselectedItems: PricingItem[] = []) => {
    // When duplicating, always create new (POST)
    const isEditing = editingCamp && !duplicatingCamp
    const url = isEditing ? `/api/camps/${editingCamp.id}` : '/api/camps'
    const method = isEditing ? 'PUT' : 'POST'
    
    try {
      // First save the camp
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(campData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMsg = data.details || data.error || data.hint || 'Unknown error'
        showToast(errorMsg, 'error')
        console.error('Camp creation failed:', data)
        return
      }
      
      const campId = (isEditing && editingCamp?.id) || data.id
      
      // Save/update pricing items that are selected for this camp
      for (const item of pricingItems) {
        const isExisting = item.id < 1000000000000 // Temporary IDs are Date.now() timestamps
        const pricingUrl = isExisting ? `/api/pricing/${item.id}` : '/api/pricing'
        const pricingMethod = isExisting ? 'PUT' : 'POST'
        
        await fetch(pricingUrl, {
          method: pricingMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...item,
            campId: campId,
          }),
        })
      }
      
      // Unassign deselected items (set their campId to null)
      for (const item of deselectedItems) {
        await fetch(`/api/pricing/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            campId: null,
          }),
        })
      }
      
      loadCamps()
      setShowForm(false)
      setEditingCamp(null)
      setDuplicatingCamp(null)
      showToast(duplicatingCamp ? 'Camp duplicated successfully!' : 'Camp saved successfully!', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Network error', 'error')
      console.error('Network error:', error)
    }
  }

  const handleArchiveCamp = (id: number, currentStatus: string) => {
    const isArchived = currentStatus === 'archived'
    showConfirm(
      isArchived ? 'Are you sure you want to restore this camp?' : 'Are you sure you want to archive this camp?',
      async () => {
        if (isArchived) {
          await fetch(`/api/camps/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: 'active' }),
          })
          showToast('Camp restored successfully!', 'success')
        } else {
          await fetch(`/api/camps/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          })
          showToast('Camp archived successfully!', 'success')
        }
        loadCamps()
      }
    )
  }

  if (showForm || editingCamp || duplicatingCamp) {
    return (
      <CampForm
        camp={editingCamp || duplicatingCamp}
        token={token}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false)
          setEditingCamp(null)
          setDuplicatingCamp(null)
        }}
        isDuplicate={!!duplicatingCamp}
      />
    )
  }

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    showArchived ? 1 : 0,
    dateFilter !== 'all' ? 1 : 0,
    registrationFilter !== 'all' ? 1 : 0,
    capacityFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const clearAllFilters = () => {
    setSearchQuery('')
    setShowArchived(false)
    setDateFilter('all')
    setRegistrationFilter('all')
    setCapacityFilter('all')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-bold text-white uppercase">
          Manage Camps
        </h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Camp
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search camps by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-brand-primary/20 border-brand-primary' : ''}`}
          >
            <span>⚙️ Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-brand-primary text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label text-xs">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="input-field text-sm w-full"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Currently Running</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Registration Status</label>
                <select
                  value={registrationFilter}
                  onChange={(e) => setRegistrationFilter(e.target.value as any)}
                  className="input-field text-sm w-full"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">🟢 Open</option>
                  <option value="paused">⏸️ Paused</option>
                  <option value="closed">🔒 Closed</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Capacity</label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value as any)}
                  className="input-field text-sm w-full"
                >
                  <option value="all">Any Capacity</option>
                  <option value="available">Has Spots Available</option>
                  <option value="full">Full / Sold Out</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Include archived
                </label>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">
                  Showing {filteredCamps.length} of {camps.length} camps
                </span>
                <button onClick={clearAllFilters} className="text-sm text-brand-primary hover:underline">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!showFilters && (
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{filteredCamps.length} camp{filteredCamps.length !== 1 ? 's' : ''}</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-brand-primary hover:underline">
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Camp List */}
      <div className="space-y-4">
        {filteredCamps.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No camps found</p>
            <p className="text-sm">Try adjusting your filters or create a new camp</p>
          </div>
        ) : filteredCamps.map((camp) => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const endDate = new Date(camp.endDate)
          const hasEnded = endDate < today
          
          return (
            <div key={camp.id} className={`card ${camp.status === 'archived' || hasEnded ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-lg font-bold text-white">{camp.name}</h3>
                    {camp.status === 'archived' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Archived</span>
                    )}
                    {hasEnded && camp.status !== 'archived' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-400">Ended</span>
                    )}
                    {/* Registration Status Badge */}
                    {camp.status !== 'archived' && !hasEnded && (
                      camp.registrationStatus === 'paused' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-400">⏸️ Paused</span>
                      ) : camp.registrationStatus === 'closed' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400">🔒 Closed</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">🟢 Open</span>
                      )
                    )}
                    {/* Waitlist Badge */}
                    {camp.waitlistEnabled && camp.status !== 'archived' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-400">📋 Waitlist</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{camp.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-500">
                      📅 {camp.startDate} to {camp.endDate}
                    </span>
                    <span className="text-gray-500">
                      👥 Ages {camp.ageMin}-{camp.ageMax}
                    </span>
                    <span className={camp.spotsTaken >= camp.maxSpots ? 'text-red-400' : 'text-green-400'}>
                      {camp.maxSpots - camp.spotsTaken}/{camp.maxSpots} spots
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Primary Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewRegistrations(camp.id)}
                      className="btn-primary text-sm py-1.5 px-4"
                    >
                      View Registrations
                    </button>
                    {!hasEnded && camp.status !== 'archived' && (
                      <button
                        onClick={() => setEditingCamp(camp)}
                        className="btn-secondary text-sm py-1.5 px-4"
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                  {/* Secondary Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/camp/${camp.id}`
                        navigator.clipboard.writeText(url)
                        showToast('Registration link copied to clipboard!', 'success')
                      }}
                      className="text-xs py-1 px-2 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded transition-colors"
                      title="Copy registration link"
                    >
                      🔗 Copy Link
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => handleDuplicate(camp)}
                      className="text-xs py-1 px-2 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20 rounded transition-colors"
                      title="Create a copy of this camp"
                    >
                      📋 Duplicate
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => handleArchiveCamp(camp.id, camp.status)}
                      className={`text-xs py-1 px-2 rounded transition-colors ${
                        camp.status === 'archived' 
                          ? 'text-gray-400 hover:text-green-400 hover:bg-green-900/20' 
                          : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                      }`}
                    >
                      {camp.status === 'archived' ? '↩️ Restore' : '🗑️ Archive'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Camp Form Component
function CampForm({ 
  camp, 
  onSubmit, 
  onCancel,
  isDuplicate = false
}: { 
  camp: Camp | null
  token: string
  onSubmit: (data: Partial<Camp>, pricingItems: PricingItem[], deselectedItems: PricingItem[]) => void
  onCancel: () => void
  isDuplicate?: boolean
}) {
  const [formData, setFormData] = useState({
    name: camp?.name || '',
    description: camp?.description || '',
    startDate: camp?.startDate || '',
    endDate: camp?.endDate || '',
    ageMin: camp?.ageMin || 5,
    ageMax: camp?.ageMax || 15,
    maxSpots: camp?.maxSpots || 20,
    status: camp?.status || 'active',
    registrationStatus: camp?.registrationStatus || 'open',
    waitlistEnabled: camp?.waitlistEnabled || false,
    waitlistMessage: camp?.waitlistMessage || '',
    siblingDiscountEnabled: camp?.siblingDiscountEnabled || false,
    siblingDiscountAmount: camp?.siblingDiscountAmount || 0,
    siblingDiscountType: camp?.siblingDiscountType || 'fixed',
  })
  
  // Pricing Items Management
  const [allPricingItems, setAllPricingItems] = useState<PricingItem[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [newItems, setNewItems] = useState<PricingItem[]>([])
  const [showAddPricing, setShowAddPricing] = useState(false)
  const [newPricing, setNewPricing] = useState({
    name: '',
    description: '',
    amount: 0,
    itemType: 'add_on' as 'base_fee' | 'add_on' | 'discount',
    isRequired: false,
  })

  // Track original camp items for detecting deselections
  const [originalCampItemIds, setOriginalCampItemIds] = useState<Set<number>>(new Set())
  
  // Load all pricing items
  useEffect(() => {
    fetch('/api/pricing?includeArchived=true')
      .then(r => r.json())
      .then(data => {
        const items = data.items || []
        setAllPricingItems(items)
        
        // Pre-select items that are already assigned to this camp
        if (camp) {
          const campItemIds = items
            .filter((item: PricingItem) => item.campId === camp.id)
            .map((item: PricingItem) => item.id)
          setSelectedItemIds(new Set(campItemIds))
          setOriginalCampItemIds(new Set(campItemIds)) // Track original selection
        }
      })
  }, [camp])

  const toggleItemSelection = (itemId: number) => {
    const newSet = new Set(selectedItemIds)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setSelectedItemIds(newSet)
  }

  // Get selected items (existing + new)
  const getSelectedItems = (): PricingItem[] => {
    const existingSelected = allPricingItems.filter(item => selectedItemIds.has(item.id))
    return [...existingSelected, ...newItems]
  }
  
  // Get items that were deselected (were assigned to this camp but now unchecked)
  const getDeselectedItems = (): PricingItem[] => {
    return allPricingItems.filter(item => 
      originalCampItemIds.has(item.id) && !selectedItemIds.has(item.id)
    )
  }

  const handleAddPricing = () => {
    if (!newPricing.name || newPricing.amount === undefined) return
    
    const newItem: PricingItem = {
      id: Date.now(), // Temporary ID for new items
      campId: camp?.id || null,
      name: newPricing.name,
      description: newPricing.description,
      amount: newPricing.amount,
      itemType: newPricing.itemType,
      isRequired: newPricing.isRequired,
      isActive: true,
      displayOrder: getSelectedItems().length + 1,
      createdAt: new Date().toISOString(),
    }
    
    setNewItems([...newItems, newItem])
    setNewPricing({ name: '', description: '', amount: 0, itemType: 'add_on', isRequired: false })
    setShowAddPricing(false)
  }

  const handleRemoveNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData, getSelectedItems(), getDeselectedItems())
  }

  return (
    <div className="card max-w-5xl">
      <h2 className="font-heading text-xl font-bold text-white uppercase mb-4">
        {isDuplicate ? '📋 Duplicate Camp' : camp ? 'Edit Camp' : 'Create New Camp'}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info & Registration Controls */}
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">
                Camp Details
              </h3>
              <div>
                <label className="label">Camp Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Min Age</label>
                  <input
                    type="number"
                    value={formData.ageMin}
                    onChange={(e) => setFormData({ ...formData, ageMin: parseInt(e.target.value) })}
                    className="input-field"
                    min="3"
                    max="18"
                  />
                </div>
                <div>
                  <label className="label">Max Age</label>
                  <input
                    type="number"
                    value={formData.ageMax}
                    onChange={(e) => setFormData({ ...formData, ageMax: parseInt(e.target.value) })}
                    className="input-field"
                    min="3"
                    max="18"
                  />
                </div>
                <div>
                  <label className="label">Max Spots</label>
                  <input
                    type="number"
                    value={formData.maxSpots}
                    onChange={(e) => setFormData({ ...formData, maxSpots: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="label">Camp Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="full">Full</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Registration Controls Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">
                Registration Controls
              </h3>
              
              <div>
                <label className="label">Registration Status</label>
                <select
                  value={formData.registrationStatus}
                  onChange={(e) => setFormData({ ...formData, registrationStatus: e.target.value as 'open' | 'paused' | 'closed' })}
                  className="input-field"
                >
                  <option value="open">🟢 Open - Accepting registrations</option>
                  <option value="paused">🟡 Paused - Temporarily stopped</option>
                  <option value="closed">🔴 Closed - No registrations</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  {formData.registrationStatus === 'open' && 'Users can register for this camp'}
                  {formData.registrationStatus === 'paused' && 'Registration form shows a "paused" message'}
                  {formData.registrationStatus === 'closed' && 'Registration form is hidden'}
                </p>
              </div>
              
              <div className="flex items-start gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.waitlistEnabled}
                    onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300 text-sm">Enable Waitlist</span>
                </label>
              </div>
              
              {formData.waitlistEnabled && (
                <div>
                  <label className="label">Waitlist Message</label>
                  <input
                    type="text"
                    value={formData.waitlistMessage}
                    onChange={(e) => setFormData({ ...formData, waitlistMessage: e.target.value })}
                    className="input-field"
                    placeholder="e.g., We'll contact you if a spot opens up"
                  />
                </div>
              )}
            </div>

            {/* Sibling Discount Section */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">
                Sibling Discount
              </h3>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.siblingDiscountEnabled}
                  onChange={(e) => setFormData({ ...formData, siblingDiscountEnabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-300 text-sm">Enable sibling discount</span>
              </label>
              
              {formData.siblingDiscountEnabled && (
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-sm">Type</label>
                      <select
                        value={formData.siblingDiscountType}
                        onChange={(e) => setFormData({ ...formData, siblingDiscountType: e.target.value as 'fixed' | 'percentage' })}
                        className="input-field text-sm"
                      >
                        <option value="fixed">Fixed (AED)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-sm">
                        {formData.siblingDiscountType === 'percentage' ? 'Discount %' : 'Amount (AED)'}
                      </label>
                      <input
                        type="number"
                        value={formData.siblingDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, siblingDiscountAmount: parseFloat(e.target.value) || 0 })}
                        className="input-field text-sm"
                        min="0"
                        step={formData.siblingDiscountType === 'percentage' ? '1' : '0.01'}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Applied to each additional child (2nd, 3rd, etc.)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Pricing Items */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">
              Pricing Items
            </h3>

            {/* Select from existing pricing items */}
            {allPricingItems.length > 0 && (
              <div className="space-y-2">
                <label className="label text-sm text-gray-400">Select from existing:</label>
                <div className="space-y-1 max-h-64 overflow-y-auto p-2 bg-gray-800/30 rounded border border-gray-700">
                  {allPricingItems.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                        selectedItemIds.has(item.id)
                          ? 'border-brand-primary bg-brand-primary/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-medium text-white text-sm flex items-center gap-1">
                            {item.name}
                            {item.isRequired && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400">Req</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.itemType}
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                        {item.amount < 0 ? '-' : ''}AED {Math.abs(item.amount).toFixed(0)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* New items created for this camp */}
            {newItems.length > 0 && (
              <div className="space-y-1">
                <label className="label text-sm text-gray-400">New items:</label>
                {newItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-700">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-white text-sm flex items-center gap-1">
                          {item.name}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/50 text-green-400">New</span>
                        </div>
                        <div className="text-xs text-gray-500">{item.itemType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                        AED {Math.abs(item.amount).toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewItem(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="flex justify-between items-center py-2 border-t border-gray-700">
              <span className="text-gray-400 text-sm">
                {getSelectedItems().length} item(s) selected
              </span>
              <button
                type="button"
                onClick={() => setShowAddPricing(true)}
                className="text-sm text-brand-primary hover:underline"
              >
                + Create New Item
              </button>
            </div>

            {/* Add Pricing Form */}
            {showAddPricing && (
              <div className="p-3 bg-gray-800/50 rounded border border-gray-600 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-sm">Name *</label>
                    <input
                      type="text"
                      value={newPricing.name}
                      onChange={(e) => setNewPricing({ ...newPricing, name: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Camp Fee"
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Amount (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPricing.amount}
                      onChange={(e) => setNewPricing({ ...newPricing, amount: parseFloat(e.target.value) })}
                      className="input-field text-sm"
                      placeholder="150"
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-sm">Description</label>
                  <input
                    type="text"
                    value={newPricing.description}
                    onChange={(e) => setNewPricing({ ...newPricing, description: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Full week camp registration"
                  />
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  <select
                    value={newPricing.itemType}
                    onChange={(e) => setNewPricing({ ...newPricing, itemType: e.target.value as any })}
                    className="input-field text-sm flex-1 min-w-[120px]"
                  >
                    <option value="base_fee">Base Fee</option>
                    <option value="add_on">Add-on</option>
                    <option value="discount">Discount</option>
                  </select>
                  <label className="flex items-center gap-1 text-white text-sm">
                    <input
                      type="checkbox"
                      checked={newPricing.isRequired}
                      onChange={(e) => setNewPricing({ ...newPricing, isRequired: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddPricing}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPricing(false)}
                    className="btn-secondary text-sm py-1 px-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons - Full Width */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700">
          <button type="submit" className="btn-primary flex-1">
            {isDuplicate ? '📋 Create Duplicate' : camp ? 'Update Camp' : 'Create Camp'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// Pricing Tab - Full Management
function PricingTab({ token }: { token: string }) {
  const [items, setItems] = useState<PricingItem[]>([])
  const [camps, setCamps] = useState<Camp[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const { showToast, showConfirm } = useToast()

  useEffect(() => {
    loadItems()
    loadCamps()
  }, [showArchived])

  const loadItems = async () => {
    const res = await fetch(`/api/pricing?includeArchived=${showArchived}`)
    const data = await res.json()
    setItems(data.items || [])
  }

  const loadCamps = async () => {
    const res = await fetch('/api/camps?includeArchived=true')
    const data = await res.json()
    setCamps(data.camps || [])
  }

  const handleArchive = (id: number, currentlyActive: boolean) => {
    showConfirm(
      currentlyActive ? 'Are you sure you want to archive this pricing item?' : 'Are you sure you want to restore this pricing item?',
      async () => {
        await fetch(`/api/pricing/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentlyActive }),
        })
        showToast(currentlyActive ? 'Pricing item archived!' : 'Pricing item restored!', 'success')
        loadItems()
      }
    )
  }

  const handleSubmit = async (itemData: Partial<PricingItem>) => {
    const url = editingItem ? `/api/pricing/${editingItem.id}` : '/api/pricing'
    const method = editingItem ? 'PUT' : 'POST'
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        showToast(data.details || data.error || 'Failed to save pricing item', 'error')
        return
      }
      
      loadItems()
      setShowForm(false)
      setEditingItem(null)
      showToast('Pricing item saved successfully!', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  if (showForm || editingItem) {
    return (
      <PricingForm
        item={editingItem}
        camps={camps}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false)
          setEditingItem(null)
        }}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="font-heading text-xl font-bold text-white uppercase">Pricing Items</h2>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4"
            />
            Show archived
          </label>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Pricing Item
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          // Check if item is assigned to an active camp
          const assignedCamp = item.campId ? camps.find(c => c.id === item.campId) : null
          const isInUse = assignedCamp && assignedCamp.status === 'active'
          
          return (
            <div key={item.id} className={`card ${!item.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">{item.name}</div>
                    {!item.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Archived</span>
                    )}
                    {item.isRequired && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">Required</span>
                    )}
                    {isInUse && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">In Use</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{item.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {item.itemType} • Order: {item.displayOrder}
                    {item.campId && ` • Camp: ${assignedCamp?.name || 'Unknown'}`}
                    {!item.campId && ' • Not assigned'}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                      {item.amount < 0 ? '-' : ''}AED {Math.abs(item.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="btn-secondary text-sm py-1 px-3"
                    >
                      Edit
                    </button>
                    {isInUse ? (
                      <span className="text-xs text-gray-500 py-1 px-3" title="Cannot archive while assigned to active camp">
                        In use
                      </span>
                    ) : (
                      <button
                        onClick={() => handleArchive(item.id, item.isActive)}
                        className={`btn-secondary text-sm py-1 px-3 ${item.isActive ? 'text-red-400 hover:bg-red-900/20' : 'text-green-400 hover:bg-green-900/20'}`}
                      >
                        {item.isActive ? 'Archive' : 'Restore'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Pricing Item Form Component
function PricingForm({ 
  item, 
  camps,
  onSubmit, 
  onCancel 
}: { 
  item: PricingItem | null
  camps: Camp[]
  onSubmit: (data: Partial<PricingItem>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    amount: item?.amount || 0,
    itemType: item?.itemType || 'add_on' as 'base_fee' | 'add_on' | 'discount',
    campId: item?.campId || null as number | null,
    isRequired: item?.isRequired || false,
    isActive: item?.isActive ?? true,
    displayOrder: item?.displayOrder || 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="card max-w-2xl">
      <h2 className="font-heading text-xl font-bold text-white uppercase mb-4">
        {item ? 'Edit Pricing Item' : 'Create New Pricing Item'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Item Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            required
            placeholder="e.g., Lunch Package"
          />
        </div>
        
        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field resize-none"
            rows={2}
            placeholder="e.g., Hot lunch provided daily"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (AED) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="input-field"
              required
              placeholder="25.00"
            />
            <p className="text-xs text-gray-500 mt-1">Use negative for discounts (e.g., -10)</p>
          </div>

          <div>
            <label className="label">Type *</label>
            <select
              value={formData.itemType}
              onChange={(e) => setFormData({ ...formData, itemType: e.target.value as any })}
              className="input-field"
            >
              <option value="base_fee">Base Fee</option>
              <option value="add_on">Add-on</option>
              <option value="discount">Discount</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assign to Camp</label>
            <select
              value={formData.campId || ''}
              onChange={(e) => setFormData({ ...formData, campId: e.target.value ? parseInt(e.target.value) : null })}
              className="input-field"
            >
              <option value="">All Camps</option>
              {camps.map(camp => (
                <option key={camp.id} value={camp.id}>{camp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Display Order</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
              className="input-field"
              min="1"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={formData.isRequired}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
            />
            <span className="text-sm">Required (auto-selected)</span>
          </label>

          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span className="text-sm">Active</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1">
            {item ? 'Update Item' : 'Create Item'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// Registrations Tab (simplified)
function RegistrationsTab({ token, selectedCampId, onClearFilter }: { token: string; selectedCampId: number | null; onClearFilter: () => void }) {
  const [allRegistrations, setAllRegistrations] = useState<any[]>([])
  const [camps, setCamps] = useState<Camp[]>([])
  const [filterCampId, setFilterCampId] = useState<number | null>(selectedCampId)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [showArchivedCamps, setShowArchivedCamps] = useState(false)

  useEffect(() => {
    setFilterCampId(selectedCampId)
  }, [selectedCampId])

  useEffect(() => {
    Promise.all([
      fetch('/api/registrations', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/camps?includeArchived=true').then(r => r.json()),
    ])
      .then(([regsData, campsData]) => {
        setAllRegistrations(regsData.registrations || [])
        setCamps(campsData.camps || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  // Filter camps for dropdown
  const dropdownCamps = showArchivedCamps 
    ? camps 
    : camps.filter(c => c.status !== 'archived')

  // Filter registrations
  const filteredRegistrations = allRegistrations.filter(reg => {
    const matchesCamp = !filterCampId || reg.camp_id === filterCampId
    const matchesSearch = !searchQuery || 
      (reg.child_full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.parent_full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.phone || '').includes(searchQuery)
    return matchesCamp && matchesSearch
  })

  // Get stats - handle null/undefined payment_status
  const stats = {
    total: filteredRegistrations.length,
    paid: filteredRegistrations.filter(r => {
      const status = r.payment_status
      return status === 'paid' || status === 'free'
    }).length,
    pending: filteredRegistrations.filter(r => {
      const status = r.payment_status
      return status === null || status === undefined || status === '' || status === 'pending'
    }).length,
    revenue: filteredRegistrations.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0),
  }

  const getCampName = (campId: number) => camps.find(c => c.id === campId)?.name || 'Unknown'

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
  }

  const getPaymentBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'paid':
        return 'bg-green-900/50 text-green-400'
      case 'free':
        return 'bg-blue-900/50 text-blue-400'
      case 'pending':
      case null:
      case undefined:
      case '':
      default:
        return 'bg-yellow-900/50 text-yellow-400'
    }
  }
  
  const getPaymentLabel = (status: string | null | undefined) => {
    if (!status || status === '') return 'pending'
    return status
  }

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'confirmed': return 'bg-green-900/50 text-green-400'
      case 'pending': return 'bg-yellow-900/50 text-yellow-400'
      case 'waitlist': return 'bg-purple-900/50 text-purple-400'
      case 'cancelled': return 'bg-red-900/50 text-red-400'
      case 'attended': return 'bg-blue-900/50 text-blue-400'
      case 'no-show': return 'bg-gray-700/50 text-gray-400'
      default: return 'bg-green-900/50 text-green-400'
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading registrations...</div>
  }

  // Detail View
  if (selectedRegistration) {
    return (
      <RegistrationDetail 
        registration={selectedRegistration}
        camps={camps}
        token={token}
        onBack={() => setSelectedRegistration(null)}
        onUpdate={(updated) => {
          setSelectedRegistration(updated)
          setAllRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r))
        }}
        onDelete={() => {
          setAllRegistrations(prev => prev.filter(r => r.id !== selectedRegistration.id))
          setSelectedRegistration(null)
        }}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-bold text-white uppercase">
          Registrations ({stats.total})
        </h2>
      </div>
      
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <select
            value={filterCampId || ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : null
              setFilterCampId(val)
              if (!val) onClearFilter()
            }}
            className="input-field py-2 px-3 text-sm w-full"
          >
            <option value="">All Camps</option>
            {dropdownCamps.map(camp => (
              <option key={camp.id} value={camp.id}>
                {camp.name} {camp.status === 'archived' ? '(archived)' : ''}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={showArchivedCamps}
              onChange={(e) => setShowArchivedCamps(e.target.checked)}
              className="w-3 h-3"
            />
            Include archived camps
          </label>
        </div>
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field py-2 px-3 text-sm w-full"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 uppercase">Total</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-green-400">{stats.paid}</div>
          <div className="text-xs text-gray-500 uppercase">Paid/Free</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-gray-500 uppercase">Pending</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-brand-primary">AED {stats.revenue.toFixed(0)}</div>
          <div className="text-xs text-gray-500 uppercase">Revenue</div>
        </div>
      </div>
      
      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">
          {searchQuery ? 'No registrations match your search' : 'No registrations yet'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRegistrations.map((reg) => (
            <div 
              key={reg.id} 
              onClick={() => setSelectedRegistration(reg)}
              className="card cursor-pointer hover:border-brand-primary/50 transition-all"
            >
                <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-medium text-white">{reg.child_full_name || 'Unknown'}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(reg.registration_status)}`}>
                      {reg.registration_status || 'confirmed'}
                    </span>
                    {reg.payment_status !== 'free' && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getPaymentBadge(reg.payment_status)}`}>
                        💳 {getPaymentLabel(reg.payment_status)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {reg.parent_full_name} • {reg.email} • {reg.phone}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>{getCampName(reg.camp_id)}</span>
                    <span>{formatDate(reg.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    AED {(reg.total_amount || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Click to view →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Registration Detail Component with Edit functionality
function RegistrationDetail({ 
  registration, 
  camps, 
  token, 
  onBack, 
  onUpdate,
  onDelete 
}: { 
  registration: any
  camps: Camp[]
  token: string
  onBack: () => void
  onUpdate: (updated: any) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(registration)
  const [deleting, setDeleting] = useState(false)
  const { showToast, showConfirm } = useToast()

  const getCampName = (campId: number) => camps.find(c => c.id === campId)?.name || 'Unknown'

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
  }

  const getPaymentBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'paid': return 'bg-green-900/50 text-green-400'
      case 'free': return 'bg-blue-900/50 text-blue-400'
      default: return 'bg-yellow-900/50 text-yellow-400'
    }
  }

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'confirmed': return 'bg-green-900/50 text-green-400'
      case 'pending': return 'bg-yellow-900/50 text-yellow-400'
      case 'waitlist': return 'bg-purple-900/50 text-purple-400'
      case 'cancelled': return 'bg-red-900/50 text-red-400'
      case 'attended': return 'bg-blue-900/50 text-blue-400'
      case 'no-show': return 'bg-gray-700/50 text-gray-400'
      default: return 'bg-green-900/50 text-green-400'
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }
      
      onUpdate(formData)
      setIsEditing(false)
      showToast('Registration updated successfully!', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    showConfirm(
      `Are you sure you want to delete this registration for ${registration.child_full_name}? Personal data will be removed but a record will be kept for historical accuracy.`,
      async () => {
        setDeleting(true)
        try {
          const response = await fetch(`/api/registrations/${registration.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: 'Deleted by admin' }),
          })
          
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to delete')
          }
          
          showToast('Registration deleted successfully', 'success')
          onDelete()
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Failed to delete', 'error')
        } finally {
          setDeleting(false)
        }
      }
    )
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  // Clickable phone link
  const PhoneLink = ({ phone, className = '' }: { phone: string | null; className?: string }) => {
    if (!phone) return <span className="text-gray-500">-</span>
    return (
      <a href={`tel:${phone}`} className={`text-brand-primary hover:underline ${className}`}>
        📞 {phone}
      </a>
    )
  }

  // Clickable email link
  const EmailLink = ({ email, className = '' }: { email: string | null; className?: string }) => {
    if (!email) return <span className="text-gray-500">-</span>
    return (
      <a href={`mailto:${email}`} className={`text-brand-primary hover:underline ${className}`}>
        ✉️ {email}
      </a>
    )
  }

  // Permission display
  const PermissionItem = ({ label, field }: { label: string; field: string }) => {
    const value = formData[field]
    if (isEditing) {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value === 1 || value === true}
            onChange={(e) => updateField(field, e.target.checked ? 1 : 0)}
            className="w-4 h-4"
          />
          <span className="text-gray-300 text-sm">{label}</span>
        </label>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
          value === 1 || value === true ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          {value === 1 || value === true ? '✓' : '✗'}
        </span>
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
    )
  }

  // Editable field component
  const Field = ({ label, field, type = 'text', options }: { label: string; field: string; type?: string; options?: string[] }) => {
    const value = formData[field] || ''
    if (isEditing) {
      if (options) {
        return (
          <div>
            <span className="text-gray-500">{label}:</span>
            <select
              value={value}
              onChange={(e) => updateField(field, e.target.value)}
              className="input-field ml-2 py-1 px-2 text-sm inline-block w-auto"
            >
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )
      }
      if (type === 'textarea') {
        return (
          <div>
            <span className="text-gray-500 block mb-1">{label}:</span>
            <textarea
              value={value}
              onChange={(e) => updateField(field, e.target.value)}
              className="input-field w-full text-sm"
              rows={3}
            />
          </div>
        )
      }
      return (
        <div>
          <span className="text-gray-500">{label}:</span>
          <input
            type={type}
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="input-field ml-2 py-1 px-2 text-sm inline-block w-auto"
          />
        </div>
      )
    }
    
    // Display mode with special handling for phone/email
    if (field === 'email') {
      return <div><span className="text-gray-500">{label}:</span> <EmailLink email={value} className="ml-2" /></div>
    }
    if (field === 'phone' || field.includes('phone')) {
      return <div><span className="text-gray-500">{label}:</span> <PhoneLink phone={value} className="ml-2" /></div>
    }
    return <div><span className="text-gray-500">{label}:</span> <span className="text-white ml-2">{value || '-'}</span></div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-brand-primary hover:underline flex items-center gap-2">
          ← Back to Registrations
        </button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={() => { setFormData(registration); setIsEditing(false) }} className="btn-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="btn-primary text-sm">
                ✏️ Edit Registration
              </button>
              <button 
                onClick={handleDelete} 
                disabled={deleting}
                className="btn-secondary text-sm text-red-400 hover:bg-red-900/20"
              >
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="card">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-700">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">{formData.child_full_name || 'Unknown'}</h2>
            <p className="text-gray-400">{getCampName(formData.camp_id)}</p>
            <p className="text-gray-500 text-sm mt-1">Registered: {formatDate(formData.created_at)}</p>
          </div>
          <div className="text-right space-y-2">
            <div className="text-2xl font-bold text-white">AED {(formData.total_amount || 0).toFixed(2)}</div>
            <div className="flex gap-3 justify-end items-center flex-wrap text-sm">
              {/* Registration Status */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Status:</span>
                <select
                  value={formData.registration_status || 'confirmed'}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    const updatedData = { ...formData, registration_status: newStatus }
                    updateField('registration_status', newStatus)
                    try {
                      await fetch(`/api/registrations/${registration.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(updatedData),
                      })
                      onUpdate(updatedData)
                    } catch (err) {
                      console.error('Failed to update status:', err)
                    }
                  }}
                  className={`px-2 py-1 rounded border-0 cursor-pointer ${getStatusBadge(formData.registration_status)}`}
                >
                  <option value="confirmed">confirmed</option>
                  <option value="pending">pending</option>
                  <option value="waitlist">waitlist</option>
                  <option value="cancelled">cancelled</option>
                  <option value="attended">attended</option>
                  <option value="no-show">no-show</option>
                </select>
              </div>
              {/* Payment Status */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Payment:</span>
                <select
                  value={formData.payment_status || 'pending'}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    const updatedData = { ...formData, payment_status: newStatus }
                    updateField('payment_status', newStatus)
                    try {
                      await fetch(`/api/registrations/${registration.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(updatedData),
                      })
                      onUpdate(updatedData)
                    } catch (err) {
                      console.error('Failed to update payment status:', err)
                    }
                  }}
                  className={`px-2 py-1 rounded border-0 cursor-pointer ${getPaymentBadge(formData.payment_status)}`}
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="free">free</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Actions */}
        {!isEditing && (formData.email || formData.phone) && (
          <div className="flex gap-3 mb-6 p-3 bg-gray-800/50 rounded">
            {formData.email && (
              <a href={`mailto:${formData.email}`} className="btn-secondary text-sm flex items-center gap-2">
                ✉️ Email Parent
              </a>
            )}
            {formData.phone && (
              <a href={`tel:${formData.phone}`} className="btn-secondary text-sm flex items-center gap-2">
                📞 Call Parent
              </a>
            )}
            {formData.emergency1_phone && (
              <a href={`tel:${formData.emergency1_phone}`} className="btn-secondary text-sm flex items-center gap-2">
                🚨 Emergency 1
              </a>
            )}
            {formData.emergency2_phone && (
              <a href={`tel:${formData.emergency2_phone}`} className="btn-secondary text-sm flex items-center gap-2">
                🚨 Emergency 2
              </a>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Child Info */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Child Information</h3>
            <Field label="Full Name" field="child_full_name" />
            <Field label="Date of Birth" field="child_dob" type="date" />
            <Field label="Can Walk Home Alone" field="walk_home_alone" options={['yes', 'no']} />
          </div>

          {/* Parent Info */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Parent/Guardian</h3>
            <Field label="Full Name" field="parent_full_name" />
            <Field label="Email" field="email" type="email" />
            <Field label="Phone" field="phone" type="tel" />
            <Field label="Address" field="address" />
          </div>

          {/* Emergency Contact 1 */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Emergency Contact 1</h3>
            <Field label="Name" field="emergency1_name" />
            <Field label="Phone" field="emergency1_phone" type="tel" />
            <Field label="Relationship" field="emergency1_relationship" />
          </div>

          {/* Emergency Contact 2 */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Emergency Contact 2</h3>
            <Field label="Name" field="emergency2_name" />
            <Field label="Phone" field="emergency2_phone" type="tel" />
            <Field label="Relationship" field="emergency2_relationship" />
          </div>
        </div>

        {/* Medical & Health Information */}
        <div className="mt-6 space-y-3">
          <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Medical & Health Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Field label="Medical Conditions" field="has_medical_conditions" options={['no', 'yes']} />
              {formData.has_medical_conditions === 'yes' && (
                <Field label="Details" field="medical_conditions_details" type="textarea" />
              )}
            </div>
            <div className="space-y-2">
              <Field label="Additional Needs" field="has_additional_needs" options={['no', 'yes']} />
              {formData.has_additional_needs === 'yes' && (
                <Field label="Details" field="additional_needs_details" type="textarea" />
              )}
            </div>
            <div className="space-y-2">
              <Field label="Allergies" field="has_allergies" options={['no', 'yes']} />
              {formData.has_allergies === 'yes' && (
                <Field label="Details" field="allergies_details" type="textarea" />
              )}
            </div>
            <div className="space-y-2">
              <Field label="Medication" field="has_medication" options={['no', 'yes']} />
              {formData.has_medication === 'yes' && (
                <Field label="Details" field="medication_details" type="textarea" />
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Field label="Further Info" field="has_further_info" options={['no', 'yes']} />
              {formData.has_further_info === 'yes' && (
                <Field label="Details" field="further_info_details" type="textarea" />
              )}
            </div>
          </div>
        </div>

        {/* Authorised Collectors */}
        <div className="mt-6 space-y-3">
          <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Authorised Collectors</h3>
          {isEditing ? (
            <textarea
              value={formData.authorised_collectors || ''}
              onChange={(e) => updateField('authorised_collectors', e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="One person per line"
            />
          ) : (
            <div className="text-white bg-gray-800/50 p-3 rounded whitespace-pre-line">
              {formData.authorised_collectors || 'None specified'}
            </div>
          )}
        </div>

        {/* Admin Notes */}
        <AdminNotesSection 
          registrationId={registration.id}
          initialNotes={formData.admin_notes}
          token={token}
          onUpdate={(notes) => updateField('admin_notes', notes)}
        />

        {/* Permissions & Consent */}
        <div className="mt-6 space-y-3">
          <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">Permissions & Consent</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <PermissionItem label="Photos/Videos" field="permission_photos" />
            <PermissionItem label="Emergency Medical Treatment" field="permission_health" />
            <PermissionItem label="Camp Activities" field="permission_activities" />
            <PermissionItem label="Off-site Visits" field="permission_locations" />
            <PermissionItem label="Snacks & Meals" field="permission_meals" />
            <PermissionItem label="Bathroom Independence" field="permission_bathroom" />
            <PermissionItem label="First Aid" field="permission_first_aid" />
            <PermissionItem label="Sports Equipment" field="permission_equipment" />
            <PermissionItem label="Terms & Conditions" field="permission_app_waiver" />
          </div>
        </div>

        {/* Registration Meta */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex flex-wrap justify-between gap-4 text-sm text-gray-500">
          <span>Registration ID: {formData.id}</span>
          <span>Camp ID: {formData.camp_id}</span>
          {formData.payment_reference && <span>Payment Ref: {formData.payment_reference}</span>}
          <span>Created: {formatDate(formData.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// Admin Notes Section with instant save and chronological history
function AdminNotesSection({ 
  registrationId, 
  initialNotes, 
  token,
  onUpdate 
}: { 
  registrationId: number
  initialNotes: string | null
  token: string
  onUpdate: (notes: string) => void
}) {
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState<Array<{ text: string; timestamp: string }>>([])
  const { showToast, showConfirm } = useToast()

  // Parse existing notes on mount
  useEffect(() => {
    if (initialNotes) {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(initialNotes)
        if (Array.isArray(parsed)) {
          setNotes(parsed)
        } else {
          // Legacy: single string note, convert to array
          setNotes([{ text: initialNotes, timestamp: new Date().toISOString() }])
        }
      } catch {
        // Legacy: plain text, convert to array
        if (initialNotes.trim()) {
          setNotes([{ text: initialNotes, timestamp: 'Unknown date' }])
        }
      }
    }
  }, [initialNotes])

  const formatNoteDate = (timestamp: string) => {
    if (timestamp === 'Unknown date') return timestamp
    try {
      return new Date(timestamp).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    
    setSaving(true)
    const newNoteEntry = {
      text: newNote.trim(),
      timestamp: new Date().toISOString()
    }
    const updatedNotes = [...notes, newNoteEntry]
    const notesJson = JSON.stringify(updatedNotes)
    
    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_notes: notesJson }),
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      setNotes(updatedNotes)
      onUpdate(notesJson)
      setNewNote('')
      showToast('Note added successfully!', 'success')
    } catch (error) {
      showToast('Failed to save note', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = (index: number) => {
    showConfirm('Are you sure you want to delete this note?', async () => {
      setSaving(true)
      const updatedNotes = notes.filter((_, i) => i !== index)
      const notesJson = updatedNotes.length > 0 ? JSON.stringify(updatedNotes) : ''
      
      try {
        const response = await fetch(`/api/registrations/${registrationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_notes: notesJson }),
        })
        
        if (!response.ok) throw new Error('Failed to delete')
        
        setNotes(updatedNotes)
        onUpdate(notesJson)
        showToast('Note deleted!', 'success')
      } catch (error) {
        showToast('Failed to delete note', 'error')
      } finally {
        setSaving(false)
      }
    })
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="font-heading text-lg text-yellow-500 uppercase border-b border-yellow-700 pb-2">
        📝 Admin Notes <span className="text-xs text-gray-500 normal-case font-normal">(internal only - {notes.length} notes)</span>
      </h3>
      
      {/* Add new note */}
      <div className="flex gap-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="input-field flex-1 bg-yellow-900/10 border-yellow-700/30"
          rows={2}
          placeholder="Add a note..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              handleAddNote()
            }
          }}
        />
        <button
          onClick={handleAddNote}
          disabled={saving || !newNote.trim()}
          className="btn-primary px-4 self-end"
        >
          {saving ? '...' : '+ Add'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Press ⌘+Enter to add quickly</p>
      
      {/* Notes history */}
      {notes.length > 0 && (
        <div className="space-y-2 mt-4">
          {[...notes].reverse().map((note, reverseIndex) => {
            const index = notes.length - 1 - reverseIndex
            return (
              <div key={index} className="bg-yellow-900/10 border border-yellow-700/30 rounded p-3 group">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-white whitespace-pre-wrap flex-1">{note.text}</p>
                  <button
                    onClick={() => handleDeleteNote(index)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                    title="Delete note"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-yellow-600/70 mt-2">{formatNoteDate(note.timestamp)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

