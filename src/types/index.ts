// Open Camp Types

export interface RegistrationFormData {
  // Camp selection
  campId: number
  
  // Contact & Child Info
  email: string
  childFullName: string
  childAge: string
  childDob: string
  parentFullName: string
  address: string
  phone: string
  
  // Emergency Contacts
  emergency1Name: string
  emergency1Phone: string
  emergency1Relationship: string
  emergency2Name: string
  emergency2Phone: string
  emergency2Relationship: string
  
  // Collection & Safety
  authorisedCollectors: string
  walkHomeAlone: string
  
  // Medical Information
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
  
  // Permissions
  permissionPhotos: boolean
  permissionHealth: boolean
  permissionActivities: boolean
  permissionLocations: boolean
  permissionMeals: boolean
  permissionBathroom: boolean
  permissionFirstAid: boolean
  permissionEquipment: boolean
  permissionAppWaiver: boolean
  
  // Pricing selections
  selectedItems: number[]  // IDs of selected pricing items
}

export interface Registration extends RegistrationFormData {
  id?: number
  campId: number
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentReference?: string
  createdAt?: string
}

export interface Camp {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  ageMin: number
  ageMax: number
  maxSpots: number
  spotsTaken: number
  status: 'active' | 'full' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface PricingItem {
  id: number
  campId: number | null
  name: string
  description: string
  amount: number
  itemType: 'base_fee' | 'add_on' | 'discount'
  isRequired: boolean
  isActive: boolean
  displayOrder: number
  createdAt: string
}

export interface RegistrationItem {
  id: number
  registrationId: number
  pricingItemId: number
  quantity: number
  amount: number
  createdAt: string
}

export interface StatusResponse {
  spotsLeft: number
  total: number
  max: number
  isFull: boolean
}

export interface CampWithPricing extends Camp {
  pricingItems: PricingItem[]
  spotsRemaining: number
}
