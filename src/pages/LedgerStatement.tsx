import { useState, useEffect } from 'react'
import { getCustomerStatement } from '../services/accountingService'
import { Search, User, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export default function LedgerStatement() {
    const [customerName, setCustomerName] = useState('')
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!customerName) return

        setLoading(true)
        setError('')
        try {
            const data = await getCustomerStatement(customerName)
            setTransactions(data)
            if (data.length === 0) setError('No transactions found for this name.')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const totalDebit = transactions.reduce((sum, t) => sum + Number(t.debit), 0)
    const totalCredit = transactions.reduce((sum, t) => sum + Number(t.credit), 0)
    const balance = totalDebit - totalCredit

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Customer Ledger</h1>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            placeholder="Enter customer name..."
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            style={{
                                paddingLeft: '2.5rem',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            whiteSpace: 'nowrap',
                            height: '100%',
                            padding: '0.6rem 1.5rem'
                        }}
                    >
                        Search Ledger
                    </button>
                </form>
            </div>

            {loading && <p>Searching records...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && transactions.length > 0 && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <SummaryCard title="Total Billed" value={totalDebit} color="#eff6ff" textColor="#1d4ed8" />
                        <SummaryCard title="Total Received" value={totalCredit} color="#f0fdf4" textColor="#15803d" />
                        <SummaryCard title="Current Balance" value={balance} color="#fff7ed" textColor="#b45309" highlight />
                    </div>

                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Debit (Billed)</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Credit (Paid)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>{t.date}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{t.description}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: t.debit > 0 ? '#1d4ed8' : 'inherit' }}>
                                            {t.debit > 0 ? `₹${Number(t.debit).toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: t.credit > 0 ? '#15803d' : 'inherit' }}>
                                            {t.credit > 0 ? `₹${Number(t.credit).toFixed(2)}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function SummaryCard({ title, value, color, textColor, highlight }: any) {
    return (
        <div style={{ background: color, padding: '1rem', borderRadius: '8px', border: highlight ? `2px solid ${textColor}` : 'none' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: textColor }}>₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
    )
}
