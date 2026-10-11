import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import Footer from './components/layout/Footer.jsx'
import Navbar from './components/layout/Navbar.jsx'
import ScrollManager from './components/layout/ScrollManager.jsx'
import { CatalogProvider } from './hooks/useCatalog.jsx'
import HomePage from './pages/HomePage.jsx'
import SceneCanvas from './three/SceneCanvas.jsx'

const OrderPage = lazy(() => import('./pages/OrderPage.jsx'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage.jsx'))
const TrackPage = lazy(() => import('./pages/TrackPage.jsx'))
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <MotionConfig reducedMotion="user">
      <CatalogProvider>
        <ScrollManager />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navbar minimal={isAdmin} />
        <main id="main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/order/success/:orderNumber" element={<OrderSuccessPage />} />
              <Route path="/track" element={<TrackPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        {!isAdmin && <Footer />}
        {/* One shared WebGL canvas renders every <View> on the page (service cards, materials, showcase…) */}
        <SceneCanvas />
      </CatalogProvider>
    </MotionConfig>
  )
}
