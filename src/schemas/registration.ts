import { z } from 'zod'

export const registrationSchema = z.object({
  // Basic Info
  email: z.string().email('Please enter a valid email address'),
  childFullName: z.string().min(2, 'Child\'s full name is required'),
  childAge: z.string().min(1, 'Please select child\'s age'),
  childDob: z.string().min(1, 'Date of birth is required'),
  parentFullName: z.string().min(2, 'Parent\'s full name is required'),
  address: z.string().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number'),

  // Emergency Contact 1
  emergency1Name: z.string().min(2, 'Emergency contact name is required'),
  emergency1Phone: z.string().min(10, 'Emergency contact phone is required'),
  emergency1Relationship: z.string().min(1, 'Relationship is required'),

  // Emergency Contact 2
  emergency2Name: z.string().optional(),
  emergency2Phone: z.string().optional(),
  emergency2Relationship: z.string().optional(),

  // Authorised Collectors
  authorisedCollectors: z.string().optional(),

  // Walk Home
  walkHomeAlone: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),

  // Medical - conditional fields
  hasMedicalConditions: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  medicalConditionsDetails: z.string().optional(),

  hasAdditionalNeeds: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  additionalNeedsDetails: z.string().optional(),

  hasAllergies: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  allergiesDetails: z.string().optional(),

  hasMedication: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  medicationDetails: z.string().optional(),

  hasFurtherInfo: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  furtherInfoDetails: z.string().optional(),

  // Permission Checkboxes
  permissionPhotos: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionHealth: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionActivities: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionLocations: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionMeals: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionBathroom: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionFirstAid: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionEquipment: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
  permissionAppWaiver: z.boolean().refine(val => val === true, {
    message: 'You must agree to this permission',
  }),
}).refine((data) => {
  if (data.hasMedicalConditions === 'yes' && !data.medicalConditionsDetails) {
    return false
  }
  return true
}, {
  message: 'Please provide details about medical conditions',
  path: ['medicalConditionsDetails'],
}).refine((data) => {
  if (data.hasAdditionalNeeds === 'yes' && !data.additionalNeedsDetails) {
    return false
  }
  return true
}, {
  message: 'Please provide details about additional needs',
  path: ['additionalNeedsDetails'],
}).refine((data) => {
  if (data.hasAllergies === 'yes' && !data.allergiesDetails) {
    return false
  }
  return true
}, {
  message: 'Please provide details about allergies',
  path: ['allergiesDetails'],
}).refine((data) => {
  if (data.hasMedication === 'yes' && !data.medicationDetails) {
    return false
  }
  return true
}, {
  message: 'Please provide details about medication',
  path: ['medicationDetails'],
}).refine((data) => {
  if (data.hasFurtherInfo === 'yes' && !data.furtherInfoDetails) {
    return false
  }
  return true
}, {
  message: 'Please provide further information',
  path: ['furtherInfoDetails'],
})

export type RegistrationFormData = z.infer<typeof registrationSchema>

