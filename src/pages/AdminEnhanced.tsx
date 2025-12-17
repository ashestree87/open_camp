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
      {activeTab === 'pricing' && <PricingTab />}
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

  const handleSubmit = async (campData: Partial<Camp>) => {
    const url = editingCamp ? `/api/camps/${editingCamp.id}` : '/api/camps'
    const method = editingCamp ? 'PUT' : 'POST'
    
    try {
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
        // Show the actual error to the user
        const errorMsg = data.details || data.error || data.hint || 'Unknown error'
        alert(`Error: ${errorMsg}`)
        console.error('Camp creation failed:', data)
        return
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
  onSubmit: (data: Partial<Camp>) => void
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
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="card max-w-2xl">
      <h2 className="font-heading text-xl font-bold text-white uppercase mb-4">
        {camp ? 'Edit Camp' : 'Create New Camp'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex gap-3">
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

// Pricing Tab (simplified - you can expand later)
function PricingTab() {
  const [items, setItems] = useState<PricingItem[]>([])

  useEffect(() => {
    fetch('/api/pricing')
      .then(r => r.json())
      .then(data => setItems(data.items || []))
  }, [])

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-white uppercase mb-4">Pricing Items</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium text-white">{item.name}</div>
              <div className="text-sm text-gray-400">{item.description}</div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                £{Math.abs(item.amount).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">{item.itemType}</div>
            </div>
          </div>
        ))}
      </div>
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
                    £{(reg.total_amount || reg.totalAmount || 0).toFixed(2)}
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

