import { ArrowLeft, ArrowRight, Lock } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { submitOrder } from '../api/client.js'
import BriefStep from '../components/order/BriefStep.jsx'
import ConfigureStep from '../components/order/ConfigureStep.jsx'
import DetailsStep from '../components/order/DetailsStep.jsx'
import ModelStep from '../components/order/ModelStep.jsx'
import QuotePanel from '../components/order/QuotePanel.jsx'
import ReviewStep from '../components/order/ReviewStep.jsx'
import ServiceAside from '../components/order/ServiceAside.jsx'
import ServiceStep from '../components/order/ServiceStep.jsx'
import Stepper from '../components/order/Stepper.jsx'
import ViewerPanel from '../components/order/ViewerPanel.jsx'
import { useCatalog } from '../hooks/useCatalog.jsx'
import { useQuote } from '../hooks/useQuote.js'
import { createSampleFile, extOf, loadModelFile, MODEL_EXTS } from '../lib/mesh.js'
import { createVehicleFile, vehicleByKey } from '../three/vehicles/catalog.js'
import { INSTANT_STEPS, QUOTE_STEPS, fitsVolume, initialConfig, reconcileConfig, scaledDims, stepForField, validateStep } from '../lib/order.js'
import '../styles/order.css'

const STEP_COPY = {
  service: ['Choose a service', 'What would you like us to make? Printing services are priced instantly; design work gets a custom quote.'],
  model: ['Upload your model', 'We analyse your file right in the browser — volume, surface area and size — and price it instantly.'],
  configure: ['Configure your print', 'Pick a material, color and finish. The price and 3D preview update live.'],
  brief: ['Tell us about your project', 'The more detail you share, the more accurate your quote will be.'],
  details: ['Contact & delivery', 'Where should we send updates and your finished parts?'],
  review: ['Review & place order', 'Double-check everything — nothing is charged until our engineers confirm your order.'],
}

const EMPTY_UPLOAD = { file: null, status: 'idle', error: '', stats: null, geometry: null, previewable: false }

