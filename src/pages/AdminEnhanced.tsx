import { useState, useEffect } from 'react'
import { Camp, PricingItem } from '../types'

const STORAGE_KEY = 'opencamp_admin_token'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  loading: boolean
}

type TabType = 'dashboard' | 'camps' | 'pricing' | 'registrations'

export default function AdminEnhanced() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    loading: true,
  })
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null)

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
        setSelectedCampId(campId)
        setActiveTab('registrations')
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

  useEffect(() => {
    loadCamps()
  }, [])

  const loadCamps = async () => {
    const res = await fetch('/api/camps')
    const data = await res.json()
    setCamps(data.camps || [])
  }

  const handleSubmit = async (campData: Partial<Camp>, pricingItems: PricingItem[]) => {
    const url = editingCamp ? `/api/camps/${editingCamp.id}` : '/api/camps'
    const method = editingCamp ? 'PUT' : 'POST'
    
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
        alert(`Error: ${errorMsg}`)
        console.error('Camp creation failed:', data)
        return
      }
      
      const campId = editingCamp?.id || data.id
      
      // Then save/update pricing items for this camp
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
      
      loadCamps()
      setShowForm(false)
      setEditingCamp(null)
    } catch (error) {
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Network error:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Archive this camp?')) return
    
    await fetch(`/api/camps/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    
    loadCamps()
  }

  if (showForm || editingCamp) {
    return (
      <CampForm
        camp={editingCamp}
        token={token}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false)
          setEditingCamp(null)
        }}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-bold text-white uppercase">Manage Camps</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Camp
        </button>
      </div>

      <div className="space-y-4">
        {camps.map((camp) => (
          <div key={camp.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-heading text-lg font-bold text-white">{camp.name}</h3>
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
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/camp/${camp.id}`
                    navigator.clipboard.writeText(url)
                    alert('Registration link copied!\n\n' + url)
                  }}
                  className="btn-secondary text-sm py-1 px-3 text-green-400 hover:bg-green-900/20"
                  title="Copy registration link"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => onViewRegistrations(camp.id)}
                  className="btn-secondary text-sm py-1 px-3 text-blue-400 hover:bg-blue-900/20"
                >
                  View Registrations
                </button>
                <button
                  onClick={() => setEditingCamp(camp)}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(camp.id)}
                  className="btn-secondary text-sm py-1 px-3 text-red-400 hover:bg-red-900/20"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Camp Form Component
