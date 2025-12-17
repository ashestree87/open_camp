import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { registrationSchema, type RegistrationFormData } from '../schemas/registration'
import { Camp, PricingItem } from '../types'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { STRIPE_PUBLISHABLE_KEY } from '../config/stripe'

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

export default function RegistrationFormEnhanced() {
  const { campId } = useParams<{ campId: string }>()
  const [camps, setCamps] = useState<Camp[]>([])
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null)
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [step, setStep] = useState<'form' | 'payment'>('form')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  })

  // Load camps and pricing
  useEffect(() => {
    Promise.all([
      fetch('/api/camps').then(r => r.json()),
      fetch('/api/pricing').then(r => r.json()),
    ])
      .then(([campsData, pricingData]) => {
        const activeCamps = campsData.camps?.filter((c: Camp) => c.status === 'active') || []
        setCamps(activeCamps)
        setPricingItems(pricingData.items || [])
        
        // If campId is in URL, auto-select that camp
        if (campId) {
          const camp = activeCamps.find((c: Camp) => c.id === parseInt(campId))
          if (camp) {
            setSelectedCamp(camp)
          }
        }
        
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [campId])

  // Calculate total
  useEffect(() => {
    if (!selectedCamp) {
      setTotalAmount(0)
      return
    }

    let total = 0
    pricingItems.forEach((item) => {
      if (selectedItems[item.id]) {
        total += item.amount
      }
    })
    setTotalAmount(Math.max(total, 0))
  }, [selectedCamp, selectedItems, pricingItems])

  const onSubmitForm = async (data: RegistrationFormData) => {
    if (!selectedCamp) {
      alert('Please select a camp')
      return
    }

    try {
      // Create payment intent first
      const paymentRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'gbp',
          campId: selectedCamp.id,
        }),
      })

      const paymentData = await paymentRes.json()

      if (!paymentRes.ok) {
        throw new Error(paymentData.error || 'Failed to create payment')
      }

      setClientSecret(paymentData.clientSecret)
      
      // Store form data for later
      sessionStorage.setItem('registration_form_data', JSON.stringify({
        ...data,
        campId: selectedCamp.id,
        selectedItems: Object.keys(selectedItems).filter(k => selectedItems[parseInt(k)]).map(k => parseInt(k)),
        totalAmount,
      }))

      setStep('payment')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process registration')
    }
  }

  // Watch conditional fields
  const hasMedicalConditions = watch('hasMedicalConditions')
  const hasAdditionalNeeds = watch('hasAdditionalNeeds')
  const hasAllergies = watch('hasAllergies')
  const hasMedication = watch('hasMedication')
  const hasFurtherInfo = watch('hasFurtherInfo')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-xl">Loading camps...</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-heading text-3xl font-bold text-white uppercase mb-4">
          Registration Complete!
        </h2>
        <p className="text-gray-300 mb-4">
          Thank you for registering! A confirmation email has been sent to your email address.
        </p>
        <p className="text-gray-400 text-sm">
          Payment confirmation: £{totalAmount.toFixed(2)} paid
        </p>
      </div>
    )
  }

  if (step === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm 
          totalAmount={totalAmount}
          onSuccess={() => setSubmitted(true)}
          onBack={() => setStep('form')}
        />
      </Elements>
    )
  }

  if (camps.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <h2 className="font-heading text-2xl font-bold text-white uppercase mb-4">
          No Active Camps
        </h2>
        <p className="text-gray-400">
          There are currently no camps available for registration. Please check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Camp Selection - only show if no campId in URL */}
      {!campId && (
        <div className="card mb-6">
          <h2 className="font-heading text-2xl font-bold text-white uppercase mb-4">
            Select a Camp
          </h2>
          <div className="space-y-3">
            {camps.map((camp) => {
              const spotsLeft = camp.maxSpots - camp.spotsTaken
              const isFull = spotsLeft <= 0

              return (
                <Link
                  key={camp.id}
                  to={`/camp/${camp.id}`}
                  className={`block w-full text-left p-4 rounded border-2 transition-all ${
                    isFull
                      ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed pointer-events-none'
                      : 'border-gray-700 hover:border-brand-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading text-lg font-bold text-white">{camp.name}</h3>
                    {isFull ? (
                      <span className="text-red-400 text-sm font-bold">SOLD OUT</span>
                    ) : (
                      <span className="text-green-400 text-sm">{spotsLeft} spots left</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{camp.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>📅 {camp.startDate} - {camp.endDate}</span>
                    <span>👥 Ages {camp.ageMin}-{camp.ageMax}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Show camp info banner when viewing specific camp */}
      {campId && selectedCamp && (
        <div className="card mb-6 bg-brand-primary/10 border-brand-primary">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">{selectedCamp.name}</h2>
              <p className="text-gray-300 text-sm mb-2">{selectedCamp.description}</p>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>📅 {selectedCamp.startDate} - {selectedCamp.endDate}</span>
                <span>👥 Ages {selectedCamp.ageMin}-{selectedCamp.ageMax}</span>
                <span className="text-green-400">{selectedCamp.maxSpots - selectedCamp.spotsTaken} spots left</span>
              </div>
            </div>
            <Link to="/" className="text-brand-primary hover:underline text-sm whitespace-nowrap">
              ← View all camps
            </Link>
          </div>
        </div>
      )}

      {selectedCamp && (
        <>
          {/* Pricing Items */}
          {pricingItems.length > 0 && (
            <div className="card mb-6">
              <h3 className="font-heading text-xl font-bold text-white uppercase mb-3">
                Additional Options
              </h3>
              <div className="space-y-2">
                {pricingItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded border border-gray-700 hover:border-brand-primary/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedItems[item.id]}
                      onChange={(e) =>
                        setSelectedItems({ ...selectedItems, [item.id]: e.target.checked })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-gray-400">{item.description}</div>
                    </div>
                    <div className={`font-bold ${item.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                      {item.amount < 0 ? '-' : '+'}£{Math.abs(item.amount).toFixed(2)}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <span className="font-heading text-lg uppercase text-gray-400">Total:</span>
                <span className="font-heading text-2xl font-bold text-brand-primary">
                  £{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmitForm)} className="card space-y-6">
            <h2 className="font-heading text-2xl font-bold text-white uppercase">
              Registration Details
            </h2>

            {/* Child Information */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase">Child Information</h3>
              
              <div>
                <label className="label">Child's Full Name *</label>
                <input {...register('childFullName')} className="input-field" />
                {errors.childFullName && (
                  <p className="error-message">{errors.childFullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Child's Age *</label>
                  <input {...register('childAge')} className="input-field" />
                  {errors.childAge && <p className="error-message">{errors.childAge.message}</p>}
                </div>
                <div>
                  <label className="label">Child's Date of Birth *</label>
                  <input type="date" {...register('childDob')} className="input-field" />
                  {errors.childDob && <p className="error-message">{errors.childDob.message}</p>}
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase">Parent/Guardian Information</h3>
              
              <div>
                <label className="label">Parent's Full Name *</label>
                <input {...register('parentFullName')} className="input-field" />
                {errors.parentFullName && <p className="error-message">{errors.parentFullName.message}</p>}
              </div>

              <div>
                <label className="label">Email *</label>
                <input type="email" {...register('email')} className="input-field" />
                {errors.email && <p className="error-message">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input type="tel" {...register('phone')} className="input-field" />
                {errors.phone && <p className="error-message">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="label">Address</label>
                <textarea {...register('address')} className="input-field resize-none" rows={3} />
                {errors.address && <p className="error-message">{errors.address.message}</p>}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase">Emergency Contacts</h3>
              
              <div className="grid gap-4">
                <div>
                  <label className="label">Emergency Contact 1 - Name *</label>
                  <input {...register('emergency1Name')} className="input-field" />
                  {errors.emergency1Name && <p className="error-message">{errors.emergency1Name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone *</label>
                    <input type="tel" {...register('emergency1Phone')} className="input-field" />
                    {errors.emergency1Phone && <p className="error-message">{errors.emergency1Phone.message}</p>}
                  </div>
                  <div>
                    <label className="label">Relationship *</label>
                    <input {...register('emergency1Relationship')} className="input-field" />
                    {errors.emergency1Relationship && <p className="error-message">{errors.emergency1Relationship.message}</p>}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="label">Emergency Contact 2 - Name</label>
                  <input {...register('emergency2Name')} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input type="tel" {...register('emergency2Phone')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Relationship</label>
                    <input {...register('emergency2Relationship')} className="input-field" />
                  </div>
                </div>
              </div>
            </div>

            {/* Authorized Collectors */}
            <div>
              <label className="label">Authorised Collectors</label>
              <p className="text-gray-400 text-sm mb-2">
                List all people authorized to collect your child (one per line)
              </p>
              <textarea {...register('authorisedCollectors')} className="input-field resize-none" rows={3} />
            </div>

            {/* Walk Home Alone */}
            <div>
              <label className="label">Can child walk home alone? *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-white">
                  <input type="radio" {...register('walkHomeAlone')} value="yes" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-white">
                  <input type="radio" {...register('walkHomeAlone')} value="no" />
                  No
                </label>
              </div>
              {errors.walkHomeAlone && <p className="error-message">{errors.walkHomeAlone.message}</p>}
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-brand-primary uppercase">Medical Information</h3>
              
              {/* Medical Conditions */}
              <div>
                <label className="label">Does your child have any medical conditions? *</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasMedicalConditions')} value="yes" />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasMedicalConditions')} value="no" />
                    No
                  </label>
                </div>
                {hasMedicalConditions === 'yes' && (
                  <>
                    <textarea {...register('medicalConditionsDetails')} className="input-field resize-none" rows={2} placeholder="Please provide details..." />
                    {errors.medicalConditionsDetails && <p className="error-message">{errors.medicalConditionsDetails.message}</p>}
                  </>
                )}
              </div>

              {/* Additional Needs */}
              <div>
                <label className="label">Does your child have any additional needs? *</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasAdditionalNeeds')} value="yes" />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasAdditionalNeeds')} value="no" />
                    No
                  </label>
                </div>
                {hasAdditionalNeeds === 'yes' && (
                  <>
                    <textarea {...register('additionalNeedsDetails')} className="input-field resize-none" rows={2} placeholder="Please provide details..." />
                    {errors.additionalNeedsDetails && <p className="error-message">{errors.additionalNeedsDetails.message}</p>}
                  </>
                )}
              </div>

              {/* Allergies */}
              <div>
                <label className="label">Does your child have any allergies? *</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasAllergies')} value="yes" />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasAllergies')} value="no" />
                    No
                  </label>
                </div>
                {hasAllergies === 'yes' && (
                  <>
                    <textarea {...register('allergiesDetails')} className="input-field resize-none" rows={2} placeholder="Please provide details..." />
                    {errors.allergiesDetails && <p className="error-message">{errors.allergiesDetails.message}</p>}
                  </>
                )}
              </div>

              {/* Medication */}
              <div>
                <label className="label">Is your child taking any medication? *</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasMedication')} value="yes" />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasMedication')} value="no" />
                    No
                  </label>
                </div>
                {hasMedication === 'yes' && (
                  <>
                    <textarea {...register('medicationDetails')} className="input-field resize-none" rows={2} placeholder="Please provide details..." />
                    {errors.medicationDetails && <p className="error-message">{errors.medicationDetails.message}</p>}
                  </>
                )}
              </div>

              {/* Further Information */}
              <div>
                <label className="label">Any further information we should know? *</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasFurtherInfo')} value="yes" />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" {...register('hasFurtherInfo')} value="no" />
                    No
                  </label>
                </div>
                {hasFurtherInfo === 'yes' && (
                  <>
                    <textarea {...register('furtherInfoDetails')} className="input-field resize-none" rows={2} placeholder="Please provide details..." />
                    {errors.furtherInfoDetails && <p className="error-message">{errors.furtherInfoDetails.message}</p>}
                  </>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <h3 className="font-heading text-lg text-brand-primary uppercase">Permissions & Consent</h3>
              
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionPhotos')} className="mt-1" />
                <span className="text-gray-300">I give permission for my child to be photographed/videoed during activities *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionHealth')} className="mt-1" />
                <span className="text-gray-300">I authorize staff to seek emergency medical treatment if required *</span>
              </label>
              {errors.permissionHealth && <p className="error-message">{errors.permissionHealth.message}</p>}

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionActivities')} className="mt-1" />
                <span className="text-gray-300">I give permission for my child to participate in all camp activities *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionLocations')} className="mt-1" />
                <span className="text-gray-300">I give permission for my child to visit off-site locations with supervision *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionMeals')} className="mt-1" />
                <span className="text-gray-300">I give permission for my child to have snacks and meals provided *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionBathroom')} className="mt-1" />
                <span className="text-gray-300">I give permission for my child to use bathroom facilities independently *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionFirstAid')} className="mt-1" />
                <span className="text-gray-300">I give permission for first aid to be administered if needed *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionEquipment')} className="mt-1" />
                <span className="text-gray-300">I give permission for my child to use sports equipment and facilities *</span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" {...register('permissionAppWaiver')} className="mt-1" />
                <span className="text-gray-300">I acknowledge and accept the camp terms and conditions *</span>
              </label>
              {errors.permissionAppWaiver && <p className="error-message">{errors.permissionAppWaiver.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg"
            >
              {isSubmitting ? 'Processing...' : `Proceed to Payment - £${totalAmount.toFixed(2)}`}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// Payment Form Component
function PaymentForm({ 
  totalAmount, 
  onSuccess, 
  onBack 
}: { 
  totalAmount: number
  onSuccess: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      // Payment succeeded - now submit registration
      const formData = JSON.parse(sessionStorage.getItem('registration_form_data') || '{}')
      
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentStatus: 'paid',
        }),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      sessionStorage.removeItem('registration_form_data')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
      setProcessing(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={onBack} className="text-brand-primary hover:underline text-sm">
          ← Back to form
        </button>
      </div>

      <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6">
        Complete Payment
      </h2>

      <div className="bg-gray-800/50 p-4 rounded mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Amount:</span>
          <span className="text-2xl font-bold text-brand-primary">£{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handlePaymentSubmit}>
        <div className="mb-6">
          <PaymentElement />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded p-3 mb-4 text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn-primary w-full py-4 text-lg"
        >
          {processing ? 'Processing...' : `Pay £${totalAmount.toFixed(2)}`}
        </button>
      </form>

      <p className="text-gray-400 text-xs text-center mt-4">
        Payments are securely processed by Stripe
      </p>
    </div>
  )
}
