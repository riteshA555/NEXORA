import { useState, useEffect } from 'react'
import { getKarigars, createKarigar, Karigar } from '../services/karigarService'
import { Plus, UserPlus, Hammer, Ruler, Settings2 } from 'lucide-react'

export default function KarigarMaster() {
    const [karigars, setKarigars] = useState<Karigar[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        work_type: 'General',
        rate_type: 'Per KG',
        default_rate: 0
    })

    useEffect(() => {
        loadKarigars()
    }, [])

    const loadKarigars = async () => {
        try {
            const data = await getKarigars()
            setKarigars(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createKarigar(formData as any)
            setFormData({ name: '', work_type: 'General', rate_type: 'Per KG', default_rate: 0 })
            setIsAdding(false)
            loadKarigars()
        } catch (err: any) {
            alert(err.message)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0 }}>Karigar Master</h1>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ background: isAdding ? '#64748b' : 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} />
                    {isAdding ? 'Cancel' : 'Add Karigar'}
                </button>
            </div>

            {isAdding && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Karigar Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Work Type</label>
                            <select
                                value={formData.work_type}
                                onChange={e => setFormData({ ...formData, work_type: e.target.value })}
                            >
                                <option>Cutting</option>
                                <option>Choti</option>
                                <option>Half Belt</option>
                                <option>General</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Rate Type</label>
                            <select
                                value={formData.rate_type}
                                onChange={e => setFormData({ ...formData, rate_type: e.target.value })}
                            >
                                <option>Per KG</option>
                                <option>Per Piece</option>
                                <option>Fixed</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Default Rate (₹)</label>
                            <input
                                type="number"
                                value={formData.default_rate}
                                onChange={e => setFormData({ ...formData, default_rate: Number(e.target.value) })}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" style={{ width: '100%' }}>Save Karigar</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {karigars.map(k => (
                        <div key={k.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{k.name}</div>
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '50px',
                                    fontSize: '0.7rem',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    fontWeight: 600
                                }}>{k.status}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#64748b' }}>
                                    <Hammer size={16} /> {k.work_type}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#64748b' }}>
                                    <Settings2 size={16} /> {k.rate_type}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                                    Default Rate: ₹{k.default_rate.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
