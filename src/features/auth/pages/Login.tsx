import { useState } from 'react'
import { supabase } from '../../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { validateEmail, loginRateLimiter } from '../../../shared/utils/validation'
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react'

// Simple Login Page
export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSignup, setIsSignup] = useState(false) // Toggle between login/signup
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate email format
        if (!validateEmail(email)) {
            setError('Invalid email format / गलत ईमेल फॉर्मेट')
            setLoading(false)
            return
        }

        // Rate limiting - max 5 attempts per minute
        if (!loginRateLimiter.isAllowed('login', 5, 60000)) {
            setError('Too many login attempts. Please try again later / बहुत सारे प्रयास। कृपया बाद में प्रयास करें')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError('Invalid email or password / गलत ईमेल या पासवर्ड')
            setLoading(false)
        } else {
            // Reset rate limiter on successful login
            loginRateLimiter.reset('login')
            // Success - Redirect happens automatically via AuthProvider or we can force it
            navigate('/', { replace: true })
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate email format
        if (!validateEmail(email)) {
            setError('Invalid email format / गलत ईमेल फॉर्मेट')
            setLoading(false)
            return
        }

        // Password validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters / पासवर्ड कम से कम 6 अक्षर का होना चाहिए')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Success - Auto login after signup
            navigate('/', { replace: true })
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '420px',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: '#dcfce7',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <Lock size={32} color="#166534" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Enter your credentials to access the ERP</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={isSignup ? handleSignup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#166534',
                            color: 'white',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                {isSignup ? 'Creating Account...' : 'Signing In...'}
                            </>
                        ) : (
                            <>
                                {isSignup ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {/* Toggle between Login/Signup */}
                    <div style={{
                        marginTop: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#6B7280'
                    }}>
                        {isSignup ? (
                            <>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignup(false)
                                        setError('')
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#166534',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Sign In
                                </button>
                            </>
                        ) : (
                            <>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignup(true)
                                        setError('')
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#166534',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Create Account
                                </button>
                            </>
                        )}
                    </div>

                    <style>{`
                        .animate-spin {
                            animation: spin 1s linear infinite;
                        }
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </form>
            </div>
        </div>
    )
}