export default function OrderPage() {
  const catalog = useCatalog()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const presetService = catalog.serviceBySlug[params.get('service')] ? params.get('service') : ''
  const presetMaterial = params.get('material')

  const [serviceSlug, setServiceSlug] = useState(presetService)
  const service = catalog.serviceBySlug[serviceSlug]
  const instant = !service || service.pricingMode === 'instant'
  const steps = instant ? INSTANT_STEPS : QUOTE_STEPS
  const [stepIndex, setStepIndex] = useState(presetService ? 1 : 0)
  const [maxReached, setMaxReached] = useState(presetService ? 1 : 0)
  const step = steps[Math.min(stepIndex, steps.length - 1)].key

  const [upload, setUpload] = useState(EMPTY_UPLOAD)
  const [config, setConfig] = useState(() => (service ? initialConfig(service, catalog, presetMaterial) : null))
  const [brief, setBrief] = useState({ description: '', budget: 'Not sure yet', deadline: 'Flexible' })
  const [briefFile, setBriefFile] = useState(null)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', company: '' })
  const [shipping, setShipping] = useState({ method: 'standard', address: '', city: '', state: '', postalCode: '', country: 'India' })
  const [notes, setNotes] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle', progress: 0, error: '' })
  const mainRef = useRef(null)

  // Re-derive a valid configuration whenever the service (or the live catalog) changes.
  const catalogKey = `${catalog.status}:${catalog.materials.length}`
  useEffect(() => {
    if (!service) return
    setConfig((prev) => initialConfig(service, catalog, prev?.material ?? presetMaterial, prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceSlug, catalogKey])

  // Free GPU memory of replaced uploads.
  useEffect(() => () => upload.geometry?.dispose(), [upload.geometry])

  const material = config ? catalog.materialBySlug[config.material] : null
  const technology = material ? catalog.technologies[material.technology] : catalog.technologies.fdm
  const quality = material ? catalog.qualitiesFor(material.technology).find((q) => q.key === config.quality) : null
  const dims = useMemo(() => scaledDims(upload.stats, config), [upload.stats, config])
  const fits = fitsVolume(dims, technology?.buildVolumeMm)
  const manualPricing = instant && upload.status === 'ready' && !upload.previewable

  const quoteRequest = useMemo(
    () =>
      service && config && upload.stats
        ? {
            service: service.slug,
            config: {
              material: config.material,
              color: config.color,
              quality: config.quality,
              infill: config.infill,
              quantity: config.quantity,
              scale: config.scale,
              units: config.units,
              finishes: config.finishes,
            },
            model: upload.stats,
            delivery: shipping.method,
          }
        : null,
    [service, config, upload.stats, shipping.method],
  )
  const { quote, loading: quoteLoading, error: quoteError } = useQuote(quoteRequest, Boolean(instant && quoteRequest))

  const updateConfig = useCallback(
    (patch) =>
      setConfig((prev) => {
        const next = { ...prev, ...patch }
        if (patch.material && patch.material !== prev.material) {
          const m = catalog.materialBySlug[patch.material]
          return m ? reconcileConfig(service, m, catalog, next) : next
        }
        return next
      }),
    [catalog, service],
  )

  const handleFile = useCallback(
    async (file) => {
      const ext = extOf(file.name)
      if (!MODEL_EXTS.includes(ext)) {
        setUpload({ ...EMPTY_UPLOAD, status: 'error', error: `“.${ext || '?'}” files aren’t supported. Upload STL, OBJ, 3MF or STEP.` })
        return
      }
      if (file.size > catalog.uploads.maxMb * 1024 * 1024) {
        setUpload({ ...EMPTY_UPLOAD, status: 'error', error: `This file is larger than ${catalog.uploads.maxMb} MB.` })
        return
      }
      setErrors({})
      setUpload({ ...EMPTY_UPLOAD, file, status: 'loading' })
      try {
        const result = await loadModelFile(file)
        setUpload({ ...EMPTY_UPLOAD, file, status: 'ready', ...result })
      } catch (err) {
        setUpload({ ...EMPTY_UPLOAD, status: 'error', error: err.message || 'We could not read this file.' })
      }
    },
    [catalog.uploads.maxMb],
  )

  // Arriving from the bikes & scooters showroom: load that model (and the paint finish) automatically.
  const vehicleParam = params.get('vehicle')
  useEffect(() => {
    if (!vehicleParam || !vehicleByKey(vehicleParam)) return
    const scale = Number(params.get('scale')) || 12
    handleFile(createVehicleFile(vehicleParam, scale))
    if (params.get('paint') === '1') setConfig((c) => (c && !c.finishes.includes('painting') ? { ...c, finishes: [...c.finishes, 'painting'] } : c))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleParam])

  const goTo = (index) => {
    setStepIndex(index)
    setMaxReached((m) => Math.max(m, index))
    setErrors({})
    requestAnimationFrame(() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const context = { service, upload, config, brief, customer, shipping, agree }
  const next = () => {
    const e = validateStep(step, context)
    setErrors(e)
    if (Object.keys(e).length === 0) goTo(stepIndex + 1)
  }
  const jump = (index) => {
    if (index <= stepIndex) return goTo(index)
    for (let i = stepIndex; i < index; i++) {
      const e = validateStep(steps[i].key, context)
      if (Object.keys(e).length) {
        setStepIndex(i)
        setErrors(e)
        return
      }
    }
    goTo(index)
  }
  const editStep = (key) => goTo(steps.findIndex((s) => s.key === key))

  const selectService = (slug) => {
    setServiceSlug(slug)
    setErrors({})
    setMaxReached(0)
  }

  const placeOrder = async () => {
    const e = validateStep('review', context)
    setErrors(e)
    if (Object.keys(e).length) return
    setSubmit({ status: 'sending', progress: 0, error: '' })
    const payload = {
      service: service.slug,
      customer,
      shipping,
      notes,
      ...(instant ? { config: quoteRequest?.config ?? config, model: upload.stats || undefined } : { brief }),
    }
    try {
      const order = await submitOrder(payload, instant ? upload.file : briefFile, (progress) => setSubmit((s) => ({ ...s, progress })))
      navigate(`/order/success/${order.orderNumber}`, { state: { order, email: customer.email } })
    } catch (err) {
      setSubmit({ status: 'error', progress: 0, error: err.message })
      const fieldErrors = err.fields || {}
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors)
        const target = stepForField(Object.keys(fieldErrors)[0])
        const index = steps.findIndex((s) => s.key === target)
        if (index >= 0) setStepIndex(index)
      }
    }
  }

  const [title, intro] = STEP_COPY[step]
  const isLast = stepIndex === steps.length - 1

  return (
    <section className="order-page">
      <div className="container">
        <div className="order-head">
          <div>
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" /> {instant ? 'Instant quote' : 'Custom quote'}
            </span>
            <h1>Start your order</h1>
            <p>Secure checkout · engineers review every file before printing · nothing is charged yet</p>
          </div>
          {catalog.status === 'offline' && (
            <span className="status-pill" data-status="offline">
              <span className="dot" aria-hidden="true" /> Backend offline — start it to get live quotes
            </span>
          )}
        </div>

        <Stepper steps={steps} current={stepIndex} maxReachable={Math.max(maxReached, stepIndex)} onJump={jump} />

        <div className="order-grid">
          <div className="order-main glass" ref={mainRef} style={{ scrollMarginTop: 'calc(var(--nav-h) + 90px)' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <h2>{title}</h2>
                <p className="step-intro">{intro}</p>

                {step === 'service' && <ServiceStep services={catalog.services} currency={catalog.currency} value={serviceSlug} onChange={selectService} error={errors.service} />}
                {step === 'model' && (
                  <ModelStep
                    upload={upload}
                    config={config}
                    onFile={handleFile}
                    onSample={(sample) => handleFile(createSampleFile(sample))}
                    onVehicle={(key) => handleFile(createVehicleFile(key, 12))}
                    onClear={() => setUpload(EMPTY_UPLOAD)}
                    onUnits={(units) => updateConfig({ units })}
                    maxMb={catalog.uploads.maxMb}
                    error={errors.file}
                  />
                )}
                {step === 'configure' && config && <ConfigureStep service={service} catalog={catalog} config={config} onChange={updateConfig} dims={dims} errors={errors} />}
                {step === 'brief' && service && (
                  <BriefStep service={service} brief={brief} onChange={(p) => setBrief((b) => ({ ...b, ...p }))} file={briefFile} onFile={setBriefFile} errors={errors} />
                )}
                {step === 'details' && (
                  <DetailsStep
                    customer={customer}
                    shipping={shipping}
                    notes={notes}
                    onCustomer={(p) => setCustomer((c) => ({ ...c, ...p }))}
                    onShipping={(p) => setShipping((s) => ({ ...s, ...p }))}
                    onNotes={setNotes}
                    delivery={catalog.delivery}
                    currency={catalog.currency}
                    instant={instant}
                    errors={errors}
                  />
                )}
                {step === 'review' && service && (
                  <ReviewStep
                    instant={instant}
                    service={service}
                    catalog={catalog}
                    config={config}
                    upload={upload}
                    dims={dims}
                    brief={brief}
                    briefFile={briefFile}
                    customer={customer}
                    shipping={shipping}
                    notes={notes}
                    quote={quote}
                    quoteError={quoteError}
                    manualPricing={manualPricing}
                    agree={agree}
                    onAgree={setAgree}
                    onEdit={editStep}
                    errors={errors}
                    submit={submit}
                  />
                )}

                <div className="step-nav">
                  <button type="button" className="btn btn-ghost" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0 || submit.status === 'sending'}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  {isLast ? (
                    <button type="button" className="btn btn-primary btn-lg" onClick={placeOrder} disabled={submit.status === 'sending'}>
                      {submit.status === 'sending' ? <span className="spinner" aria-hidden="true" /> : <Lock size={16} />}
                      {submit.status === 'sending' ? 'Placing order…' : instant ? 'Place order' : 'Request quote'}
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={next}>
                      Continue <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="order-side" aria-label="Preview and price">
            {service && !instant ? (
              <ServiceAside service={service} currency={catalog.currency} />
            ) : (
              <>
                <ViewerPanel upload={upload} config={config} material={material} technology={technology} quality={quality} dims={dims} fits={fits} onFile={handleFile} />
                <QuotePanel
                  quote={quote}
                  loading={quoteLoading}
                  error={quoteError}
                  service={service}
                  currency={catalog.currency}
                  hasModel={Boolean(upload.stats)}
                  manual={manualPricing}
                />
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
