import { useState, useEffect } from 'react'
import { getLatestRate, getRateHistory, addSilverRate, SilverRate } from '../services/rateService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Save, Calendar } from 'lucide-react'

export default function SilverRateManager() {
    const [latestRate, setLatestRate] = useState<SilverRate | null>(null)
    const [history, setHistory] = useState<SilverRate[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [rateInput, setRateInput] = useState<string>('')
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        loadData(true)
    }, [])

    const loadData = async (isInitial = false) => {
        if (isInitial) setLoading(true)
        try {
            const [latest, hist] = await Promise.all([
                getLatestRate(),
                getRateHistory()
            ])
            setLatestRate(latest)
            setHistory(hist)
            if (latest) {
                setRateInput((latest.rate_10g * 100).toString())
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const calculateChange = (current: number, previous: number) => {
        if (!previous) return 0
        return ((current - previous) / previous) * 100
    }

    const handleUpdateRate = async () => {
        const kgRate = Number(rateInput)
        if (isNaN(kgRate) || kgRate <= 0) return alert("Bhai, sahi rate daaliye!")

        try {
            setUpdating(true)
            const rate_10g = kgRate / 100
            await addSilverRate({
                rate_10g,
                rate_date: dateInput,
                source: 'MCX'
            })
            setSuccessMsg('Rate updated successfully! / रेट अपडेट हो गया है।')
            setTimeout(() => setSuccessMsg(''), 3000)
            await loadData(false)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Rate Management...</div>

    const prevRate = history.length > 1 ? history[history.length - 2].rate_10g : (latestRate?.rate_10g || 0)
    const dailyChange = latestRate ? calculateChange(latestRate.rate_10g, prevRate) : 0

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Silver Rate Management</h1>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '1rem' }}>
                    Track and update daily silver rates / चांदी भाव प्रबंधन
                </p>
            </header>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* Card 1: Today's Rate (per Kg) */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderLeft: '5px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.75rem' }}>Today's Rate / आज का भाव</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                            ₹{latestRate ? (latestRate.rate_10g * 100).toLocaleString() : '0'}
                        </span>
                        <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500 }}>/kg</span>
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: dailyChange >= 0 ? '#10b981' : '#ef4444', fontSize: '1rem', fontWeight: 700 }}>
                        {dailyChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        {Math.abs(dailyChange).toFixed(2)}% from yesterday
                    </div>
                </div>

                {/* Card 2: Per 10 Gram */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.75rem' }}>Per 10 Gram / प्रति 10 ग्राम</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                        ₹{latestRate ? latestRate.rate_10g.toLocaleString() : '0'}
                    </div>
                    <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Standard measurement for retail</p>
                </div>

                {/* Card 3: Per Gram */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.75rem' }}>Per Gram / प्रति ग्राम</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                        ₹{latestRate ? latestRate.rate_1g.toLocaleString() : '0.00'}
                    </div>
                    <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Used for system calculations</p>
                </div>
            </div>

            {/* Update Row Container */}
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '3rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>
                    Update Today's Rate
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 400, color: '#64748b', marginTop: '0.3rem' }}>Aaj ka bhav update karein</span>
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '3.5rem',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ minWidth: '280px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>Silver Rate (₹/kg)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }}>₹</span>
                            <input
                                type="number"
                                value={rateInput}
                                onChange={e => setRateInput(e.target.value)}
                                style={{ width: '100%', padding: '0.9rem 1rem 0.9rem 2.5rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.1rem', background: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                    </div>
                    <div style={{ minWidth: '220px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>Date</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={20} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                            <input
                                type="date"
                                value={dateInput}
                                onChange={e => setDateInput(e.target.value)}
                                style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.1rem', background: '#f8fafc', outline: 'none' }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <button
                            onClick={handleUpdateRate}
                            disabled={updating}
                            style={{
                                width: '100%',
                                background: updating ? '#64748b' : '#1e293b',
                                color: 'white',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                cursor: updating ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.8rem',
                                height: '54px',
                                fontSize: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s',
                                opacity: updating ? 0.8 : 1
                            }}
                            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <Save size={20} /> {updating ? 'Updating...' : 'Update Rate'}
                        </button>
                    </div>
                </div>

                {successMsg && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        color: '#16a34a',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        animation: 'fadeIn 0.3s ease-in'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div>
                        {successMsg}
                    </div>
                )}
            </div>

            {/* Trend & History Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '3rem' }}>

                {/* Trend Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Rate Trend</h3>
                        <p style={{ margin: '0.1rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Last 7 days / पिछले 7 दिन</p>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history.slice(-7)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="rate_date"
                                    fontSize={12}
                                    tickMargin={12}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                />
                                <YAxis
                                    fontSize={12}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => `₹${(val / 10).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    formatter={(val: any) => [`₹${(Number(val) * 100).toLocaleString()}`, 'Rate/kg']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rate_10g"
                                    stroke="#f59e0b"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 9, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* History Table */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Rate History</h3>
                        <p style={{ margin: '0.1rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>भाव इतिहास</p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 0.5rem', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0.5rem', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate/kg</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0.5rem', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...history].reverse().map((row, idx, arr) => {
                                    const nextInList = arr[idx + 1]
                                    const change = nextInList ? calculateChange(row.rate_10g, nextInList.rate_10g) : 0
                                    return (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.2rem 0.5rem', fontWeight: 600, color: '#475569' }}>
                                                {new Date(row.rate_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '1.2rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                                                ₹{(row.rate_10g * 100).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '1.2rem 0.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: change >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
                                                    {idx === arr.length - 1 ? '-' : (
                                                        <>
                                                            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                            {Math.abs(change).toFixed(1)}%
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
