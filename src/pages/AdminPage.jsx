import { Inbox, LayoutDashboard, ListOrdered, LogOut, RefreshCw, Tags, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import CatalogPanel from '../components/admin/CatalogPanel.jsx'
import MessagesPanel from '../components/admin/MessagesPanel.jsx'
import OrderDrawer from '../components/admin/OrderDrawer.jsx'
import OrdersPanel from '../components/admin/OrdersPanel.jsx'
import Overview from '../components/admin/Overview.jsx'
import { useCatalog } from '../hooks/useCatalog.jsx'
import '../styles/admin.css'

const SESSION_KEY = 'lf_admin_session'

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

function Dashboard({ session, onLogout }) {
  const catalog = useCatalog()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [openOrder, setOpenOrder] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Every admin request goes through here so an expired session logs out cleanly.
  const call = useCallback(
    async (fn) => {
      try {
        return await fn(session.token)
      } catch (err) {
        if (err.status === 401) {
          onLogout()
          return null
        }
        throw err
      }
    },
    [session.token, onLogout],
  )

  const loadStats = useCallback(async () => {
    try {
      setError('')
      const s = await call((t) => api.admin.stats(t))
      if (s) setStats(s)
    } catch (err) {
      setError(err.message)
    }
  }, [call])

  useEffect(() => {
    loadStats()
  }, [loadStats, refreshKey])

  const refresh = () => setRefreshKey((k) => k + 1)

  const showOrder = async (order) => {
    setOpenOrder(order)
    try {
      const full = await call((t) => api.admin.order(t, order.id))
      if (full) setOpenOrder(full)
    } catch {
      /* keep the summary we already have */
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ListOrdered, count: stats?.awaitingReview },
    { key: 'messages', label: 'Messages', icon: Inbox, count: stats?.newMessages },
    { key: 'catalog', label: 'Catalog', icon: Tags },
  ]

  return (
    <section className="admin">
      <div className="container" style={{ width: 'min(1320px, 100% - 40px)' }}>
        <div className="admin-head">
          <div>
            <h1>Studio dashboard</h1>
            <p>Signed in as {session.admin?.email}</p>
          </div>
          <div className="chip-row">
            <button type="button" className="btn btn-glass btn-sm" onClick={refresh}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              <Icon size={16} aria-hidden="true" /> {label}
              {count > 0 && <span className="count">{count}</span>}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
            <TriangleAlert size={18} /> {error}
          </div>
        )}

        {tab === 'overview' &&
          (stats ? (
            <Overview stats={stats} currency={catalog.currency} onOpenOrder={showOrder} />
          ) : (
            !error && (
              <div className="page-loader" style={{ minHeight: 300, paddingTop: 0 }}>
                <span className="spinner" />
              </div>
            )
          ))}
        {tab === 'orders' && <OrdersPanel call={call} onOpenOrder={showOrder} refreshKey={refreshKey} />}
        {tab === 'messages' && <MessagesPanel call={call} onChange={loadStats} />}
        {tab === 'catalog' && <CatalogPanel call={call} onCatalogChanged={catalog.reload} />}
      </div>

      {openOrder && (
        <OrderDrawer
          key={openOrder.id}
          order={openOrder}
          token={session.token}
          call={call}
          onClose={() => setOpenOrder(null)}
          onUpdated={(order) => {
            setOpenOrder(order)
            refresh()
          }}
        />
      )}
    </section>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState(readSession)

  const login = (s) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
  }
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  // Validate a stored session once (the token may have expired).
  useEffect(() => {
    if (!session?.token) return
    api.me(session.token).catch((err) => err.status === 401 && logout())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return session?.token ? <Dashboard session={session} onLogout={logout} /> : <AdminLogin onLogin={login} />
}
