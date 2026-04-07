'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  MapPin, Phone, MessageCircle, X, Check, Sparkles, Clock,
  ArrowRight, ChevronDown, Play, Pause, Home, Layers,
  Info, ZoomIn, RotateCcw, AlertCircle, CreditCard, Calendar,
  User, Mail, FileText, ChevronRight, Building2, Trees,
  DollarSign, Star, Filter, Eye, EyeOff
} from 'lucide-react';
import type { PlotData, PlotZone, PlotStatus } from '@/lib/plotData';
import { ALL_PLOTS, ZONE_SUMMARIES, SPECIAL_BLOCKS } from '@/lib/plotData';

// ─────────────────────────────────────────────
// Dynamic import (no SSR for Three.js)
// ─────────────────────────────────────────────
const Scene3D = dynamic(() => import('@/components/tour/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 via-amber-100 to-amber-300">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-amber-700" />
        </div>
      </div>
      <p className="mt-5 text-amber-900 font-semibold text-lg tracking-wide">Loading Isinya Estate…</p>
      <p className="text-amber-700 text-sm mt-1">Rendering ultra-realistic terrain</p>
    </div>
  ),
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n: number) => `KES ${n.toLocaleString()}`;

const STATUS_META: Record<PlotStatus, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: 'Available', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
  reserved:  { label: 'Reserved',  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',   dot: 'bg-amber-400'   },
  sold:      { label: 'Sold',      color: 'text-gray-400',    bg: 'bg-gray-500/15 border-gray-500/30',     dot: 'bg-gray-400'    },
};

const ZONE_META: Record<string, { color: string; ring: string }> = {
  A: { color: 'bg-amber-500',   ring: 'ring-amber-400'   },
  B: { color: 'bg-orange-500',  ring: 'ring-orange-400'  },
  C: { color: 'bg-teal-500',    ring: 'ring-teal-400'    },
  D: { color: 'bg-purple-500',  ring: 'ring-purple-400'  },
  SCHOOL:     { color: 'bg-pink-500',   ring: 'ring-pink-400'    },
  COMMERCIAL: { color: 'bg-yellow-500', ring: 'ring-yellow-400'  },
};

// ─────────────────────────────────────────────
// BOOKING MODAL
// ─────────────────────────────────────────────
interface BookingForm {
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
  paymentPlan: 'full' | 'installment' | 'deposit';
  message: string;
}

const PAYMENT_PLANS = [
  { id: 'full',        label: 'Full Payment',   desc: '100% upfront, best rate',     icon: <DollarSign className="w-4 h-4" /> },
  { id: 'installment', label: 'Installment',    desc: '6–12 month structured plan',   icon: <Calendar  className="w-4 h-4" /> },
  { id: 'deposit',     label: '10% Deposit',    desc: 'Reserve now, balance later',   icon: <CreditCard className="w-4 h-4" /> },
] as const;

