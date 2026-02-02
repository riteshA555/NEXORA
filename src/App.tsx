import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import OrderList from './pages/OrderList'
import OrderCreate from './pages/OrderCreate'
import ExpenseManager from './pages/ExpenseManager'
import AccountingDashboard from './pages/AccountingDashboard'
import LedgerStatement from './pages/LedgerStatement'
import KarigarMaster from './pages/KarigarMaster'
import KarigarSettlement from './pages/KarigarSettlement'
import GSTReports from './pages/GSTReports'
import SilverRateManager from './pages/SilverRateManager'
import UnifiedCatalog from './pages/UnifiedCatalog'
import Dashboard from './pages/Dashboard'
import StockManagement from './pages/StockManagement'

const Settings = () => <div><h2>Settings</h2><p>App settings.</p></div>

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { session, loading } = useAuth()

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return children
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="orders" element={<OrderList />} />
                        <Route path="orders/new" element={<OrderCreate />} />
                        <Route path="expenses" element={<ExpenseManager />} />
                        <Route path="accounting" element={<AccountingDashboard />} />
                        <Route path="ledger" element={<LedgerStatement />} />
                        <Route path="karigar" element={<KarigarMaster />} />
                        <Route path="settlement" element={<KarigarSettlement />} />
                        <Route path="gst-reports" element={<GSTReports />} />
                        <Route path="rates" element={<SilverRateManager />} />
                        <Route path="catalog" element={<UnifiedCatalog />} />
                        <Route path="stock" element={<StockManagement />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
