// Brand & marketing content — edit freely. Services, materials and prices come from the backend.

export const site = {
  name: 'LayerForge',
  mark: '3D',
  tagline: 'Industrial 3D printing, on demand.',
  email: 'hello@layerforge.in',
  phone: '+91 98765 43210',
  address: 'Plot 42, Peenya Industrial Area, Bengaluru, Karnataka 560058',
  hours: 'Mon–Sat · 10:00–19:00 IST',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'YouTube', href: 'https://youtube.com' },
  ],
}

export const navLinks = [
  { label: 'Services', href: '/#services' },
  { label: 'How it works', href: '/#process' },
  { label: 'Materials', href: '/#materials' },
  { label: 'Bikes', href: '/#garage' },
  { label: 'Showcase', href: '/#showcase' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/#contact' },
]

export const heroStats = [
  { value: '25K+', label: 'Parts delivered' },
  { value: '48 h', label: 'Average turnaround' },
  { value: '14', label: 'Pro materials' },
  { value: '4.9/5', label: 'Customer rating' },
]

export const processSteps = [
  {
    visual: 'upload',
    title: 'Upload your model',
    text: 'Drop an STL, OBJ, 3MF or STEP file — or send a sketch and let our designers model it for you.',
  },
  {
    visual: 'quote',
    title: 'Get an instant quote',
    text: 'Pick a process, material, color and finish. Your price updates live with a full cost breakdown.',
  },
  {
    visual: 'print',
    title: 'We print & finish',
    text: 'Engineers check every file, then our printer farm produces, post-processes and inspects your parts.',
  },
  {
    visual: 'ship',
    title: 'Delivered to your door',
    text: 'Tracked shipping, express courier or studio pickup — follow every step with your order number.',
  },
]

export const industries = [
  'Automotive',
  'Aerospace',
  'Medical & dental',
  'Architecture',
  'Consumer products',
  'Robotics',
  'Education',
  'Film & cosplay',
  'Jewelry',
  'Industrial tooling',
  'Drones',
  'Tabletop gaming',
]

export const showcaseProjects = [
  { shape: 'vase', name: 'Spiral vase collection', client: 'Studio North', material: 'PLA · Sunset Orange', tech: 'FDM', size: '80 × 80 × 160 mm', time: '3 h 14 min', color: '#ff7a45' },
  { shape: 'gear', name: 'Planetary gearbox', client: 'Kinetic Robotics', material: 'PETG · Transparent Blue', tech: 'FDM', size: 'Ø 124 × 56 mm', time: '2 h 05 min', color: '#4f9fe8' },
  { shape: 'king', name: 'Heirloom chess set', client: 'Private collector', material: 'Standard Resin · White', tech: 'SLA', size: '42 × 42 × 140 mm', time: '4 h 40 min', color: '#ece8df' },
  { shape: 'impeller', name: 'Turbine impeller', client: 'Orbital Labs', material: 'Titanium Ti6Al4V', tech: 'DMLS', size: 'Ø 140 × 50 mm', time: '19 h 30 min', color: '#c9cdd3' },
  { shape: 'rocket', name: 'Model rocket kit', client: 'STEM Academy', material: 'PLA · Signal Red', tech: 'FDM', size: '48 × 48 × 150 mm', time: '2 h 50 min', color: '#e63946' },
  { shape: 'heart', name: 'Wedding keepsakes', client: 'Rossi & Co.', material: 'Clear Resin · Rose', tech: 'SLA', size: '60 × 55 × 18 mm', time: '1 h 10 min', color: '#fb7185' },
  { shape: 'robot', name: 'Collector figurine', client: 'Pixel Forge Games', material: '8K Resin · hand painted', tech: 'SLA', size: '32 mm scale', time: '3 h 20 min', color: '#c084fc' },
]

export const plans = [
  {
    name: 'Pay as you go',
    price: '₹0',
    period: '/month',
    description: 'Perfect for makers, students and one-off parts.',
    features: ['Instant online quotes', 'All 14 materials', 'Standard production queue', 'Email support'],
    cta: 'Start an order',
    href: '/order',
  },
  {
    name: 'Maker Pro',
    price: '₹1,499',
    period: '/month',
    description: 'For creators and studios printing every week.',
    features: ['10% off every print', 'Priority production queue', 'Free shipping across India', '1 free CAD consult / month', 'Finishing at member rates'],
    cta: 'Choose Pro',
    href: '/#contact',
    featured: true,
  },
  {
    name: 'Business',
    price: 'Custom',
    period: '',
    description: 'Volume pricing and dedicated engineering support.',
    features: ['Volume pricing up to 30% off', 'Dedicated project manager', 'NDA & IP protection', '30-day credit with GST invoices', 'Recurring batch scheduling'],
    cta: 'Talk to sales',
    href: '/#contact',
  },
]

export const testimonials = [
  { quote: 'We went from CAD to a working prototype in under 48 hours. The DFM feedback alone saved us a full iteration.', name: 'Aisha Rahman', role: 'Hardware Lead, Orbital Labs' },
  { quote: 'The resin miniatures are unbelievably crisp. Every cape fold and rivet is there — my players were speechless.', name: 'Leo Martins', role: 'Game Master & Collector' },
  { quote: 'Our architectural models finally look as good as the renders. Clients sign off faster when they can hold it.', name: 'Hannah Lee', role: 'Partner, Lee & Ortiz Architects' },
  { quote: 'Batch of 500 nylon brackets, every single one within tolerance. Pricing beat our injection-molding quote.', name: 'Jonas Weber', role: 'Operations, Kinetic Robotics' },
  { quote: 'The 3D preview and instant quote made ordering painless. I knew exactly what I would get and what it would cost.', name: 'Maya Chen', role: 'Product Designer, Studio North' },
  { quote: 'They scanned and rebuilt a discontinued car part from 1972 — then printed it in steel. Magic.', name: 'Priya Natarajan', role: 'Classic car restorer' },
]

export const faqs = [
  { q: 'Which file formats can I upload?', a: 'STL, OBJ and 3MF files are previewed and priced instantly in your browser. STEP/STP files are accepted too — our engineers price them by hand within a few hours. For design projects you can attach sketches, photos, PDFs or ZIP archives.' },
  { q: 'How accurate is the instant quote?', a: 'The quote is calculated from your model’s real volume, surface area and dimensions, plus material, quality, finishing and quantity. Our server re-analyzes the uploaded file when you order, and we only contact you if something needs to change (for example, a part that must be split).' },
  { q: 'How fast can I get my parts?', a: 'Most FDM and resin orders are dispatched in 2–5 business days and delivered anywhere in India by tracked courier. Rapid Prototyping guarantees 24–48 h production, and Express puts your order at the front of the queue with express air courier (1–2 days to metro cities).' },
  { q: 'What tolerances can you hold?', a: 'Typically ±0.2 mm for FDM, ±0.1 mm for resin and SLS, and ±0.05 mm for metal after machining. Tell us about critical dimensions in your order notes and we’ll orient and tune the print for them.' },
  { q: 'Is my design kept confidential?', a: 'Yes. Files are only accessible to our production team, never shared, and deleted on request. Business plans include a mutual NDA and IP-protection agreement.' },
  { q: 'Can you print parts larger than the build volume?', a: 'Absolutely. We split large models into keyed sections, then bond, fill and finish the seams so the assembled part looks like one piece.' },
  { q: 'How do I pay?', a: 'Once our engineers review your file you receive a confirmation email with a secure payment link — UPI, debit/credit card, net banking or bank transfer (NEFT/RTGS/IMPS). Every order comes with a GST invoice, and business accounts can pay on 30-day credit.' },
  { q: 'Are prices inclusive of GST?', a: 'Starting prices on the website exclude GST. Your instant quote and invoice show 18% GST as a separate line, so you always know the final amount. Add your GSTIN in the order notes to claim input tax credit.' },
  { q: 'Do you offer design help if I don’t have a 3D model?', a: 'Yes — choose 3D Modeling & CAD Design or 3D Scanning, describe your idea, and we’ll send a fixed quote within one business day.' },
]
