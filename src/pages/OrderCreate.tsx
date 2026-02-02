import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../services/orderService'
import { getJobWorkItems } from '../services/jobWorkService'
import { getProducts } from '../services/productService'
import { getKarigars, Karigar } from '../services/karigarService'
import { MaterialType, JobWorkItem, Product } from '../types'
import { Trash2, Plus, Save, Info, Package } from 'lucide-react'

// Constants for unit options
const UNITS = ['KG', 'Piece', 'Jodi']

type FormValues = {
    customer_name: string
    order_date: string
    material_type: MaterialType
    items: {
        description: string
        quantity: number
        unit: string
        rate: number
        product_id?: string
        weight?: number
        wastage_percent?: number
        labour_cost?: number
        has_karigar?: boolean
        karigar_id?: string
        karigar_rate?: number
        karigar_quantity?: number
    }[]
    gst_enabled: boolean
}

export default function OrderCreate() {
    const navigate = useNavigate()
    const [submissionError, setSubmissionError] = useState('')
    const [jobWorkItems, setJobWorkItems] = useState<JobWorkItem[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loadingItems, setLoadingItems] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [karigars, setKarigars] = useState<Karigar[]>([])

    const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            order_date: new Date().toISOString().split('T')[0],
            material_type: undefined,
            gst_enabled: false,
            items: [{ description: '', quantity: 0, unit: 'KG', rate: 0 }]
        }
    })

    // Independent Data Fetching
    useEffect(() => {
        let mounted = true

        const loadData = async () => {
            setLoadingItems(true)
            setFetchError('')

            // 1. Fetch Job Work Items
            try {
                const jwData = await getJobWorkItems()
                if (mounted) setJobWorkItems(jwData)
            } catch (err: any) {
                console.error('Error fetching Job Work Items:', err)
                if (mounted) setFetchError(prev => prev + ` Job Work Error: ${err.message}`)
            }

            // 2. Fetch Products
            try {
                const prodData = await getProducts()
                if (mounted) setProducts(prodData)
            } catch (err: any) {
                console.error('Error fetching Products:', err)
                // Product fetch failure shouldn't block Job Work if possible, but let's notify
                if (mounted) setFetchError(prev => prev + ` Product Error: ${err.message}`)
            }

            // 3. Fetch Karigars
            try {
                const karigarData = await getKarigars()
                if (mounted) setKarigars(karigarData)
            } catch (err: any) {
                console.error('Error fetching Karigars:', err)
            }

            if (mounted) setLoadingItems(false)
        }

        loadData()

        return () => { mounted = false }
    }, [])

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: 'items'
    })

    const materialType = watch('material_type')
    const items = watch('items')
    const gstEnabled = watch('gst_enabled')

    const subtotal = items.reduce((sum, item) => {
        return sum + (Number(item.quantity || 0) * Number(item.rate || 0))
    }, 0)

    const gstRate = materialType === 'CLIENT' ? 5 : 3
    const gstAmount = gstEnabled ? (subtotal * gstRate) / 100 : 0
    const grandTotal = subtotal + gstAmount

    // Default GST logic
    useEffect(() => {
        if (materialType === 'CLIENT') {
            setValue('gst_enabled', false)
        } else if (materialType === 'OWN') {
            setValue('gst_enabled', true)
        }
    }, [materialType, setValue])

    // Handle Job Work Selection - Side Effects
    const handleJobWorkSelect = (index: number, itemName: string) => {
        // ID is handled by register
        const selectedItem = jobWorkItems.find(i => i.name === itemName)
        if (selectedItem) {
            setValue(`items.${index}.unit`, selectedItem.unit)
            setValue(`items.${index}.rate`, selectedItem.default_rate)
            setValue(`items.${index}.product_id`, undefined) // Clear product specific
        }
    }

    // Handle Product Selection - Side Effects
    const handleProductSelect = (index: number, productId: string) => {
        // ID is handled by register
        const selectedProduct = products.find(p => p.id === productId)

        if (selectedProduct) {
            setValue(`items.${index}.description`, selectedProduct.name)
            setValue(`items.${index}.unit`, 'Piece')
            setValue(`items.${index}.weight`, selectedProduct.default_weight)
            setValue(`items.${index}.wastage_percent`, selectedProduct.wastage_percent)
            setValue(`items.${index}.labour_cost`, selectedProduct.labour_cost)
            setValue(`items.${index}.rate`, selectedProduct.labour_cost)
        }
    }

    const onSubmit = async (data: FormValues) => {
        try {
            setSubmissionError('')

            if (data.material_type === 'OWN') {
                for (const item of data.items) {
                    if (item.product_id) {
                        const product = products.find(p => p.id === item.product_id)
                        if (product) {
                            const qty = Number(item.quantity);
                            const stock = Number(product.current_stock);
                            console.log(`Checking Stock: ${product.name} | Qty: ${qty} | Stock: ${stock}`);

                            if (qty > stock) {
                                alert(`Debug: Stock Check Failed!\nProduct: ${product.name}\nRequested: ${qty}\nAvailable: ${stock}`);
                                throw new Error(`Insufficient stock for "${product.name}". Available: ${stock}`);
                            }
                        }
                    }
                }
            }

            const cleanedItems = data.items.map(item => ({
                ...item,
                karigar_id: item.has_karigar ? item.karigar_id : undefined,
                karigar_rate: item.has_karigar ? item.karigar_rate : undefined,
                karigar_quantity: item.has_karigar ? item.karigar_quantity : undefined
            }))

            await createOrder({
                customer_name: data.customer_name,
                order_date: data.order_date,
                material_type: data.material_type
            }, cleanedItems, data.gst_enabled)
            navigate('/orders')
        } catch (err: any) {
            console.error(err)
            // Parse common DB errors
            let msg = err.message || 'Failed to create order'
            if (msg.includes('Insufficient stock')) {
                // Try to extract UUID and find Product Name for better message
                const match = msg.match(/Insufficient stock for product ([0-9a-f-]+)/)
                if (match && match[1]) {
                    const product = products.find(p => p.id === match[1])
                    if (product) {
                        msg = `Insufficient stock for "${product.name}". Requested qty exceeds available.`
                    }
                } else {
                    msg = "Insufficient stock for one of the selected products."
                }
            }
            setSubmissionError(msg)
        }
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Create New Order</h1>

            {/* Error / Loading States */}
            {loadingItems && <div style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Loading catalog...</div>}

            {fetchError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                    <strong>Catalog Load Error:</strong> {fetchError}
                    <br /><small>Please check your internet connection or database setup.</small>
                </div>
            )}

            {submissionError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                    {submissionError}
                </div>
            )}

            {/* Debug Info (visible if lists are empty but no error) */}
            {!loadingItems && jobWorkItems.length === 0 && products.length === 0 && !fetchError && (
                <div style={{ background: '#fffbeb', color: '#b45309', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    Warning: No Job Work Items or Products found in the database.
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Header Grid */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '1rem',
                }} className="form-grid">

                    <div className="grid-col-span-full">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Customer Name</label>
                        <input
                            {...register('customer_name', { required: 'Customer name is required' })}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="Enter customer name"
                        />
                        {errors.customer_name && <span style={{ color: 'red', fontSize: '0.875rem' }}>{errors.customer_name.message}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Material Type</label>
                        <select
                            {...register('material_type', { required: 'Material type is required' })}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            onChange={(e) => {
                                // Important: We must clear items when switching modes to prevent JobWork items from having hidden product_ids or vice-versa
                                register('material_type').onChange(e) // Call original handler
                                // Reset to a blank item compatible with both
                                replace([{ description: '', quantity: 0, unit: 'KG', rate: 0, weight: 0, wastage_percent: 0, labour_cost: 0, product_id: undefined }])
                            }}
                        >

                            <option value="">Select Type...</option>
                            <option value="CLIENT">Client Material (Job Work)</option>
                            <option value="OWN">Own Material (Product Sale)</option>
                        </select>
                        {errors.material_type && <span style={{ color: 'red', fontSize: '0.875rem' }}>{errors.material_type.message}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Order Date</label>
                        <input
                            type="date"
                            {...register('order_date', { required: 'Date is required' })}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '1.2rem', fontWeight: 500 }}>GST Bill Required?</label>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="true"
                                    checked={gstEnabled === true}
                                    onChange={() => setValue('gst_enabled', true)}
                                    style={{ width: 'auto' }}
                                />
                                YES ({gstRate}%)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="false"
                                    checked={gstEnabled === false}
                                    onChange={() => setValue('gst_enabled', false)}
                                    style={{ width: 'auto' }}
                                />
                                NO
                            </label>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Order Items
                        <span style={{ fontSize: '0.9em', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                            Subtotal: ₹{subtotal.toFixed(2)}
                        </span>
                    </h3>

                    {/* Contextual Help */}
                    {materialType === 'CLIENT' && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={16} />
                            <span>Job Work Mode: Select items from the list.</span>
                        </div>
                    )}

                    {materialType === 'OWN' && (
                        <div style={{ fontSize: '0.85rem', color: '#059669', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={16} />
                            <span>Product Mode: Select manufactured products. Stock deducted automatically.</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {fields.map((field, index) => (
                            <div key={field.id} style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="item-grid-mobile">


                                    {/* ITEM SELECTION LOGIC */}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Item / Description</label>

                                        {materialType === 'CLIENT' ? (
                                            <select
                                                {...register(`items.${index}.description` as const, { required: true })}
                                                onChange={(e) => {
                                                    register(`items.${index}.description` as const).onChange(e)
                                                    handleJobWorkSelect(index, e.target.value)
                                                }}
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            >
                                                <option value="">Select Job Work Item...</option>
                                                {jobWorkItems.map(item => (
                                                    <option key={item.id} value={item.name}>
                                                        {item.name} ({item.default_rate}/{item.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : materialType === 'OWN' ? (
                                            <select
                                                {...register(`items.${index}.product_id` as const, { required: true })}
                                                onChange={(e) => {
                                                    register(`items.${index}.product_id` as const).onChange(e)
                                                    handleProductSelect(index, e.target.value)
                                                }}
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            >
                                                <option value="">Select Product...</option>
                                                {products.length === 0 && <option value="" disabled>Loading products...</option>}
                                                {products.map(prod => (
                                                    <option key={prod.id} value={prod.id} disabled={prod.current_stock <= 0}>
                                                        {prod.name} - {prod.size} (Stock: {prod.current_stock})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                {...register(`items.${index}.description` as const, { required: true })}
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                                placeholder="Select Material Type first..."
                                                disabled={!materialType}
                                            />
                                        )}
                                    </div>

                                    {/* Extra Details for OWN Material */}
                                    {materialType === 'OWN' && items[index]?.product_id && (
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                                            <span>Weight: <b>{items[index]?.weight}g</b></span>
                                            <span>Wastage: <b>{items[index]?.wastage_percent}%</b></span>
                                            <span>Labour: <b>{items[index]?.labour_cost}</b></span>
                                        </div>
                                    )}

                                    {/* Qty / Unit / Rate */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Qty</label>
                                            <input
                                                type="number"
                                                step="any"
                                                {...register(`items.${index}.quantity` as const, { required: true, min: 0.01 })}
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ width: '80px' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Unit</label>
                                            <select
                                                {...register(`items.${index}.unit` as const)}
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                                disabled={materialType === 'OWN'}
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Rate</label>
                                            <input
                                                type="number"
                                                step="any"
                                                {...register(`items.${index}.rate` as const, { required: true, min: 0 })}
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ width: '100px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: '0.5rem', fontWeight: 600 }}>
                                            ₹{((watch(`items.${index}.quantity`) || 0) * (watch(`items.${index}.rate`) || 0)).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Karigar Assignment (Optional) */}
                                    <div style={{ gridColumn: '1 / -1', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }}>
                                            <input
                                                type="checkbox"
                                                {...register(`items.${index}.has_karigar` as const)}
                                                style={{ width: 'auto' }}
                                            />
                                            External Karigar involved?
                                        </label>

                                        {watch(`items.${index}.has_karigar`) && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.8rem', background: '#f0f9ff', padding: '1rem', borderRadius: '8px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>Select Karigar</label>
                                                    <select
                                                        {...register(`items.${index}.karigar_id` as const, { required: watch(`items.${index}.has_karigar`) })}
                                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem' }}
                                                        onChange={(e) => {
                                                            const k = karigars.find(kg => kg.id === e.target.value)
                                                            if (k) {
                                                                setValue(`items.${index}.karigar_rate`, k.default_rate)
                                                                setValue(`items.${index}.karigar_quantity`, watch(`items.${index}.quantity`) || 0)
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Select...</option>
                                                        {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>Karigar Rate</label>
                                                    <input
                                                        type="number"
                                                        {...register(`items.${index}.karigar_rate` as const, { required: watch(`items.${index}.has_karigar`) })}
                                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>Karigar Qty</label>
                                                    <input
                                                        type="number"
                                                        {...register(`items.${index}.karigar_quantity` as const, { required: watch(`items.${index}.has_karigar`) })}
                                                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {
                                    fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            style={{
                                                position: 'absolute',
                                                top: '0.5rem',
                                                right: '0.5rem',
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                padding: '0.25rem',
                                                borderRadius: '50%',
                                                width: '30px',
                                                height: '30px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )
                                }
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 0, unit: 'Piece', rate: 0 })}
                        style={{
                            marginTop: '1rem',
                            background: 'transparent',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary)',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>

                {/* Totals Section */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'right',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Subtotal: ₹{subtotal.toFixed(2)}
                    </div>
                    {gstEnabled && (
                        <div style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                            GST ({gstRate}%): ₹{gstAmount.toFixed(2)}
                        </div>
                    )}
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--color-primary)' }}>
                        Grand Total: ₹{grandTotal.toFixed(2)}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '1.1rem'
                    }}
                >
                    <Save size={20} />
                    {isSubmitting ? 'Saving Order...' : 'Create Order'}
                </button>

            </form >

            {/* Style for Form Grid on desktop */}
            < style > {`
        @media (min-width: 640px) {
            .form-grid {
                grid-template-columns: 1fr 1fr;
            }
            .grid-col-span-full {
                grid-column: 1 / -1;
            }
            .item-grid-mobile {
                display: grid !important;
                grid-template-columns: 2fr 1fr 1fr auto !important;
                gap: 1rem !important;
                align-items: end;
            }
        }
      `}</style >
        </div >
    )
}
