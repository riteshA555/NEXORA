import React, { useState, useEffect } from 'react'
import { Plus, Package, Sparkles, Database, TrendingUp, Search } from 'lucide-react'
import { getStockSummary, getFinishedGoodsInventory, addStockTransaction, getStockTransactions } from '../services/inventoryService'
import { getLatestRate } from '../services/rateService'
import { StockSummary, Product, StockType, StockItemType, StockTransaction } from '../types'

export default function StockManagement() {
    const [summary, setSummary] = useState<StockSummary>({
        raw_silver: 0,
        wastage: 0,
        finished_goods_count: 0,
        finished_goods_weight: 0,
        total_value: 0
    })
    const [finishedGoods, setFinishedGoods] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<StockTransaction[]>([])
    const [activeTab, setActiveTab] = useState<'RAW' | 'WASTAGE' | 'FINISHED'>('FINISHED')
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)

    // Form State
    const [form, setForm] = useState({
        type: 'RAW_IN' as StockType,
        item_type: 'RAW_SILVER' as StockItemType,
        quantity: '',
        weight_gm: '',
        product_id: '',
        source: '',
        rate_at_time: '',
        wastage_percent: '',
        note: ''
    })

    const loadData = async () => {
        try {
            setLoading(true)
            const rate = await getLatestRate()
            const silverRate = rate ? (rate.rate_1g * 1000) : 75000 // Use 1kg rate as baseline

            const [stockSummary, fgInventory, recentTransactions] = await Promise.all([
                getStockSummary(silverRate),
                getFinishedGoodsInventory(),
                getStockTransactions()
            ])

            setSummary(stockSummary)
            setFinishedGoods(fgInventory)
            setTransactions(recentTransactions)
        } catch (err) {
            console.error('Failed to load stock info', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await addStockTransaction({
                date: new Date().toISOString(),
                type: form.type,
                item_type: form.item_type,
                quantity: Number(form.quantity),
                weight_gm: form.weight_gm ? Number(form.weight_gm) : undefined,
                product_id: form.product_id || undefined,
                note: form.note,
                source: form.source || undefined,
                rate_at_time: form.rate_at_time ? Number(form.rate_at_time) : undefined,
                wastage_percent: form.wastage_percent ? Number(form.wastage_percent) : undefined
            })
            setShowModal(false)
            setForm({ type: 'RAW_IN', item_type: 'RAW_SILVER', quantity: '', weight_gm: '', product_id: '', source: '', rate_at_time: '', wastage_percent: '', note: '' })
            loadData()
        } catch (err) {
            alert('Stock update fail ho gaya bhai!')
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Stock data load ho raha hai...</div>

    const filteredFG = finishedGoods.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Stock Management</h1>
                    <p style={{ margin: '0.2rem 0 0', color: '#64748b' }}>
                        Track raw silver, wastage & finished goods / स्टॉक प्रबंधन
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{ ...primaryBtnStyle, background: '#1e293b', color: 'white' }}
                >
                    <Plus size={18} /> Add Stock Entry
                </button>
            </div>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <SummaryCard
                    title="Raw Silver Stock"
                    value={`${(summary.raw_silver / 1000).toFixed(2)} kg`}
                    subTitle={`Value: ₹${(summary.total_value * (summary.raw_silver / (summary.raw_silver + summary.wastage + summary.finished_goods_weight || 1))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<Database size={24} color="#3b82f6" />}
                />
                <SummaryCard
                    title="Wastage (Silver Accrued)"
                    value={`${(summary.wastage / 1000).toFixed(2)} kg`}
                    subTitle={`Value: ₹${(summary.total_value * (summary.wastage / (summary.raw_silver + summary.wastage + summary.finished_goods_weight || 1))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    icon={<Sparkles size={24} color="#f59e0b" />}
                />
                <SummaryCard
                    title="Finished Goods"
                    value={`${summary.finished_goods_count} pcs`}
                    subTitle={`Silver Weight: ${(summary.finished_goods_weight / 1000).toFixed(2)} kg`}
                    icon={<Package size={24} color="#10b981" />}
                />
                <SummaryCard
                    title="Total Stock Value"
                    value={`₹${(summary.total_value / 100000).toFixed(1)}L`}
                    subTitle="At current rate"
                    icon={<TrendingUp size={24} color="#6366f1" />}
                    trend="+2.4%"
                />
            </div>

            {/* Main Tabs Container */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                    <TabButton active={activeTab === 'RAW'} onClick={() => setActiveTab('RAW')} icon={<Database size={16} />} label="Raw Silver" />
                    <TabButton active={activeTab === 'WASTAGE'} onClick={() => setActiveTab('WASTAGE')} icon={<Sparkles size={16} />} label="Wastage Silver" />
                    <TabButton active={activeTab === 'FINISHED'} onClick={() => setActiveTab('FINISHED')} icon={<Package size={16} />} label="Finished Goods" />
                </div>

                {activeTab === 'FINISHED' && (
                    <div style={{ padding: '0 0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Finished Goods Inventory</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>तैयार माल का स्टॉक</p>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={searchInputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={thStyle}>Product ID</th>
                                        <th style={thStyle}>Product Name</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Quantity</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Avg Weight</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Total Silver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFG.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={tdStyle}>{p.id.slice(0, 8).toUpperCase()}</td>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.category}</div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{p.current_stock} pcs</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>{p.default_weight}g</td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                                                {(p.current_stock * p.default_weight).toFixed(0)}g
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'RAW' && (
                    <div style={{ padding: '0 0.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Raw Silver Movements</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>कच्ची चांदी की आवाजाही</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Type</th>
                                        <th style={thStyle}>Source</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Weight (g)</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions
                                        .filter(t => t.item_type === 'RAW_SILVER')
                                        .map(t => {
                                            const isIngoing = t.type === 'RAW_IN';
                                            const value = (t.quantity || 0) * (t.rate_at_time || 0);
                                            return (
                                                <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td style={tdStyle}>{new Date(t.date).toLocaleDateString()}</td>
                                                    <td style={tdStyle}>
                                                        {getStatusBadge(t.type)}
                                                    </td>
                                                    <td style={{ ...tdStyle, color: '#475569' }}>{t.source || 'Local'}</td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                                                        {isIngoing ? '+' : '-'}{t.quantity.toLocaleString()}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b' }}>
                                                        {t.rate_at_time ? `₹${t.rate_at_time.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: isIngoing ? '#059669' : '#e11d48' }}>
                                                        {value > 0 ? `${isIngoing ? '+' : '-'}₹${value.toLocaleString()}` : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'WASTAGE' && (
                    <div style={{ padding: '0 0.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Wastage Silver Accumulation</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>वेस्टेज चांदी का संग्रह</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Source Order</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Wastage %</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Weight (g)</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions
                                        .filter(t => t.item_type === 'WASTAGE')
                                        .map(t => {
                                            const value = (t.quantity || 0) * (t.rate_at_time || 0);
                                            return (
                                                <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td style={tdStyle}>{new Date(t.date).toLocaleDateString()}</td>
                                                    <td style={{ ...tdStyle, fontWeight: 500, color: '#1e293b' }}>
                                                        {t.source || 'Direct Entry'}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b' }}>
                                                        {t.wastage_percent ? `${t.wastage_percent}%` : '-'}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                                                        +{t.quantity}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b' }}>
                                                        {t.rate_at_time ? `₹${t.rate_at_time.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                                        {value > 0 ? `+₹${value.toLocaleString()}` : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Stock Modal */}
            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                            Add Stock Entry / नया स्टॉक एंट्री
                        </h2>
                        <form onSubmit={handleAddEntry}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Item Type / सामान का प्रकार</label>
                                    <select
                                        value={form.item_type}
                                        onChange={(e) => setForm({ ...form, item_type: e.target.value as StockItemType })}
                                        style={inputStyle}
                                    >
                                        <option value="RAW_SILVER">Raw Silver (कच्ची चांदी)</option>
                                        <option value="FINISHED_GOODS">Finished Goods (तैयार माल)</option>
                                        <option value="WASTAGE">Wastage Silver (वेस्टेज)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Transaction / लेनदेन</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value as StockType })}
                                        style={inputStyle}
                                    >
                                        <option value="RAW_IN">Inflow (Stock Aana)</option>
                                        <option value="RAW_OUT">Outflow (Stock Jaana)</option>
                                        <option value="PRODUCTION">Production (Taiyari)</option>
                                        <option value="WASTAGE">Wastage (Nuksaan/Accumulation)</option>
                                        <option value="ADJUSTMENT">Adjustment (Theek Karna)</option>
                                    </select>
                                </div>
                            </div>

                            {form.item_type === 'FINISHED_GOODS' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle}>Select Product / प्रोडक्ट चुनें</label>
                                    <select
                                        value={form.product_id}
                                        onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                                        style={inputStyle}
                                        required
                                    >
                                        <option value="">Choose item...</option>
                                        {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div style={{ padding: '1.75rem', background: '#f8fafc', borderRadius: '24px', marginBottom: '2rem', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={labelStyle}>Source / Order No.</label>
                                        <input
                                            type="text"
                                            value={form.source}
                                            onChange={(e) => setForm({ ...form, source: e.target.value })}
                                            placeholder="e.g. MCX, Local, Order ID"
                                            style={inputStyle}
                                        />
                                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>maal kahan se aaya/gaya</p>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Market Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={form.rate_at_time}
                                            onChange={(e) => setForm({ ...form, rate_at_time: e.target.value })}
                                            placeholder="Live rate (Optional)"
                                            style={inputStyle}
                                        />
                                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>1kg chandi ka rate</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={labelStyle}>
                                            {form.item_type === 'FINISHED_GOODS' ? 'Pieces (Nag) / नग' : 'Weight (Gram) / वजन'}
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.quantity}
                                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                            placeholder={form.item_type === 'FINISHED_GOODS' ? '0' : '0.00'}
                                            style={inputStyle}
                                            required
                                        />
                                    </div>

                                    {/* Show second column only if Finished Goods or Wastage */}
                                    {form.item_type === 'FINISHED_GOODS' && (
                                        <div>
                                            <label style={labelStyle}>Total Vajan (Gram) / कुल वजन</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={form.weight_gm}
                                                onChange={(e) => setForm({ ...form, weight_gm: e.target.value })}
                                                placeholder="Kul vajan gm mein"
                                                style={inputStyle}
                                                required
                                            />
                                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>Sab pieces ka milakar kul vajan</p>
                                        </div>
                                    )}

                                    {form.item_type === 'WASTAGE' && (
                                        <div>
                                            <label style={labelStyle}>Wastage % (वेस्टेज)</label>
                                            <input
                                                type="number"
                                                value={form.wastage_percent}
                                                onChange={(e) => setForm({ ...form, wastage_percent: e.target.value })}
                                                placeholder="e.g. 4%"
                                                style={inputStyle}
                                            />
                                            <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Kitna % wastage hua</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={labelStyle}>Note / जरुरी जानकारी</label>
                                <textarea
                                    value={form.note}
                                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '60px' }}
                                    placeholder="Kuch extra likhna ho toh..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', padding: '0 0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ ...secondaryBtnStyle, flex: 1, padding: '1.1rem', color: '#1e293b', border: '2px solid #cbd5e1', background: '#f8fafc' }}
                                >
                                    Band Karein / Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ ...primaryBtnStyle, flex: 1, background: '#1e293b', color: 'white', padding: '1.1rem', fontWeight: 700 }}
                                >
                                    Save Transaction / सुरक्षित करें
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// Visual Helpers
const SummaryCard = ({ title, value, subTitle, icon, trend }: any) => (
    <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={iconContainerStyle}>{icon}</div>
            {trend && <div style={trendStyle}>{trend}</div>}
        </div>
        <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>{title}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{subTitle}</div>
        </div>
    </div>
)

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        style={{
            ...tabBtnStyle,
            color: active ? '#1e293b' : '#94a3b8',
            borderBottom: active ? '3px solid #1e293b' : '3px solid transparent'
        }}
    >
        {icon} {label}
    </button>
)

// Styles
const cardStyle: React.CSSProperties = {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)'
}

const iconContainerStyle: React.CSSProperties = {
    padding: '0.75rem',
    background: '#f8fafc',
    borderRadius: '12px'
}

const trendStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#10b981',
    background: '#ecfdf5',
    padding: '4px 8px',
    borderRadius: '20px'
}

const tabBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '1rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    transition: 'all 0.2s'
}

const searchInputStyle: React.CSSProperties = {
    padding: '0.6rem 1rem 0.6rem 2.5rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    width: '280px',
    outline: 'none'
}

const thStyle: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.7rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700
}

const tdStyle: React.CSSProperties = {
    padding: '1.2rem 1rem',
    fontSize: '0.9rem',
    color: '#475569'
}

const primaryBtnStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
}

const secondaryBtnStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    background: 'white',
    fontWeight: 700,
    cursor: 'pointer'
}

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
}

const modalContentStyle: React.CSSProperties = {
    background: 'white',
    padding: '2rem',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '650px',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto'
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '0.5rem'
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '0.95rem'
}

const getStatusBadge = (type: StockType) => {
    let label = type.replace('_', ' ');
    let bg = '#f1f5f9', color = '#475569', border = '#e2e8f0';

    if (type === 'RAW_IN') { label = '+ Purchase'; bg = '#ecfdf5'; color = '#059669'; border = '#10b98144'; }
    if (type === 'RAW_OUT') { label = '- Used'; bg = '#fff1f2'; color = '#e11d48'; border = '#f43f5e44'; }
    if (type === 'PRODUCTION') { label = 'Production'; bg = '#eff6ff'; color = '#2563eb'; border = '#3b82f644'; }
    if (type === 'ORDER_DEDUCTION') { label = 'Order Sale'; bg = '#fef2f2'; color = '#991b1b'; border = '#b91c1c44'; }

    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            background: bg,
            color: color,
            fontSize: '0.72rem',
            fontWeight: 700,
            border: `1px solid ${border}`,
            textTransform: 'uppercase'
        }}>
            {label}
        </span>
    );
};
