import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useParams, Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camp, PricingItem } from '../types'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { STRIPE_PUBLISHABLE_KEY } from '../config/stripe'

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

// Child schema
const childSchema = z.object({
  childFullName: z.string().min(2, 'Name is required'),
  childDob: z.string().min(1, 'Date of birth is required'),
  walkHomeAlone: z.enum(['yes', 'no'], { required_error: 'Required' }),
  hasMedicalConditions: z.enum(['yes', 'no'], { required_error: 'Required' }),
  medicalConditionsDetails: z.string().optional(),
  hasAdditionalNeeds: z.enum(['yes', 'no'], { required_error: 'Required' }),
  additionalNeedsDetails: z.string().optional(),
  hasAllergies: z.enum(['yes', 'no'], { required_error: 'Required' }),
  allergiesDetails: z.string().optional(),
  hasMedication: z.enum(['yes', 'no'], { required_error: 'Required' }),
  medicationDetails: z.string().optional(),
  hasFurtherInfo: z.enum(['yes', 'no'], { required_error: 'Required' }),
  furtherInfoDetails: z.string().optional(),
})

// Multi-child form schema
const multiChildFormSchema = z.object({
  email: z.string().email('Valid email required'),
  parentFullName: z.string().min(2, 'Parent name is required'),
  address: z.string().optional(),
  phone: z.string().min(10, 'Valid phone number required'),
  emergency1Name: z.string().min(2, 'Emergency contact required'),
  emergency1Phone: z.string().min(10, 'Valid phone required'),
  emergency1Relationship: z.string().min(1, 'Relationship required'),
  emergency2Name: z.string().optional(),
  emergency2Phone: z.string().optional(),
  emergency2Relationship: z.string().optional(),
  authorisedCollectors: z.string().optional(),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  permissionPhotos: z.boolean().refine(v => v, 'Required'),
  permissionHealth: z.boolean().refine(v => v, 'Required'),
  permissionActivities: z.boolean().refine(v => v, 'Required'),
  permissionLocations: z.boolean().refine(v => v, 'Required'),
  permissionMeals: z.boolean().refine(v => v, 'Required'),
  permissionBathroom: z.boolean().refine(v => v, 'Required'),
  permissionFirstAid: z.boolean().refine(v => v, 'Required'),
  permissionEquipment: z.boolean().refine(v => v, 'Required'),
  permissionAppWaiver: z.boolean().refine(v => v, 'Required'),
})

type MultiChildFormData = z.infer<typeof multiChildFormSchema>
type ChildFormData = z.infer<typeof childSchema>

const defaultChild: ChildFormData = {
  childFullName: '',
  childDob: '',
  walkHomeAlone: 'no',
  hasMedicalConditions: 'no',
  medicalConditionsDetails: '',
  hasAdditionalNeeds: 'no',
  additionalNeedsDetails: '',
  hasAllergies: 'no',
  allergiesDetails: '',
  hasMedication: 'no',
  medicationDetails: '',
  hasFurtherInfo: 'no',
  furtherInfoDetails: '',
}

