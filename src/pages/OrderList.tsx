import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../services/orderService'
import { Order } from '../types'
import { Plus } from 'lucide-react'

export default function OrderList() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        try {
            const data = await getOrders()
            setOrders(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0 }}>Orders</h1>
                <Link
                    to="/orders/new"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.6em 1.2em',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}
                >
                    <Plus size={18} />
                    New Order
                </Link>
            </div>

            {loading && <p>Loading orders...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', background: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    No orders found. Create your first one!
                </div>
            )}

            {orders.length > 0 && (
                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Order #</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Customer</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Material</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const total = order.total_amount || 0
                                return (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>{order.order_number}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{order.order_date}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{order.customer_name}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: order.material_type === 'CLIENT' ? '#e0f2fe' : '#f0fdf4',
                                                    color: order.material_type === 'CLIENT' ? '#0369a1' : '#15803d'
                                                }}>
                                                    {order.material_type}
                                                </span>
                                                {order.gst_enabled && (
                                                    <span style={{
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.65rem',
                                                        background: '#ede9fe',
                                                        color: '#6d28d9',
                                                        border: '1px solid #ddd6fe'
                                                    }}>GST</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            ₹{total.toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
