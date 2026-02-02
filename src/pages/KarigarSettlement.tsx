import { useState, useEffect } from 'react'
import { getKarigars, getKarigarWorkHistory, settleKarigarPayments, Karigar, KarigarWorkRecord } from '../services/karigarService'
import { Filter, CheckCircle2, IndianRupee, Wallet } from 'lucide-react'

export default function KarigarSettlement() {
    const [karigars, setKarigars] = useState<Karigar[]>([])
    const [records, setRecords] = useState<KarigarWorkRecord[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [filters, setFilters] = useState({
        karigarId: '',
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
    })
    const [settleData, setSettleData] = useState({
        date: new Date().toISOString().split('T')[0],
        mode: 'Cash'
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadKarigars()
    }, [])

    useEffect(() => {
        loadRecords()
    }, [filters])

    const loadKarigars = async () => {
        const data = await getKarigars()
        setKarigars(data)
    }

    const loadRecords = async () => {
        setLoading(true)
        try {
            const data = await getKarigarWorkHistory(filters.karigarId, filters.month)
            setRecords(data)
            setSelectedIds([])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleSettle = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`Settle ${selectedIds.length} records as PAID?`)) return

        try {
            await settleKarigarPayments(selectedIds, settleData.date, settleData.mode)
            loadRecords()
        } catch (err: any) {
            alert(err.message)
        }
    }

    const unsetteledAmount = records
        .filter(r => r.payment_status === 'PENDING')
        .reduce((sum, r) => sum + Number(r.amount), 0)

    const selectedAmount = records
        .filter(r => selectedIds.includes(r.id))
        .reduce((sum, r) => sum + Number(r.amount), 0)

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Karigar Settlement</h1>

            {/* Filters */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>Filter by Karigar</label>
                    <select value={filters.karigarId} onChange={e => setFilters({ ...filters, karigarId: e.target.value })}>
                        <option value="">All Karigars</option>
                        {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>Filter by Month</label>
                    <input type="month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} />
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'right', marginLeft: 'auto' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Pending (Filtered)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>₹{unsetteledAmount.toFixed(2)}</div>
                </div>
            </div>

            {/* Selection Toolbar */}
            {selectedIds.length > 0 && (
                <div style={{ background: '#eff6ff', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>
                        {selectedIds.length} records selected (Total: ₹{selectedAmount.toFixed(2)})
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input type="date" value={settleData.date} onChange={e => setSettleData({ ...settleData, date: e.target.value })} />
                        <select value={settleData.mode} onChange={e => setSettleData({ ...settleData, mode: e.target.value })}>
                            <option>Cash</option>
                            <option>Bank Transfer</option>
                            <option>UPI</option>
                        </select>
                        <button onClick={handleSettle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1d4ed8' }}>
                            <CheckCircle2 size={18} /> Mark as PAID
                        </button>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                            <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Karigar</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Qty x Rate</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr> :
                            records.length === 0 ? <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No work records found.</td></tr> :
                                records.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)', background: selectedIds.includes(r.id) ? '#f0f9ff' : 'transparent' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {r.payment_status === 'PENDING' && (
                                                <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{r.work_date}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{r.karigars?.name}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{r.description}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{r.quantity} x {r.rate}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>₹{r.amount.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '50px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                background: r.payment_status === 'PAID' ? '#dcfce7' : '#fef2f2',
                                                color: r.payment_status === 'PAID' ? '#166534' : '#991b1b'
                                            }}>{r.payment_status}</span>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
