import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registrationSchema, type RegistrationFormData } from '../schemas/registration'

interface StatusResponse {
  spotsLeft: number
  total: number
  max: number
  isFull: boolean
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export default function RegistrationForm() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState<LoadingState>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      permissionPhotos: false,
      permissionHealth: false,
      permissionActivities: false,
      permissionLocations: false,
      permissionMeals: false,
      permissionBathroom: false,
      permissionFirstAid: false,
      permissionEquipment: false,
      permissionAppWaiver: false,
    },
  })

  // Watch conditional fields
  const hasMedicalConditions = watch('hasMedicalConditions')
  const hasAdditionalNeeds = watch('hasAdditionalNeeds')
  const hasAllergies = watch('hasAllergies')
  const hasMedication = watch('hasMedication')
  const hasFurtherInfo = watch('hasFurtherInfo')

  // Fetch status from API
  const fetchStatus = useCallback(async () => {
    setStatusLoading('loading')
    try {
      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }

      const data: StatusResponse = await response.json()
      setStatus(data)
      setStatusLoading('success')
    } catch (err) {
      console.error('Status fetch error:', err)
      // Set default status on error
      setStatus({
        spotsLeft: 20,
        total: 0,
        max: 20,
        isFull: false,
      })
      setStatusLoading('error')
    }
  }, [])

  // Fetch status on mount
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const onSubmit = async (data: RegistrationFormData) => {
    if (status?.isFull) {
      setError('Registration is full. No spots available.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (result.error?.toLowerCase().includes('full') || 
            result.error?.toLowerCase().includes('no spots')) {
          // Refresh status to show updated count
          await fetchStatus()
          throw new Error('Sorry, registration just filled up! Please contact us to join the waitlist.')
        }
        throw new Error(result.error || 'Registration failed. Please try again.')
      }

      // Update status with new counts from response
      if (result.spotsLeft !== undefined) {
        setStatus({
          spotsLeft: result.spotsLeft,
          total: result.total,
          max: result.max,
          isFull: result.spotsLeft === 0,
        })
      }

      // Store email for confirmation message
      setSubmittedEmail(data.email)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      // Refresh status in case of error
      fetchStatus()
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state while fetching initial status
  if (statusLoading === 'loading' && !status) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <div className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-brand-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-400 font-heading text-lg">Loading registration form...</span>
          </div>
        </div>
      </div>
    )
  }

  // Success Page
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading text-3xl font-bold text-white mb-4 uppercase">
            Registration Complete!
          </h2>
          <p className="text-gray-300 mb-2">
            Thank you for registering your child for Kids Camp.
          </p>
          
          <div className="bg-brand-gray border border-gray-700 rounded-lg p-4 my-6 text-left">
            <h3 className="font-heading text-sm font-semibold text-brand-primary uppercase mb-2">
              What happens next?
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>A confirmation email will be sent to <strong className="text-white">{submittedEmail}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Payment details and camp information will follow</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Check your spam folder if you don't see our email</span>
              </li>
            </ul>
          </div>

          {status && status.spotsLeft > 0 && (
            <p className="text-gray-500 text-sm mb-6">
              {status.spotsLeft} spot{status.spotsLeft !== 1 ? 's' : ''} remaining
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false)
                setSubmittedEmail('')
                reset()
                fetchStatus()
              }}
              className="btn-primary"
            >
              Register Another Child
            </button>
            <a href="/" className="btn-secondary">
              Return Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const isFull = status?.isFull ?? false
  const spotsLeft = status?.spotsLeft ?? 0
  const maxSpots = status?.max ?? 20

  return (
    <div className="max-w-2xl mx-auto">
      {/* Capacity Banner */}
      <div className={`mb-6 p-4 rounded-lg text-center font-heading uppercase tracking-wide ${
        isFull 
          ? 'bg-red-900/50 border border-red-600' 
          : spotsLeft <= 5 
            ? 'bg-yellow-900/50 border border-yellow-600'
            : 'bg-brand-gray border border-gray-700'
      }`}>
        {statusLoading === 'loading' ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-400">Checking availability...</span>
          </div>
        ) : isFull ? (
          <div>
            <span className="text-2xl font-bold text-red-400">SOLD OUT</span>
            <p className="text-red-300 text-sm mt-1">All spots have been filled for this camp</p>
          </div>
        ) : (
          <div>
            <span className="text-xl text-white">
              Spots Remaining: <span className={spotsLeft <= 5 ? 'text-yellow-400' : 'text-brand-primary'}>{spotsLeft}</span> / {maxSpots}
            </span>
            {spotsLeft <= 5 && (
              <p className="text-yellow-400 text-sm mt-1">Limited spots available – register now!</p>
            )}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold text-white mb-3 uppercase">
          Kids Camp Registration
        </h2>
        <div className="bg-brand-gray border-l-4 border-brand-primary p-4 rounded-r-lg">
          <p className="text-gray-300 text-sm">
            Welcome to Kids Camp! Please complete all required fields marked with an asterisk (*). 
            Your information will be kept confidential and used only for camp administration and emergency purposes.
          </p>
        </div>
      </div>

      {isFull ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="font-heading text-2xl text-white mb-2 uppercase">Registration Closed</h3>
          <p className="text-gray-400 mb-6">
            All {maxSpots} spots have been filled for this camp session.
          </p>
          <div className="bg-brand-gray border border-gray-700 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-heading text-sm font-semibold text-brand-primary uppercase mb-2">
              Want to join the waitlist?
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Contact us to be notified if a spot becomes available or for future camp dates.
            </p>
            <a 
              href="mailto:info@example.com?subject=Kids Camp Waitlist"
              className="btn-primary inline-block text-sm"
            >
              Contact Us
            </a>
          </div>
          <button 
            onClick={fetchStatus}
            className="mt-6 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            ↻ Check availability again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Child Information */}
          <section className="card">
            <h3 className="font-heading text-xl font-semibold text-white mb-6 uppercase border-b border-gray-700 pb-3">
              Child Information
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="childFullName" className="label">
                  Child's Full Name <span className="text-brand-primary">*</span>
                </label>
                <input
                  type="text"
                  id="childFullName"
                  {...register('childFullName')}
                  disabled={submitting}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter child's full name"
                />
                {errors.childFullName && (
                  <p className="text-red-400 text-sm mt-1">{errors.childFullName.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="childAge" className="label">
                    Child's Age
                  </label>
                  <select 
                    id="childAge" 
                    {...register('childAge')} 
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select age</option>
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((age) => (
                      <option key={age} value={age}>{age} years old</option>
                    ))}
                  </select>
                  {errors.childAge && (
                    <p className="text-red-400 text-sm mt-1">{errors.childAge.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="childDob" className="label">
                    Child's Date of Birth <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="date"
                    id="childDob"
                    {...register('childDob')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.childDob && (
                    <p className="text-red-400 text-sm mt-1">{errors.childDob.message}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Parent/Guardian Information */}
          <section className="card">
            <h3 className="font-heading text-xl font-semibold text-white mb-6 uppercase border-b border-gray-700 pb-3">
              Parent/Guardian Information
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email Address <span className="text-brand-primary">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  disabled={submitting}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="parentFullName" className="label">
                  Parent/Guardian Full Name <span className="text-brand-primary">*</span>
                </label>
                <input
                  type="text"
                  id="parentFullName"
                  {...register('parentFullName')}
                  disabled={submitting}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your full name"
                />
                {errors.parentFullName && (
                  <p className="text-red-400 text-sm mt-1">{errors.parentFullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="label">
                  Address
                </label>
                <textarea
                  id="address"
                  {...register('address')}
                  disabled={submitting}
                  rows={3}
                  className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Street address, city, postcode"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone Number <span className="text-brand-primary">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone')}
                  disabled={submitting}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="07XXX XXXXXX"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Emergency Contacts */}
          <section className="card">
            <h3 className="font-heading text-xl font-semibold text-white mb-6 uppercase border-b border-gray-700 pb-3">
              Emergency Contacts
            </h3>
            
            {/* Emergency Contact 1 */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-4">Emergency Contact 1 <span className="text-brand-primary">*</span></h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="emergency1Name" className="label">Name</label>
                  <input
                    type="text"
                    id="emergency1Name"
                    {...register('emergency1Name')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Contact name"
                  />
                  {errors.emergency1Name && (
                    <p className="text-red-400 text-sm mt-1">{errors.emergency1Name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="emergency1Phone" className="label">Phone Number</label>
                  <input
                    type="tel"
                    id="emergency1Phone"
                    {...register('emergency1Phone')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="07XXX XXXXXX"
                  />
                  {errors.emergency1Phone && (
                    <p className="text-red-400 text-sm mt-1">{errors.emergency1Phone.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="emergency1Relationship" className="label">Relationship</label>
                  <input
                    type="text"
                    id="emergency1Relationship"
                    {...register('emergency1Relationship')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. Grandparent"
                  />
                  {errors.emergency1Relationship && (
                    <p className="text-red-400 text-sm mt-1">{errors.emergency1Relationship.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact 2 */}
            <div>
              <h4 className="text-white font-medium mb-4">Emergency Contact 2 <span className="text-gray-500">(Optional)</span></h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="emergency2Name" className="label">Name</label>
                  <input
                    type="text"
                    id="emergency2Name"
                    {...register('emergency2Name')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <label htmlFor="emergency2Phone" className="label">Phone Number</label>
                  <input
                    type="tel"
                    id="emergency2Phone"
                    {...register('emergency2Phone')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="07XXX XXXXXX"
                  />
                </div>
                <div>
                  <label htmlFor="emergency2Relationship" className="label">Relationship</label>
                  <input
                    type="text"
                    id="emergency2Relationship"
                    {...register('emergency2Relationship')}
                    disabled={submitting}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. Aunt/Uncle"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Collection & Safety */}
          <section className="card">
            <h3 className="font-heading text-xl font-semibold text-white mb-6 uppercase border-b border-gray-700 pb-3">
              Collection & Safety
            </h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="authorisedCollectors" className="label">
                  Authorised Collectors
                </label>
                <p className="text-gray-500 text-sm mb-2">
                  Please list the names of anyone authorised to collect your child (other than yourself). 
                  We will not release your child to anyone not listed here.
                </p>
                <textarea
                  id="authorisedCollectors"
                  {...register('authorisedCollectors')}
                  disabled={submitting}
                  rows={3}
                  className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Name 1&#10;Name 2&#10;Name 3"
                />
              </div>

              <div>
                <label className="label">
                  Is your child allowed to walk home alone? <span className="text-brand-primary">*</span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yes"
                      {...register('walkHomeAlone')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="no"
                      {...register('walkHomeAlone')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
                {errors.walkHomeAlone && (
                  <p className="text-red-400 text-sm mt-1">{errors.walkHomeAlone.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Medical & Health Information */}
          <section className="card">
            <h3 className="font-heading text-xl font-semibold text-white mb-6 uppercase border-b border-gray-700 pb-3">
              Medical & Health Information
            </h3>
            
            <div className="space-y-6">
              {/* Medical Conditions */}
              <div>
                <label className="label">
                  Does your child have any medical conditions? <span className="text-brand-primary">*</span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yes"
                      {...register('hasMedicalConditions')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="no"
                      {...register('hasMedicalConditions')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
                {errors.hasMedicalConditions && (
                  <p className="text-red-400 text-sm mt-1">{errors.hasMedicalConditions.message}</p>
                )}
                {hasMedicalConditions === 'yes' && (
                  <div className="mt-3">
                    <textarea
                      {...register('medicalConditionsDetails')}
                      disabled={submitting}
                      rows={3}
                      className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Please provide details of any medical conditions..."
                    />
                    {errors.medicalConditionsDetails && (
                      <p className="text-red-400 text-sm mt-1">{errors.medicalConditionsDetails.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Needs */}
              <div>
                <label className="label">
                  Does your child have any additional needs? <span className="text-brand-primary">*</span>
                </label>
                <p className="text-gray-500 text-sm mb-2">
                  e.g. ADHD, autism, sensory processing, learning difficulties
                </p>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yes"
                      {...register('hasAdditionalNeeds')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="no"
                      {...register('hasAdditionalNeeds')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
                {errors.hasAdditionalNeeds && (
                  <p className="text-red-400 text-sm mt-1">{errors.hasAdditionalNeeds.message}</p>
                )}
                {hasAdditionalNeeds === 'yes' && (
                  <div className="mt-3">
                    <textarea
                      {...register('additionalNeedsDetails')}
                      disabled={submitting}
                      rows={3}
                      className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Please provide details of any additional needs..."
                    />
                    {errors.additionalNeedsDetails && (
                      <p className="text-red-400 text-sm mt-1">{errors.additionalNeedsDetails.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div>
                <label className="label">
                  Does your child have any allergies? <span className="text-brand-primary">*</span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yes"
                      {...register('hasAllergies')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="no"
                      {...register('hasAllergies')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
                {errors.hasAllergies && (
                  <p className="text-red-400 text-sm mt-1">{errors.hasAllergies.message}</p>
                )}
                {hasAllergies === 'yes' && (
                  <div className="mt-3">
                    <textarea
                      {...register('allergiesDetails')}
                      disabled={submitting}
                      rows={3}
                      className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Please list all allergies and their severity..."
                    />
                    {errors.allergiesDetails && (
                      <p className="text-red-400 text-sm mt-1">{errors.allergiesDetails.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Medication */}
              <div>
                <label className="label">
                  Does your child require any medication during camp? <span className="text-brand-primary">*</span>
                </label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yes"
                      {...register('hasMedication')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="no"
                      {...register('hasMedication')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
                {errors.hasMedication && (
                  <p className="text-red-400 text-sm mt-1">{errors.hasMedication.message}</p>
                )}
                {hasMedication === 'yes' && (
                  <div className="mt-3">
                    <textarea
                      {...register('medicationDetails')}
                      disabled={submitting}
                      rows={3}
                      className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Please provide medication name, dosage, and administration times..."
                    />
                    {errors.medicationDetails && (
                      <p className="text-red-400 text-sm mt-1">{errors.medicationDetails.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Further Information */}
              <div>
                <label className="label">
                  Is there any other information we should know? <span className="text-brand-primary">*</span>
                </label>
                <p className="text-gray-500 text-sm mb-2">
                  e.g. dietary requirements, fears, behavioural considerations
                </p>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="yes"
                      {...register('hasFurtherInfo')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="no"
                      {...register('hasFurtherInfo')}
                      disabled={submitting}
                      className="w-4 h-4 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
                {errors.hasFurtherInfo && (
                  <p className="text-red-400 text-sm mt-1">{errors.hasFurtherInfo.message}</p>
                )}
                {hasFurtherInfo === 'yes' && (
                  <div className="mt-3">
                    <textarea
                      {...register('furtherInfoDetails')}
                      disabled={submitting}
                      rows={3}
                      className="input-field resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Please provide any additional information..."
                    />
                    {errors.furtherInfoDetails && (
                      <p className="text-red-400 text-sm mt-1">{errors.furtherInfoDetails.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Permissions & Consent */}
          <section className="card">
            <h3 className="font-heading text-xl font-semibold text-white mb-6 uppercase border-b border-gray-700 pb-3">
              Permissions & Consent
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Please read and agree to all permissions below. All checkboxes must be ticked to complete registration.
            </p>
            
            <div className="space-y-4">
              {/* Photos & Videos */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionPhotos')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Photos & Videos Permission</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for my child to be photographed and/or filmed during camp activities. 
                    Images may be used for promotional materials, social media, and website.
                  </p>
                  {errors.permissionPhotos && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionPhotos.message}</p>
                  )}
                </div>
              </label>

              {/* Health Declaration */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionHealth')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Health Declaration</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I confirm that my child is in good health and fit to participate in physical activities. 
                    I have disclosed all relevant medical information above.
                  </p>
                  {errors.permissionHealth && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionHealth.message}</p>
                  )}
                </div>
              </label>

              {/* Physical Activities */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionActivities')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Physical Activities Consent</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for my child to participate in fitness activities, 
                    games, and other physical activities appropriate for their age and ability level.
                  </p>
                  {errors.permissionActivities && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionActivities.message}</p>
                  )}
                </div>
              </label>

              {/* Off-Site Locations */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionLocations')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Off-Site Activities Permission</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for my child to participate in supervised trips to local parks, 
                    facilities, and other approved locations as part of camp activities.
                  </p>
                  {errors.permissionLocations && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionLocations.message}</p>
                  )}
                </div>
              </label>

              {/* Meals & Snacks */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionMeals')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Meals & Snacks</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for my child to be provided with snacks and drinks during camp. 
                    I have disclosed all dietary requirements and allergies above.
                  </p>
                  {errors.permissionMeals && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionMeals.message}</p>
                  )}
                </div>
              </label>

              {/* Bathroom */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionBathroom')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Bathroom Assistance</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for staff to assist my child with bathroom needs if required, 
                    maintaining appropriate safeguarding practices at all times.
                  </p>
                  {errors.permissionBathroom && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionBathroom.message}</p>
                  )}
                </div>
              </label>

              {/* First Aid */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionFirstAid')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">First Aid & Emergency Treatment</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for trained staff to administer first aid and, in an emergency, 
                    for my child to receive medical treatment including being transported to hospital if necessary.
                  </p>
                  {errors.permissionFirstAid && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionFirstAid.message}</p>
                  )}
                </div>
              </label>

              {/* Equipment */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionEquipment')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Equipment Usage</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I give permission for my child to use sports equipment 
                    and other activity equipment under proper supervision and instruction.
                  </p>
                  {errors.permissionEquipment && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionEquipment.message}</p>
                  )}
                </div>
              </label>

              {/* Liability Waiver */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/50 transition-colors border border-gray-700 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  {...register('permissionAppWaiver')}
                  disabled={submitting}
                  className="w-5 h-5 mt-0.5 text-brand-primary focus:ring-brand-primary rounded disabled:opacity-50"
                />
                <div>
                  <span className="text-white font-medium">Liability Waiver & Terms</span>
                  <p className="text-gray-400 text-sm mt-1">
                    I understand that participation in physical activities carries inherent risks. 
                    I agree to release the camp organizers, staff, and volunteers from liability 
                    for any injury that may occur during normal camp activities, except in cases of negligence. 
                    I confirm all information provided is accurate and I agree to the camp terms and conditions.
                  </p>
                  {errors.permissionAppWaiver && (
                    <p className="text-red-400 text-sm mt-1">{errors.permissionAppWaiver.message}</p>
                  )}
                </div>
              </label>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 text-red-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Registration Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="sticky bottom-4 bg-brand-black/95 backdrop-blur p-4 -mx-4 rounded-lg border border-gray-700">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting Registration...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
            {spotsLeft <= 5 && spotsLeft > 0 && (
              <p className="text-yellow-400 text-xs text-center mt-2">
                Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left!
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