export default function RegistrationFormEnhanced() {
  const { campId } = useParams<{ campId: string }>()
  const [camps, setCamps] = useState<Camp[]>([])
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null)
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [siblingDiscount, setSiblingDiscount] = useState(0)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [step, setStep] = useState<'form' | 'payment'>('form')

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MultiChildFormData>({
    resolver: zodResolver(multiChildFormSchema),
    defaultValues: {
      children: [defaultChild],
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  })

  // const watchedChildren = watch('children')

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
        
        if (campId) {
          const camp = activeCamps.find((c: Camp) => c.id === parseInt(campId))
          if (camp) setSelectedCamp(camp)
        }
        
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [campId])

  // Calculate total - pricing per child with sibling discount
  useEffect(() => {
    if (!selectedCamp) {
      setTotalAmount(0)
      setSiblingDiscount(0)
      return
    }

    const campPricingItems = pricingItems.filter(
      item => item.campId === selectedCamp.id || item.campId === null
    )

    let itemTotal = 0
    campPricingItems.forEach((item) => {
      if (selectedItems[item.id]) {
        itemTotal += item.amount
      }
    })

    // Multiply by number of children
    const numChildren = fields.length
    let total = itemTotal * numChildren
    
    // Calculate sibling discount for 2+ children
    let discount = 0
    if (numChildren >= 2 && selectedCamp.siblingDiscountEnabled) {
      const additionalChildren = numChildren - 1
      
      if (selectedCamp.siblingDiscountType === 'percentage') {
        discount = (itemTotal * (selectedCamp.siblingDiscountAmount / 100)) * additionalChildren
      } else {
        discount = selectedCamp.siblingDiscountAmount * additionalChildren
      }
    }
    
    setSiblingDiscount(discount)
    setTotalAmount(Math.max(total - discount, 0))
  }, [selectedCamp, selectedItems, pricingItems, fields.length])

  const onSubmitForm = async (data: MultiChildFormData) => {
    if (!selectedCamp) {
      alert('Please select a camp')
      return
    }

    // Check if enough spots available
    const spotsNeeded = data.children.length
    const spotsLeft = selectedCamp.maxSpots - selectedCamp.spotsTaken
    if (spotsNeeded > spotsLeft) {
      alert(`Only ${spotsLeft} spots available, but you're registering ${spotsNeeded} children.`)
      return
    }

    try {
      const paymentRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100),
          currency: 'aed',
          campId: selectedCamp.id,
          childrenCount: data.children.length,
        }),
      })

      const paymentData = await paymentRes.json()

      if (!paymentRes.ok) {
        throw new Error(paymentData.error || 'Failed to create payment')
      }

      setClientSecret(paymentData.clientSecret)
      
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
          Thank you for registering {fields.length} {fields.length === 1 ? 'child' : 'children'}! 
          A confirmation email has been sent.
        </p>
        <p className="text-gray-400 text-sm">
          Payment confirmation: AED {totalAmount.toFixed(2)} paid
        </p>
      </div>
    )
  }

  if (step === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm 
          totalAmount={totalAmount}
          childCount={fields.length}
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
          There are currently no camps available for registration.
        </p>
      </div>
    )
  }

  const campPricingItems = selectedCamp 
    ? pricingItems.filter(item => item.campId === selectedCamp.id || item.campId === null)
    : []

  return (
    <div className="max-w-3xl mx-auto">
      {/* Camp Selection */}
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

      {/* Camp Info Banner */}
      {campId && selectedCamp && (
        <div className="card mb-6 bg-brand-primary/10 border-brand-primary">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">{selectedCamp.name}</h2>
              <p className="text-gray-300 text-sm mb-2">{selectedCamp.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span>📅 {selectedCamp.startDate} - {selectedCamp.endDate}</span>
                <span>👥 Ages {selectedCamp.ageMin}-{selectedCamp.ageMax}</span>
                <span className="text-green-400">{selectedCamp.maxSpots - selectedCamp.spotsTaken} spots left</span>
              </div>
              {selectedCamp.siblingDiscountEnabled && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700 rounded-full text-sm text-green-400">
                  🎉 Sibling discount available: 
                  {selectedCamp.siblingDiscountType === 'percentage' 
                    ? ` ${selectedCamp.siblingDiscountAmount}% off`
                    : ` AED ${selectedCamp.siblingDiscountAmount} off`
                  } per additional child
                </div>
              )}
            </div>
            <Link to="/" className="text-brand-primary hover:underline text-sm whitespace-nowrap">
              ← View all camps
            </Link>
          </div>
        </div>
      )}

      {selectedCamp && (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          
          {/* Children Section */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-2xl font-bold text-white uppercase">
                Children ({fields.length})
              </h2>
              <button
                type="button"
                onClick={() => append(defaultChild)}
                className="btn-secondary text-sm"
              >
                + Add Another Child
              </button>
            </div>
            
            {fields.map((field, index) => (
              <ChildSection
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                watch={watch}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
          </div>

          {/* Parent/Guardian Information */}
          <div className="card space-y-4">
            <h3 className="font-heading text-xl font-bold text-white uppercase">Parent/Guardian</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number *</label>
                <input type="tel" {...register('phone')} className="input-field" />
                {errors.phone && <p className="error-message">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="label">Address</label>
                <input {...register('address')} className="input-field" />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="card space-y-4">
            <h3 className="font-heading text-xl font-bold text-white uppercase">Emergency Contacts</h3>
            
            <div className="p-4 bg-gray-800/50 rounded space-y-3">
              <p className="text-sm text-brand-primary font-medium">Emergency Contact 1 *</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <input {...register('emergency1Name')} className="input-field" placeholder="Name" />
                  {errors.emergency1Name && <p className="error-message">{errors.emergency1Name.message}</p>}
                </div>
                <div>
                  <input type="tel" {...register('emergency1Phone')} className="input-field" placeholder="Phone" />
                  {errors.emergency1Phone && <p className="error-message">{errors.emergency1Phone.message}</p>}
                </div>
                <div>
                  <input {...register('emergency1Relationship')} className="input-field" placeholder="Relationship" />
                  {errors.emergency1Relationship && <p className="error-message">{errors.emergency1Relationship.message}</p>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800/30 rounded space-y-3">
              <p className="text-sm text-gray-400 font-medium">Emergency Contact 2 (optional)</p>
              <div className="grid md:grid-cols-3 gap-3">
                <input {...register('emergency2Name')} className="input-field" placeholder="Name" />
                <input type="tel" {...register('emergency2Phone')} className="input-field" placeholder="Phone" />
                <input {...register('emergency2Relationship')} className="input-field" placeholder="Relationship" />
              </div>
            </div>

            <div>
              <label className="label">Authorised Collectors</label>
              <p className="text-gray-500 text-xs mb-2">People authorized to collect your child(ren)</p>
              <textarea {...register('authorisedCollectors')} className="input-field resize-none" rows={2} />
            </div>
          </div>

          {/* Pricing Items */}
          {campPricingItems.length > 0 && (
            <div className="card">
              <h3 className="font-heading text-xl font-bold text-white uppercase mb-4">
                Pricing Options
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Prices are per child × {fields.length} {fields.length === 1 ? 'child' : 'children'}
              </p>
              <div className="space-y-2">
                {campPricingItems.map((item) => (
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
                      {item.amount < 0 ? '-' : ''}AED {Math.abs(item.amount).toFixed(2)}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                {siblingDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      Subtotal ({fields.length} children):
                    </span>
                    <span className="text-gray-400">
                      AED {(totalAmount + siblingDiscount).toFixed(2)}
                    </span>
                  </div>
                )}
                {siblingDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400 flex items-center gap-2">
                      🎉 Sibling Discount ({fields.length - 1} {fields.length === 2 ? 'sibling' : 'siblings'}):
                    </span>
                    <span className="text-green-400 font-medium">
                      -AED {siblingDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-medium">
                    Total:
                  </span>
                  <span className="font-heading text-2xl font-bold text-brand-primary">
                    AED {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="card space-y-3">
            <h3 className="font-heading text-xl font-bold text-white uppercase mb-2">
              Permissions & Consent
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              These permissions apply to all registered children
            </p>
            
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionPhotos')} className="mt-1" />
              <span className="text-gray-300">I give permission for my child(ren) to be photographed/videoed *</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionHealth')} className="mt-1" />
              <span className="text-gray-300">I authorize staff to seek emergency medical treatment if required *</span>
            </label>
            {errors.permissionHealth && <p className="error-message">{errors.permissionHealth.message}</p>}

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionActivities')} className="mt-1" />
              <span className="text-gray-300">I give permission for my child(ren) to participate in all camp activities *</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionLocations')} className="mt-1" />
              <span className="text-gray-300">I give permission for my child(ren) to visit off-site locations with supervision *</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionMeals')} className="mt-1" />
              <span className="text-gray-300">I give permission for my child(ren) to have snacks and meals provided *</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionBathroom')} className="mt-1" />
              <span className="text-gray-300">I give permission for my child(ren) to use bathroom facilities independently *</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionFirstAid')} className="mt-1" />
              <span className="text-gray-300">I give permission for first aid to be administered if needed *</span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" {...register('permissionEquipment')} className="mt-1" />
              <span className="text-gray-300">I give permission for my child(ren) to use sports equipment and facilities *</span>
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
            {isSubmitting ? 'Processing...' : `Proceed to Payment - AED ${totalAmount.toFixed(2)}`}
          </button>
        </form>
      )}
    </div>
  )
}

// Child Section Component
function ChildSection({
  index,
  register,
  errors,
  watch,
  onRemove,
  canRemove,
}: {
  index: number
  register: any
  errors: any
  watch: any
  onRemove: () => void
  canRemove: boolean
}) {
  const hasMedical = watch(`children.${index}.hasMedicalConditions`)
  const hasNeeds = watch(`children.${index}.hasAdditionalNeeds`)
  const hasAllergies = watch(`children.${index}.hasAllergies`)
  const hasMedication = watch(`children.${index}.hasMedication`)
  const hasFurtherInfo = watch(`children.${index}.hasFurtherInfo`)

  return (
    <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-heading text-lg text-brand-primary">
          Child {index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register(`children.${index}.childFullName`)} className="input-field" />
            {errors.children?.[index]?.childFullName && (
              <p className="error-message">{errors.children[index].childFullName.message}</p>
            )}
          </div>
          <div>
            <label className="label">Date of Birth *</label>
            <input type="date" {...register(`children.${index}.childDob`)} className="input-field" />
            {errors.children?.[index]?.childDob && (
              <p className="error-message">{errors.children[index].childDob.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">Can walk home alone? *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.walkHomeAlone`)} value="yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.walkHomeAlone`)} value="no" />
              No
            </label>
          </div>
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="label">Any medical conditions? *</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasMedicalConditions`)} value="yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasMedicalConditions`)} value="no" />
              No
            </label>
          </div>
          {hasMedical === 'yes' && (
            <textarea
              {...register(`children.${index}.medicalConditionsDetails`)}
              className="input-field resize-none"
              rows={2}
              placeholder="Please provide details..."
            />
          )}
        </div>

        {/* Additional Needs */}
        <div>
          <label className="label">Any additional needs? *</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasAdditionalNeeds`)} value="yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasAdditionalNeeds`)} value="no" />
              No
            </label>
          </div>
          {hasNeeds === 'yes' && (
            <textarea
              {...register(`children.${index}.additionalNeedsDetails`)}
              className="input-field resize-none"
              rows={2}
              placeholder="Please provide details..."
            />
          )}
        </div>

        {/* Allergies */}
        <div>
          <label className="label">Any allergies? *</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasAllergies`)} value="yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasAllergies`)} value="no" />
              No
            </label>
          </div>
          {hasAllergies === 'yes' && (
            <textarea
              {...register(`children.${index}.allergiesDetails`)}
              className="input-field resize-none"
              rows={2}
              placeholder="Please provide details..."
            />
          )}
        </div>

        {/* Medication */}
        <div>
          <label className="label">Taking any medication? *</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasMedication`)} value="yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasMedication`)} value="no" />
              No
            </label>
          </div>
          {hasMedication === 'yes' && (
            <textarea
              {...register(`children.${index}.medicationDetails`)}
              className="input-field resize-none"
              rows={2}
              placeholder="Please provide details..."
            />
          )}
        </div>

        {/* Further Information */}
        <div>
          <label className="label">Any further information? *</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasFurtherInfo`)} value="yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="radio" {...register(`children.${index}.hasFurtherInfo`)} value="no" />
              No
            </label>
          </div>
          {hasFurtherInfo === 'yes' && (
            <textarea
              {...register(`children.${index}.furtherInfoDetails`)}
              className="input-field resize-none"
              rows={2}
              placeholder="Please provide details..."
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Payment Form Component
function PaymentForm({ 
  totalAmount, 
  childCount,
  onSuccess, 
  onBack 
}: { 
  totalAmount: number
  childCount: number
  onSuccess: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

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

      // Payment succeeded - submit registration
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
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Registering:</span>
          <span className="text-white">{childCount} {childCount === 1 ? 'child' : 'children'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Amount:</span>
          <span className="text-2xl font-bold text-brand-primary">AED {totalAmount.toFixed(2)}</span>
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
          {processing ? 'Processing...' : `Pay AED ${totalAmount.toFixed(2)}`}
        </button>
      </form>

      <p className="text-gray-400 text-xs text-center mt-4">
        Payments are securely processed by Stripe
      </p>
    </div>
  )
}
