export interface Registration {
  id?: number
  email: string
  childFullName: string
  childAge: string
  childDob: string
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
  walkHomeAlone: 'yes' | 'no'
  hasMedicalConditions: 'yes' | 'no'
  medicalConditionsDetails?: string
  hasAdditionalNeeds: 'yes' | 'no'
  additionalNeedsDetails?: string
  hasAllergies: 'yes' | 'no'
  allergiesDetails?: string
  hasMedication: 'yes' | 'no'
  medicationDetails?: string
  hasFurtherInfo: 'yes' | 'no'
  furtherInfoDetails?: string
  permissionPhotos: boolean
  permissionHealth: boolean
  permissionActivities: boolean
  permissionLocations: boolean
  permissionMeals: boolean
  permissionBathroom: boolean
  permissionFirstAid: boolean
  permissionEquipment: boolean
  permissionAppWaiver: boolean
  createdAt?: string
}

export interface CampCapacity {
  total: number
  registered: number
  remaining: number
}
