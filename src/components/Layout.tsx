import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Menu, X, LayoutDashboard, ShoppingCart, Settings, LogOut, Wallet, BarChart3, BookOpen, Users, Receipt, LineChart, Book, Package } from 'lucide-react'

// Simple helper for nav items
const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Expenses', path: '/expenses', icon: Wallet },
    { name: 'Accounting (P&L)', path: '/accounting', icon: BarChart3 },
    { name: 'Customer Ledger', path: '/ledger', icon: BookOpen },
    { name: 'Karigar Master', path: '/karigar', icon: Users },
    { name: 'Karigar Settlement', path: '/settlement', icon: Wallet },
    { name: 'GST Module', path: '/gst-reports', icon: Receipt },
    { name: 'Silver Rates', path: '/rates', icon: LineChart },
    { name: 'Business Catalog', path: '/catalog', icon: Book },
    { name: 'Stock Management', path: '/stock', icon: Package },
    { name: 'Settings', path: '/settings', icon: Settings },
]

export default function Layout() {
    const { signOut, user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
    const closeSidebar = () => setSidebarOpen(false)

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: '250px',
                background: 'var(--color-surface)', // Sidebar color
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease-in-out',
            }} className="sidebar-desktop">
                {/* Note: I will add media query class logic via style tag or css file later, 
         but for now using inline style for transform which needs JS state */}

                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>ERP Core</h2>
                    <button onClick={closeSidebar} style={{ background: 'transparent', padding: 0, color: 'var(--color-text)', display: 'block' }} className="mobile-only-close">
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={closeSidebar}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            textDecoration: 'none',
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                                            background: isActive ? '#eff6ff' : 'transparent',
                                            fontWeight: isActive ? 600 : 400,
                                        }}
                                    >
                                        <Icon size={20} />
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ marginBottom: '1rem', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                    </div>
                    <button
                        onClick={signOut}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626'
                        }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 0 }} className="main-content">
                <header style={{
                    height: '64px',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30
                }}>
                    <button
                        onClick={toggleSidebar}
                        style={{ background: 'transparent', padding: 0, color: 'var(--color-text)', marginRight: '1rem' }}
                        className="mobile-menu-trigger"
                    >
                        <Menu size={24} />
                    </button>
                    <h3 style={{ margin: 0 }}>
                        {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                    </h3>
                </header>

                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </main>

            {/* Inject Media Queries for Responsiveness */}
            <style>{`
        /* Desktop: Sidebar always visible */
        @media (min-width: 768px) {
           aside {
               transform: translateX(0) !important;
               position: fixed !important; 
           }
           .mobile-only-close { display: none !important; }
           .mobile-menu-trigger { display: none !important; }
           .main-content { margin-left: 250px !important; }
        }
        
        /* Mobile: Sidebar hidden by default (handled by JS state transform) */
        @media (max-width: 767px) {
           .main-content { margin-left: 0 !important; }
        }
      `}</style>
        </div>
    )
}
