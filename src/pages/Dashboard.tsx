import { useState, useEffect } from 'react'
import { getLatestRate, SilverRate } from '../services/rateService'
import { getMetalInventory, getFinishedGoodsWeight, MetalInventory } from '../services/inventoryService'
import { getOrders } from '../services/orderService'
import { Scale, TrendingUp, Wrench, ShoppingCart, FileText, Package, Plus, Receipt, Calculator, Eye, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Order } from '../types'

export default function Dashboard() {
    const [rate, setRate] = useState<SilverRate | null>(null)
    const [inventory, setInventory] = useState<MetalInventory[]>([])
    const [finishedWeight, setFinishedWeight] = useState(0)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [r, inv, fw, ords] = await Promise.all([
                getLatestRate(),
                getMetalInventory(),
                getFinishedGoodsWeight(),
                getOrders()
            ])
            setRate(r)
            setInventory(inv)
            setFinishedWeight(fw)
            setOrders(ords)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Business Overview...</div>

    // Calculations
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyOrders = orders.filter(o => {
        const d = new Date(o.order_date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const rawSilverWeight = inventory.reduce((sum, item) => sum + (item.weight_gm || 0), 0)
    const totalSilverStockKg = (rawSilverWeight + finishedWeight) / 1000

    const pendingOrders = orders.filter(o => o.status !== 'Completed')
    const pendingValue = pendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    const monthlySales = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const gstPayable = monthlyOrders.reduce((sum, o) => sum + (o.gst_amount || 0), 0)

    const productsMadeCount = monthlyOrders.reduce((sum, o) => {
        return sum + (o.items?.reduce((iSum, item) => iSum + (item.quantity || 0), 0) || 0)
    }, 0)

    // Helper for Status Badge
    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'Completed': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
            'Pending': { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
            'In Progress': { bg: '#fefce8', text: '#854d0e', border: '#fef08a' }
        }
        const style = colors[status] || colors['Pending']
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`
            }}>
                {status}
            </span>
        )
    }

    const TypeBadge = ({ type }: { type: string }) => {
        const isJobWork = type === 'CLIENT'
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: isJobWork ? '#f1f5f9' : '#fffbeb',
                color: isJobWork ? '#475569' : '#b45309',
                textTransform: 'uppercase'
            }}>
                {isJobWork ? 'Job Work' : 'Sale'}
            </span>
        )
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>Dashboard</h1>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '1rem' }}>
                    Welcome back! Here's your business overview. / व्यापार की स्थिति
                </p>
            </header>

            {/* Top Stat Row - 6 Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem'
            }}>
                {/* 1. Total Silver Stock */}
                <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <span>Total Silver Stock<br /><small style={{ color: '#94a3b8' }}>कुल चांदी स्टॉक</small></span>
                        <div style={{ ...iconBoxStyle, background: '#fffbeb' }}><Scale size={20} color="#f59e0b" /></div>
                    </div>
                    <div style={cardValueStyle}>{totalSilverStockKg.toFixed(1)} kg</div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>+2.3 kg this month</div>
                </div>

                {/* 2. Today's Rate */}
                <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <span>Today's Rate<br /><small style={{ color: '#94a3b8' }}>आज का भाव</small></span>
                        <div style={{ ...iconBoxStyle, background: '#fefce8' }}><TrendingUp size={20} color="#ca8a04" /></div>
                    </div>
                    <div style={cardValueStyle}>₹{(rate?.rate_10g ? rate.rate_10g * 100 : 0).toLocaleString()}/kg</div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>+₹1,150 (+1.2%)</div>
                </div>

                {/* 3. Pending Job Work */}
                <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <span>Pending Job Work<br /><small style={{ color: '#94a3b8' }}>पेंडिंग जॉब वर्क</small></span>
                        <div style={{ ...iconBoxStyle, background: '#f8fafc' }}><Wrench size={20} color="#64748b" /></div>
                    </div>
                    <div style={cardValueStyle}>{pendingOrders.length} Orders</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Worth ₹{pendingValue.toLocaleString()}</div>
                </div>

                {/* 4. Monthly Sales */}
                <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <span>Monthly Sales<br /><small style={{ color: '#94a3b8' }}>मासिक बिक्री</small></span>
                        <div style={{ ...iconBoxStyle, background: '#fffbeb' }}><ShoppingCart size={20} color="#d97706" /></div>
                    </div>
                    <div style={cardValueStyle}>₹{monthlySales.toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>+18% from last month</div>
                </div>

                {/* 5. GST Payable */}
                <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <span>GST Payable<br /><small style={{ color: '#94a3b8' }}>GST देय</small></span>
                        <div style={{ ...iconBoxStyle, background: '#fefce8' }}><FileText size={20} color="#b45309" /></div>
                    </div>
                    <div style={cardValueStyle}>₹{gstPayable.toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Due by 20th {new Date().toLocaleString('default', { month: 'short' })}</div>
                </div>

                {/* 6. Products Made */}
                <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <span>Products Made<br /><small style={{ color: '#94a3b8' }}>उत्पादन</small></span>
                        <div style={{ ...iconBoxStyle, background: '#fff7ed' }}><Package size={20} color="#ea580c" /></div>
                    </div>
                    <div style={cardValueStyle}>{productsMadeCount} pcs</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>This month</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

                {/* Left: Recent Orders */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Recent Orders</h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>हाल के ऑर्डर</p>
                        </div>
                        <Link to="/orders" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>View All</Link>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                    <th style={thStyle}>Order ID</th>
                                    <th style={thStyle}>Customer</th>
                                    <th style={thStyle}>Product</th>
                                    <th style={thStyle}>Pieces</th>
                                    <th style={thStyle}>Type</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 6).map((order) => {
                                    const firstItem = order.items?.[0]
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={tdStyle}>{order.order_number}</td>
                                            <td style={{ ...tdStyle, fontWeight: 600 }}>{order.customer_name}</td>
                                            <td style={tdStyle}>{firstItem?.description || 'N/A'}</td>
                                            <td style={tdStyle}>{firstItem?.quantity || 0}</td>
                                            <td style={tdStyle}><TypeBadge type={order.material_type} /></td>
                                            <td style={tdStyle}><StatusBadge status={order.status} /></td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>₹{order.total_amount.toLocaleString()}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Actions & Stock Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Quick Actions */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                            Quick Actions<br />
                            <small style={{ fontWeight: 400, color: '#94a3b8' }}>त्वरित कार्य</small>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Link to="/orders" style={{ textDecoration: 'none' }}>
                                <button style={{ ...actionButtonStyle, background: '#1e293b', color: 'white' }}>
                                    <Plus size={20} />
                                    <span>New Job Work<br /><small style={{ opacity: 0.7, fontSize: '0.7rem' }}>नया जॉब वर्क</small></span>
                                </button>
                            </Link>
                            <Link to="/orders" style={{ textDecoration: 'none' }}>
                                <button style={actionButtonStyle}>
                                    <Receipt size={20} color="#64748b" />
                                    <span>Create Invoice<br /><small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>बिल बनाएं</small></span>
                                </button>
                            </Link>
                            <Link to="/rates" style={{ textDecoration: 'none' }}>
                                <button style={actionButtonStyle}>
                                    <TrendingUp size={20} color="#64748b" />
                                    <span>Update Rate<br /><small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>भाव अपडेट</small></span>
                                </button>
                            </Link>
                            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                                <button style={actionButtonStyle}>
                                    <Calculator size={20} color="#64748b" />
                                    <span>GST Calculator<br /><small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>GST कैलकुलेटर</small></span>
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Stock Overview */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                            Stock Overview<br />
                            <small style={{ fontWeight: 400, color: '#94a3b8' }}>स्टॉक स्थिति</small>
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Raw Silver */}
                            <StockItem
                                label="Raw Silver Stock"
                                hindiLabel="कच्ची चांदी"
                                value={`${(inventory.find(i => i.name === 'Raw Silver')?.weight_gm || 0) / 1000} kg`}
                                percent={75}
                                color="#f59e0b"
                            />
                            {/* Wastage */}
                            <StockItem
                                label="Wastage Silver"
                                hindiLabel="वेस्टेज चांदी"
                                value={`${(inventory.find(i => i.name === 'Wastage Silver')?.weight_gm || 0) / 1000} kg`}
                                percent={35}
                                color="#94a3b8"
                            />
                            {/* Product Category - Mocked for visual */}
                            <StockItem
                                label="Kanpuri Pendants"
                                hindiLabel="कानपुरी पेंडेंट"
                                value="450 pcs"
                                percent={60}
                                color="#1e293b"
                            />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}

// Sub-components & Styles
const cardStyle: React.CSSProperties = {
    background: 'white',
    padding: '1.25rem',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px'
}

const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    lineHeight: 1.2
}

const iconBoxStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}

const cardValueStyle: React.CSSProperties = {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#1e293b',
    margin: '0.5rem 0'
}

const thStyle: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600
}

const tdStyle: React.CSSProperties = {
    padding: '1.25rem 1rem',
    fontSize: '0.9rem',
    color: '#475569'
}

const actionButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '1.25rem 1rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
}

const StockItem = ({ label, hindiLabel, value, percent, color }: any) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                {label}<br />
                <small style={{ fontWeight: 400, color: '#94a3b8' }}>{hindiLabel}</small>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
        </div>
        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
        </div>
    </div>
)