function BookingModal({ plot, onClose }: { plot: PlotData; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<BookingForm>({
    fullName: '', idNumber: '', phone: '', email: '',
    paymentPlan: 'deposit', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<BookingForm>>({});

  const zm = ZONE_META[plot.zone] || ZONE_META.A;
  const sm = STATUS_META[plot.status];

  const depositAmt = Math.round(plot.price * 0.1);
  const savings    = plot.priceAfterPromo - plot.price;

  // Step-1 validation
  const validateStep1 = () => {
    const e: Partial<BookingForm> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.idNumber.trim()) e.idNumber = 'ID / Passport number is required';
    if (!form.phone.trim())    e.phone    = 'Phone number is required';
    if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    setStep(3);
  };

  const field = (
    id: keyof BookingForm,
    label: string,
    placeholder: string,
    type = 'text',
    required = true,
    icon?: React.ReactNode
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>
        )}
        <input
          id={id} type={type}
          value={form[id] as string}
          onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 rounded-lg bg-white/5 border ${
            errors[id] ? 'border-red-500' : 'border-white/10'
          } text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-400 transition-colors`}
        />
      </div>
      {errors[id] && <p className="text-red-400 text-xs mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          style={{ maxHeight: '92vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div
            className="relative p-5 border-b border-white/10"
            style={{ background: `linear-gradient(135deg, ${plot.zone === 'C' ? '#14B8A680' : plot.zone === 'B' ? '#F9731680' : plot.zone === 'D' ? '#8B5CF680' : '#D9770680'}, transparent)` }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl ${zm.color} flex items-center justify-center shrink-0`}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Book Plot {plot.plotNumber}</h2>
                <p className="text-gray-300 text-sm">{plot.parcelRef} · Zone {plot.zone} · {plot.sizeAcres} acre{plot.sizeAcres !== 1 ? 's' : ''}</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full border text-xs font-medium ${sm.bg} ${sm.color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                  {sm.label}
                </div>
              </div>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-amber-500 text-white ring-4 ring-amber-500/30' : 'bg-white/10 text-gray-500'
                  }`}>
                    {step > s ? <Check className="w-3 h-3" /> : s}
                  </div>
                  <span className={`text-xs ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                    {s === 1 ? 'Your Details' : 'Payment Plan'}
                  </span>
                  {s < 2 && <div className={`flex-1 h-px w-8 ${step > s ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {step === 3 ? (
              /* ── SUCCESS ── */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Booking Submitted!</h3>
                <p className="text-gray-400 mb-1">
                  Plot <span className="text-white font-semibold">{plot.plotNumber}</span> has been reserved for
                </p>
                <p className="text-amber-400 font-bold text-lg mb-5">{form.fullName}</p>
                <div className="bg-white/5 rounded-xl p-4 text-left space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Parcel Ref</span>
                    <span className="text-white font-mono">{plot.parcelRef}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Zone</span>
                    <span className="text-white">Zone {plot.zone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Size</span>
                    <span className="text-white">{plot.sizeAcres} acres ({plot.sizeSqM.toLocaleString()} m²)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Payment Plan</span>
                    <span className="text-white capitalize">{form.paymentPlan}</span>
                  </div>
                  {form.paymentPlan === 'deposit' && (
                    <div className="flex justify-between text-sm pt-1 border-t border-white/10">
                      <span className="text-gray-400">Amount Due Now</span>
                      <span className="text-amber-400 font-bold">{fmt(depositAmt)}</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-5">Our team will contact you within <strong className="text-white">24 hours</strong> on <span className="text-amber-400">{form.phone}</span>.</p>
                <div className="flex gap-3">
                  <a
                    href={`https://wa.me/254716575954?text=${encodeURIComponent(`Hello! I just submitted a booking request for Plot ${plot.plotNumber} (${plot.parcelRef}), Zone ${plot.zone}. My name is ${form.fullName} and my phone is ${form.phone}.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Us
                  </a>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            ) : step === 1 ? (
              /* ── STEP 1: PERSONAL DETAILS ── */
              <div className="space-y-4">
                {/* Price summary */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Plot Price</span>
                    <span className="text-white font-bold text-lg">{fmt(plot.price)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">10% Reserve Deposit</span>
                    <span className="text-amber-400 font-bold">{fmt(depositAmt)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 rounded-lg p-2 mt-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Save {fmt(savings)} by booking before the price increase!
                    </div>
                  )}
                </div>

                {field('fullName',  'Full Name',              'e.g. John Kamau',         'text', true, <User className="w-4 h-4" />)}
                {field('idNumber',  'National ID / Passport', 'e.g. 12345678',           'text', true, <FileText className="w-4 h-4" />)}
                {field('phone',     'Phone Number',           '+254 7XX XXX XXX',        'tel',  true, <Phone className="w-4 h-4" />)}
                {field('email',     'Email Address',          'john@example.com',        'email',false, <Mail className="w-4 h-4" />)}

                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* ── STEP 2: PAYMENT PLAN ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-400 text-sm">Choose how you'd like to pay for Plot <span className="text-white font-semibold">{plot.plotNumber}</span>.</p>

                <div className="space-y-3">
                  {PAYMENT_PLANS.map(plan => (
                    <label
                      key={plan.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.paymentPlan === plan.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value={plan.id}
                        checked={form.paymentPlan === plan.id}
                        onChange={() => setForm(f => ({ ...f, paymentPlan: plan.id }))}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={form.paymentPlan === plan.id ? 'text-amber-400' : 'text-gray-400'}>
                            {plan.icon}
                          </span>
                          <span className="text-white font-semibold text-sm">{plan.label}</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">{plan.desc}</p>
                        {plan.id === 'deposit' && form.paymentPlan === 'deposit' && (
                          <p className="text-amber-400 text-xs mt-1 font-bold">Due now: {fmt(depositAmt)}</p>
                        )}
                        {plan.id === 'full' && form.paymentPlan === 'full' && (
                          <p className="text-emerald-400 text-xs mt-1 font-bold">Total: {fmt(plot.price)}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Additional Message <span className="text-gray-600 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Any specific requests or questions…"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-amber-400 resize-none transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-300 bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="flex-[2] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                    ) : (
                      <><Check className="w-4 h-4" /> Confirm Booking</>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-600">
                  By submitting you agree to be contacted by the RDG Properties team.<br />
                  Your data is kept private and never shared.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// PLOT DETAIL PANEL (sidebar when plot selected)
// ─────────────────────────────────────────────
function PlotDetailPanel({
  plot,
  onBook,
  onClose,
}: {
  plot: PlotData;
  onBook: () => void;
  onClose: () => void;
}) {
  const sm = STATUS_META[plot.status];
  const zm = ZONE_META[plot.zone] || ZONE_META.A;
  const zoneSum = ZONE_SUMMARIES.find(z => z.id === plot.zone);

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="absolute top-20 left-4 z-40 w-72 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      style={{ background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(18px)' }}
    >
      {/* Header */}
      <div
        className="p-4 border-b border-white/8"
        style={{ background: `linear-gradient(135deg, ${zoneSum?.color || '#888'}33, transparent)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${zm.color}`} />
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Zone {plot.zone}</span>
            </div>
            <h3 className="text-xl font-bold text-white">Plot {plot.plotNumber}</h3>
            <p className="text-gray-500 text-xs font-mono mt-0.5">{plot.parcelRef}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full border text-xs font-semibold ${sm.bg} ${sm.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
          {sm.label}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Price', value: fmt(plot.price), accent: true },
            { label: 'Size', value: `${plot.sizeAcres} acre${plot.sizeAcres !== 1 ? 's' : ''}` },
            { label: 'Area', value: `${plot.sizeSqM.toLocaleString()} m²` },
            { label: '10% Deposit', value: fmt(Math.round(plot.price * 0.1)) },
          ].map(item => (
            <div key={item.label} className="bg-white/5 rounded-xl p-3">
              <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">{item.label}</p>
              <p className={`font-bold text-sm ${item.accent ? 'text-amber-400' : 'text-white'}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* After-promo notice */}
        {plot.priceAfterPromo > plot.price && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <Clock className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-red-400 text-xs font-semibold">Price rises after July 2026</p>
              <p className="text-gray-400 text-xs">{fmt(plot.priceAfterPromo)} — save {fmt(plot.priceAfterPromo - plot.price)}</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-1.5">
          {plot.features.map(f => (
            <div key={f} className="flex items-center gap-2 text-gray-300 text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {/* Actions */}
        {plot.status !== 'sold' && (
          <button
            onClick={onBook}
            disabled={plot.status === 'reserved'}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: plot.status === 'reserved' ? '#4B5563' : `linear-gradient(to right, ${zoneSum?.color || '#D97706'}, ${zoneSum?.color || '#D97706'}CC)` }}
          >
            {plot.status === 'reserved' ? (
              <><AlertCircle className="w-4 h-4" /> Currently Reserved</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Book This Plot</>
            )}
          </button>
        )}

        <a
          href={`https://wa.me/254716575954?text=${encodeURIComponent(`Hello! I'm interested in Plot ${plot.plotNumber} (${plot.parcelRef}), Zone ${plot.zone} at Isinya Chuna Estate.`)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-600 transition-colors text-sm"
        >
          <MessageCircle className="w-4 h-4" /> Enquire on WhatsApp
        </a>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ZONE LEGEND & FILTER PANEL
// ─────────────────────────────────────────────
function ZoneLegend({
  activeZone,
  onZoneToggle,
  counts,
}: {
  activeZone: string | null;
  onZoneToggle: (z: string | null) => void;
  counts: Record<string, { total: number; available: number }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 left-4 z-40">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10 text-white text-sm font-medium hover:bg-black/80 transition-colors"
      >
        <Layers className="w-4 h-4" />
        {activeZone ? `Zone ${activeZone}` : 'All Zones'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 w-64 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
            style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}
          >
            <div className="p-3 border-b border-white/8">
              <p className="text-white text-sm font-bold">Filter by Zone</p>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => { onZoneToggle(null); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeZone === null ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white/50" />
                <span className="flex-1 text-left">All Zones</span>
                <span className="text-xs text-gray-500">{ALL_PLOTS.length} plots</span>
              </button>
              {ZONE_SUMMARIES.filter(z => z.isAvailableForSale).map(z => (
                <button
                  key={z.id}
                  onClick={() => { onZoneToggle(activeZone === z.id ? null : z.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeZone === z.id ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: z.color }} />
                  <span className="flex-1 text-left">{`Zone ${z.id}`}</span>
                  <span className="text-xs text-gray-500">
                    {counts[z.id]?.available ?? 0}/{counts[z.id]?.total ?? 0} avail
                  </span>
                </button>
              ))}
            </div>
            {/* Status legend */}
            <div className="p-3 border-t border-white/8 flex items-center gap-4">
              {Object.entries(STATUS_META).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className={`w-2 h-2 rounded-sm ${v.dot}`} />
                  {v.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOP NAVIGATION
// ─────────────────────────────────────────────
function TopNav({
  isAutoRotating,
  onAutoRotateToggle,
  totalPlots,
  availablePlots,
}: {
  isAutoRotating: boolean;
  onAutoRotateToggle: () => void;
  totalPlots: number;
  availablePlots: number;
}) {
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 h-16"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)', backdropFilter: 'blur(4px)' }}
    >
      {/* Left: Logo */}
      <a href="/index.html" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="text-white font-bold text-sm leading-tight">Isinya Chuna Estate</div>
          <div className="text-amber-400 text-[10px] font-medium tracking-widest uppercase">3D Virtual Tour</div>
        </div>
      </a>

      {/* Centre: Stats */}
      <div className="hidden md:flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-semibold">{availablePlots}</span>
          <span className="text-gray-400">of {totalPlots} available</span>
        </div>
        <div className="text-gray-500 text-xs">Isinya, Kajiado County</div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoRotateToggle}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border ${
            isAutoRotating
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-white/10 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isAutoRotating ? 'Stop' : 'Rotate'}</span>
        </button>

        <a
          href="tel:+254716575954"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-lg"
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Call RDG</span>
        </a>
      </div>
    </motion.nav>
  );
}

// ─────────────────────────────────────────────
// BOTTOM CONTROLS HUD
// ─────────────────────────────────────────────
function BottomHUD({ selectedPlot }: { selectedPlot: PlotData | null }) {
  return (
    <div className="absolute bottom-6 right-4 z-40 flex flex-col items-end gap-2">
      {/* Tips */}
      {!selectedPlot && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="text-xs text-gray-400 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/8 max-w-[180px] text-right"
        >
          <p className="font-semibold text-white mb-0.5">Navigation Tips</p>
          <p>🖱 Drag to orbit</p>
          <p>🖱 Scroll to zoom</p>
          <p>👆 Click plot to select</p>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ZONE INFO CARDS SECTION (below 3D view)
// ─────────────────────────────────────────────
function ZoneCards({ onBook }: { onBook: (zone: string) => void }) {
  const saleZones = ZONE_SUMMARIES.filter(z => z.isAvailableForSale);

  return (
    <section className="relative py-20 px-4" style={{ background: 'linear-gradient(to bottom, #0a0a14, #0f0f22)' }}>
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px)'
      }} />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            PLOTS ON OFFER
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Zone</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            {ALL_PLOTS.filter(p => p.status === 'available').length} plots available across {saleZones.length} zones.
            Prices increase after July 2026.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {saleZones.map((zone, i) => {
            const zonePlots = ALL_PLOTS.filter(p => p.zone === zone.id);
            const avail = zonePlots.filter(p => p.status === 'available').length;
            const pct = Math.round((avail / zonePlots.length) * 100);

            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-2xl border border-white/8 overflow-hidden hover:border-white/20 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                {/* Top accent */}
                <div className="h-1.5 w-full" style={{ background: zone.color }} />

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${zone.color}22`, border: `1px solid ${zone.color}44` }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: zone.color }} />
                    </div>
                    {avail > 0 ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${zone.color}22`, color: zone.color }}>
                        {avail} left
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Sold out</span>
                    )}
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1">Zone {zone.id}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">{zone.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="text-gray-500 text-xs mb-0.5">From</div>
                    <div className="text-2xl font-extrabold text-white">
                      {fmt(zone.pricePerPlot)}
                    </div>
                    <div className="text-gray-600 text-xs">After July 2026: {fmt(zone.priceAfterPromo)}</div>
                  </div>

                  {/* Availability bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Availability</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: zone.color }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => avail > 0 && onBook(zone.id)}
                    disabled={avail === 0}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:bg-gray-700"
                    style={{ background: avail > 0 ? `linear-gradient(to right, ${zone.color}, ${zone.color}BB)` : '#374151' }}
                  >
                    {avail > 0 ? <>Reserve Plot <ArrowRight className="w-4 h-4" /></> : 'Unavailable'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PROPERTY INFO SECTION
// ─────────────────────────────────────────────
function PropertyInfo() {
  const highlights = [
    { icon: <MapPin className="w-6 h-6" />, title: 'Prime Location', desc: 'Isinya, Kajiado County — 1 hour from Nairobi CBD on Mombasa Road' },
    { icon: <Star className="w-6 h-6" />, title: 'Title Available', desc: 'Individual freehold titles ready for immediate transfer' },
    { icon: <Trees className="w-6 h-6" />, title: 'Scenic Landscape', desc: 'Panoramic savanna views, clean air, acacia-dotted terrain' },
    { icon: <CreditCard className="w-6 h-6" />, title: 'Flexible Payments', desc: 'Reserve with just 10% deposit, balance over 12 months' },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-stone-950 to-black border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Why Isinya Chuna Estate?</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A master-planned community in one of Kajiado's fastest-growing corridors. Infrastructure in place, ready to build.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center p-5 rounded-2xl border border-white/8 hover:border-amber-500/30 transition-all group"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                {h.icon}
              </div>
              <h4 className="text-white font-bold mb-2">{h.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FOOTER CTA
// ─────────────────────────────────────────────
function FooterCTA() {
  return (
    <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #1c0a00, #0a0a14)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Own Your Plot?</h2>
        <p className="text-gray-400 mb-8">Contact our team now. Plots are selling fast — don't miss the pre-July price.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:+254716575954"
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors shadow-xl shadow-amber-500/25"
          >
            <Phone className="w-5 h-5" /> Call +254 716 575 954
          </a>
          <a
            href="https://wa.me/254716575954"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold transition-colors shadow-xl shadow-green-600/25"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp Us
          </a>
        </div>
        <p className="text-gray-600 text-sm mt-6">Isinya, Kajiado County · RDG Properties Ltd · Est. 2018</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function TourPage() {
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [bookingPlot, setBookingPlot] = useState<PlotData | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [highlightZone, setHighlightZone] = useState<string | null>(null);

  // Counts for legend
  const zoneCounts = useMemo(() => {
    const acc: Record<string, { total: number; available: number }> = {};
    ALL_PLOTS.forEach(p => {
      if (!acc[p.zone]) acc[p.zone] = { total: 0, available: 0 };
      acc[p.zone].total++;
      if (p.status === 'available') acc[p.zone].available++;
    });
    return acc;
  }, []);

  const totalAvailable = useMemo(() => ALL_PLOTS.filter(p => p.status === 'available').length, []);

  const handlePlotSelect = useCallback((plot: PlotData | null) => {
    setSelectedPlot(plot);
    if (plot) setIsAutoRotating(false);
  }, []);

  const handleBookFromZone = (zoneId: string) => {
    // Find first available plot in zone for booking
    const plot = ALL_PLOTS.find(p => p.zone === zoneId && p.status === 'available');
    if (plot) setBookingPlot(plot);
  };

  const handleZoneToggle = (zoneId: string | null) => {
    setHighlightZone(zoneId);
    setSelectedPlot(null);
  };

  return (
    <>
      <title>3D Virtual Tour | Isinya Chuna Estate</title>
      <main className="bg-black min-h-screen">
        {/* ── 3D VIEWPORT ── */}
        <section className="relative h-screen w-full overflow-hidden">
          {/* Top Nav */}
          <TopNav
            isAutoRotating={isAutoRotating}
            onAutoRotateToggle={() => setIsAutoRotating(v => !v)}
            totalPlots={ALL_PLOTS.length}
            availablePlots={totalAvailable}
          />

          {/* 3D Canvas */}
          <div className="absolute inset-0">
            <Scene3D
              selectedPlotId={selectedPlot?.id ?? null}
              onPlotSelect={handlePlotSelect}
              highlightZone={highlightZone}
              isAutoRotating={isAutoRotating}
            />
          </div>

          {/* Selected Plot Detail Panel */}
          <AnimatePresence>
            {selectedPlot && (
              <PlotDetailPanel
                plot={selectedPlot}
                onBook={() => setBookingPlot(selectedPlot)}
                onClose={() => setSelectedPlot(null)}
              />
            )}
          </AnimatePresence>

          {/* Zone Legend + Filter */}
          <ZoneLegend
            activeZone={highlightZone}
            onZoneToggle={handleZoneToggle}
            counts={zoneCounts}
          />

          {/* Bottom HUD tips */}
          <BottomHUD selectedPlot={selectedPlot} />

          {/* Intro overlay (auto-dismisses) */}
          <IntroOverlay />
        </section>

        {/* ── ZONE CARDS ── */}
        <ZoneCards onBook={handleBookFromZone} />

        {/* ── PROPERTY INFO ── */}
        <PropertyInfo />

        {/* ── FOOTER CTA ── */}
        <FooterCTA />

        {/* ── FLOATING WHATSAPP ── */}
        <motion.a
          href="https://wa.me/254716575954"
          target="_blank" rel="noopener noreferrer"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 3, type: 'spring', stiffness: 200 }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </motion.a>
      </main>

      {/* ── BOOKING MODAL ── */}
      <AnimatePresence>
        {bookingPlot && (
          <BookingModal
            plot={bookingPlot}
            onClose={() => setBookingPlot(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// INTRO OVERLAY — auto-dismisses after 4s
// ─────────────────────────────────────────────
function IntroOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ delay: 1 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 text-center"
        >
          <div
            className="px-6 py-4 rounded-2xl border border-white/10 shadow-2xl max-w-sm"
            style={{ background: 'rgba(8,8,20,0.9)', backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold text-sm">Isinya Chuna Estate</span>
            </div>
            <p className="text-gray-400 text-xs mb-3">
              Kajiado County · {ALL_PLOTS.filter(p => p.status === 'available').length} plots available · Scale 1:2000
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
              <span>Drag to orbit</span>
              <span>·</span>
              <span>Scroll to zoom</span>
              <span>·</span>
              <span>Click plot to select</span>
            </div>
            <button onClick={() => setVisible(false)} className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