function CampForm({ 
  camp, 
  onSubmit, 
  onCancel 
}: { 
  camp: Camp | null
  token: string
  onSubmit: (data: Partial<Camp>, pricingItems: PricingItem[]) => void
  onCancel: () => void
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

  // Load all pricing items
  useEffect(() => {
    fetch('/api/pricing')
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
    onSubmit(formData, getSelectedItems())
  }

  return (
    <div className="card max-w-3xl">
      <h2 className="font-heading text-xl font-bold text-white uppercase mb-4">
        {camp ? 'Edit Camp' : 'Create New Camp'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-3 gap-4">
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
            <label className="label">Status</label>
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

        {/* Sibling Discount Section */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">
            Sibling Discount
          </h3>
          <p className="text-gray-400 text-sm">
            Automatically apply a discount when registering multiple children from the same family.
          </p>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.siblingDiscountEnabled}
              onChange={(e) => setFormData({ ...formData, siblingDiscountEnabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Enable sibling discount</span>
          </label>
          
          {formData.siblingDiscountEnabled && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded border border-gray-700">
              <div>
                <label className="label">Discount Type</label>
                <select
                  value={formData.siblingDiscountType}
                  onChange={(e) => setFormData({ ...formData, siblingDiscountType: e.target.value as 'fixed' | 'percentage' })}
                  className="input-field"
                >
                  <option value="fixed">Fixed Amount (AED)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="label">
                  {formData.siblingDiscountType === 'percentage' ? 'Discount %' : 'Discount Amount (AED)'}
                </label>
                <input
                  type="number"
                  value={formData.siblingDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, siblingDiscountAmount: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                  step={formData.siblingDiscountType === 'percentage' ? '1' : '0.01'}
                />
              </div>
              <div className="col-span-2 text-sm text-gray-400 bg-gray-900/50 p-3 rounded">
                <strong>How it works:</strong> The discount is applied to each additional child (2nd, 3rd, etc.). 
                {formData.siblingDiscountType === 'percentage' 
                  ? ` Each sibling gets ${formData.siblingDiscountAmount}% off their registration.`
                  : ` Each sibling gets AED ${formData.siblingDiscountAmount.toFixed(2)} off their registration.`
                }
              </div>
            </div>
          )}
        </div>

        {/* Pricing Section */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg text-brand-primary uppercase border-b border-gray-700 pb-2">
            Pricing Items
          </h3>

          {/* Select from existing pricing items */}
          {allPricingItems.length > 0 && (
            <div className="space-y-2">
              <label className="label text-sm text-gray-400">Select from existing pricing items:</label>
              <div className="grid gap-2 max-h-60 overflow-y-auto p-2 bg-gray-800/30 rounded border border-gray-700">
                {allPricingItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${
                      selectedItemIds.has(item.id)
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {item.name}
                          {item.isRequired && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">Required</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.itemType}
                          {item.campId && ' • Camp-specific'}
                          {!item.campId && ' • Global'}
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                      {item.amount < 0 ? '-' : ''}AED {Math.abs(item.amount).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* New items created for this camp */}
          {newItems.length > 0 && (
            <div className="space-y-2">
              <label className="label text-sm text-gray-400">New items for this camp:</label>
              {newItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-green-900/20 rounded border border-green-700">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {item.name}
                        <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">New</span>
                        {item.isRequired && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">Required</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{item.itemType}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                      {item.amount < 0 ? '-' : ''}AED {Math.abs(item.amount).toFixed(2)}
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
            <div className="p-4 bg-gray-800/50 rounded border border-gray-600 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-sm">Name *</label>
                  <input
                    type="text"
                    value={newPricing.name}
                    onChange={(e) => setNewPricing({ ...newPricing, name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g., Camp Fee"
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
                    placeholder="150.00"
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
                  placeholder="e.g., Full week camp registration"
                />
              </div>
              <div className="flex gap-4 items-center">
                <select
                  value={newPricing.itemType}
                  onChange={(e) => setNewPricing({ ...newPricing, itemType: e.target.value as any })}
                  className="input-field text-sm w-40"
                >
                  <option value="base_fee">Base Fee</option>
                  <option value="add_on">Add-on</option>
                  <option value="discount">Discount</option>
                </select>
                <label className="flex items-center gap-2 text-white text-sm">
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
                  Add Item
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

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button type="submit" className="btn-primary flex-1">
            {camp ? 'Update Camp' : 'Create Camp'}
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

  useEffect(() => {
    loadItems()
    loadCamps()
  }, [])

  const loadItems = async () => {
    const res = await fetch('/api/pricing')
    const data = await res.json()
    setItems(data.items || [])
  }

  const loadCamps = async () => {
    const res = await fetch('/api/camps')
    const data = await res.json()
    setCamps(data.camps || [])
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
        alert(`Error: ${data.details || data.error || 'Failed to save pricing item'}`)
        return
      }
      
      loadItems()
      setShowForm(false)
      setEditingItem(null)
    } catch (error) {
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this pricing item?')) return
    
    await fetch(`/api/pricing/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    
    loadItems()
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
        <h2 className="font-heading text-xl font-bold text-white uppercase">Pricing Items</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Pricing Item
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-white">{item.name}</div>
                  {!item.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Inactive</span>
                  )}
                  {item.isRequired && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">Required</span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">{item.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {item.itemType} • Order: {item.displayOrder}
                  {item.campId && ` • Camp: ${camps.find(c => c.id === item.campId)?.name || 'Unknown'}`}
                  {!item.campId && ' • All Camps'}
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
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn-secondary text-sm py-1 px-3 text-red-400 hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
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
  const [registrations, setRegistrations] = useState<any[]>([])
  const [allRegistrations, setAllRegistrations] = useState<any[]>([])
  const [campName, setCampName] = useState<string>('')

  useEffect(() => {
    fetch('/api/registrations', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const regs = data.registrations || []
        setAllRegistrations(regs)
        setRegistrations(regs)
      })
  }, [token])

  useEffect(() => {
    if (selectedCampId) {
      const filtered = allRegistrations.filter(reg => reg.camp_id === selectedCampId)
      setRegistrations(filtered)
      
      // Get camp name
      fetch('/api/camps')
        .then(r => r.json())
        .then(data => {
          const camp = data.camps?.find((c: any) => c.id === selectedCampId)
          setCampName(camp?.name || 'Unknown Camp')
        })
    } else {
      setRegistrations(allRegistrations)
      setCampName('')
    }
  }, [selectedCampId, allRegistrations])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-bold text-white uppercase">
          Registrations {selectedCampId && `- ${campName}`} ({registrations.length})
        </h2>
        {selectedCampId && (
          <button onClick={onClearFilter} className="btn-secondary text-sm">
            Show All Camps
          </button>
        )}
      </div>
      
      {registrations.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">
          No registrations {selectedCampId ? 'for this camp' : 'yet'}
        </div>
      ) : (
        <div className="space-y-2">
          {registrations.map((reg) => (
            <div key={reg.id} className="card">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium text-white">{reg.childFullName || reg.child_full_name}</div>
                  <div className="text-sm text-gray-400">
                    {reg.parentFullName || reg.parent_full_name} • {reg.email}
                  </div>
                  {!selectedCampId && (
                    <div className="text-xs text-gray-500 mt-1">{reg.campName || 'Camp ID: ' + reg.camp_id}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    AED {(reg.total_amount || reg.totalAmount || 0).toFixed(2)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    (reg.payment_status || reg.paymentStatus) === 'paid' 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {reg.payment_status || reg.paymentStatus || 'pending'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

