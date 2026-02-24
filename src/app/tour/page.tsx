'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Play,
    Pause,
    Phone,
    MessageCircle,
    MapPin,
    ChevronDown,
    X,
    Check,
    Sparkles,
    Clock,
    ArrowRight,
    Building2,
    TrendingUp,
    ArrowLeft
} from 'lucide-react';

// ============================================
// TYPES AND DATA
// ============================================

interface Plot {
    id: string;
    plotNumber: string;
    zone: 'A' | 'B' | 'C' | 'SCHOOL' | 'NURSERY' | 'RESIDENTIAL' | 'EXTENSION';
    status: 'available' | 'reserved' | 'sold';
    price?: number;
    size?: number;
    position: [number, number, number];
    dimensions: [number, number];
    elevation: number;
}

interface Zone {
    id: string;
    name: string;
    description: string;
    plotsAvailable: number;
    plotsTotal: number;
    pricePerPlot: number;
    priceAfterJuly2026: number;
    color: string;
    position: [number, number, number];
    bounds: { min: [number, number]; max: [number, number]; };
    features: string[];
    isOnOffer: boolean;
}

const ZONES: Zone[] = [
    {
        id: 'zone-a',
        name: 'Zone A',
        description: 'Premium larger irregular parcels with scenic views',
        plotsAvailable: 0,
        plotsTotal: 15,
        pricePerPlot: 0,
        priceAfterJuly2026: 0,
        color: '#6b7280',
        position: [-8, 0.1, 6],
        bounds: { min: [-12, 2], max: [-4, 10] },
        features: ['Larger plots', 'Scenic views', 'Coming soon'],
        isOnOffer: false,
    },
    {
        id: 'zone-b',
        name: 'Zone B',
        description: 'Premium medium parcels with excellent investment potential',
        plotsAvailable: 30,
        plotsTotal: 30,
        pricePerPlot: 1000000,
        priceAfterJuly2026: 1200000,
        color: '#f97316',
        position: [0, 0.1, 6],
        bounds: { min: [-4, 2], max: [4, 10] },
        features: ['30 plots available', 'KES 1,000,000 per plot', 'Prime location', 'Investment ready'],
        isOnOffer: true,
    },
    {
        id: 'zone-c',
        name: 'Zone C',
        description: 'Large-scale development with 70 plots for immediate purchase',
        plotsAvailable: 70,
        plotsTotal: 70,
        pricePerPlot: 750000,
        priceAfterJuly2026: 850000,
        color: '#14b8a6',
        position: [0, 0.1, -4],
        bounds: { min: [-6, -10], max: [6, 2] },
        features: ['70 plots available', 'KES 750,000 + tax & conveyance', 'Best value', 'Family-friendly'],
        isOnOffer: true,
    },
    {
        id: 'school',
        name: 'School Zone',
        description: 'Dedicated educational facility for the community',
        plotsAvailable: 0,
        plotsTotal: 1,
        pricePerPlot: 0,
        priceAfterJuly2026: 0,
        color: '#8b5cf6',
        position: [10, 0.1, 0],
        bounds: { min: [6, -4], max: [14, 4] },
        features: ['Modern school', 'Sports facilities', 'Community hub'],
        isOnOffer: false,
    },
    {
        id: 'nursery',
        name: 'Nursery Zone',
        description: 'Green nursery and landscaping area',
        plotsAvailable: 0,
        plotsTotal: 1,
        pricePerPlot: 0,
        priceAfterJuly2026: 0,
        color: '#22c55e',
        position: [10, 0.1, -8],
        bounds: { min: [6, -12], max: [14, -4] },
        features: ['Plant nursery', 'Landscaping', 'Green spaces'],
        isOnOffer: false,
    },
    {
        id: 'extension',
        name: 'Extension Area',
        description: 'Future development with riverfront views',
        plotsAvailable: 0,
        plotsTotal: 14,
        pricePerPlot: 0,
        priceAfterJuly2026: 0,
        color: '#64748b',
        position: [-10, 0.1, -8],
        bounds: { min: [-16, -14], max: [-4, -2] },
        features: ['River access', 'Natural terrain', 'Future development'],
        isOnOffer: false,
    },
];

// ============================================
// DYNAMIC 3D SCENE IMPORT
// ============================================

const Scene3D = dynamic(() => import('@/components/tour/Scene3D'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading 3D Experience...</p>
            </div>
        </div>
    ),
});

// ============================================
// RESERVATION MODAL
// ============================================

function ReservationModal({
    isOpen,
    onClose,
    selectedZone,
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedZone: Zone | null;
}) {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
            setFormData({ name: '', email: '', phone: '', message: '' });
        }, 2000);
    };

    const plotPrice = selectedZone?.pricePerPlot || 0;
    const deposit = plotPrice * 0.1;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-gray-900 border-white/10 text-white">
                {isSuccess ? (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Reservation Request Sent!</h3>
                        <p className="text-gray-400">Our team will contact you within 24 hours.</p>
                    </motion.div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                Reserve Your Plot
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                {selectedZone && `Zone ${selectedZone.name}`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-white/5 rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400">Plot Price</span>
                                <span className="text-white font-semibold">KES {plotPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400">10% Deposit to Reserve</span>
                                <span className="text-teal-400 font-bold">KES {deposit.toLocaleString()}</span>
                            </div>
                            {selectedZone && selectedZone.priceAfterJuly2026 > selectedZone.pricePerPlot && (
                                <div className="bg-green-500/20 rounded-lg p-2 mt-2">
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                        <Check className="w-4 h-4" />
                                        <span>You save KES {(selectedZone.priceAfterJuly2026 - selectedZone.pricePerPlot).toLocaleString()} by reserving now!</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-gray-300">Full Name *</Label>
                                <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="John Doe" />
                            </div>
                            <div>
                                <Label htmlFor="phone" className="text-gray-300">Phone Number *</Label>
                                <Input id="phone" required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="+254 7XX XXX XXX" />
                            </div>
                            <div>
                                <Label htmlFor="email" className="text-gray-300">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="john@example.com" />
                            </div>
                            <div>
                                <Label htmlFor="message" className="text-gray-300">Message (Optional)</Label>
                                <Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Any specific requirements?" rows={3} />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-6">
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-4 h-4 mr-2" />
                                        Reserve Now with 10% Deposit
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            By submitting, you agree to be contacted by the RDG Team
                        </p>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// NAVIGATION
// ============================================

function Navigation({ activeZone, onZoneSelect }: { activeZone: string | null; onZoneSelect: (zone: string | null) => void }) {
    return (
        <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <a href="/index.html" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                            <ArrowLeft className="w-4 h-4" /> Back to Site
                        </a>
                        <div className="w-px h-6 bg-white/20" />
                        <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Isinya Gardens</h1>
                                <p className="text-xs text-gray-400">3D Virtual Tour</p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        <motion.button onClick={() => onZoneSelect(null)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeZone === null ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            Overview
                        </motion.button>
                        {ZONES.filter(z => z.isOnOffer).map((zone) => (
                            <motion.button key={zone.id} onClick={() => onZoneSelect(zone.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeZone === zone.id ? 'text-white' : 'bg-white/10 text-white hover:bg-white/20'}`} style={{ backgroundColor: activeZone === zone.id ? zone.color : undefined }}>
                                {zone.name}
                                <span className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">ON OFFER</span>
                            </motion.button>
                        ))}
                    </div>

                    <motion.a href="tel:+254716575954" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/25">
                        Contact RDG
                    </motion.a>
                </div>
            </div>
        </motion.nav>
    );
}

// ============================================
// TOUR SECTION
// ============================================

function TourSection({ activeZone, onZoneSelect, isAutoRotating, onAutoRotateToggle }: { activeZone: string | null; onZoneSelect: (zone: string | null) => void; isAutoRotating: boolean; onAutoRotateToggle: () => void }) {
    const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

    return (
        <section id="tour-section" className="relative h-screen">
            <div className="absolute inset-0">
                <Scene3D activeZone={activeZone} selectedPlot={selectedPlot} onPlotSelect={setSelectedPlot} isAutoRotating={isAutoRotating} />
            </div>

            <Navigation activeZone={activeZone} onZoneSelect={onZoneSelect} />

            {!activeZone && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-2xl p-6 max-w-2xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Isinya Gardens</h2>
                    <p className="text-gray-300 mb-4">Explore our premium land development in Kajiado County. Click on a zone or plot to learn more.</p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500" /> Zone B - KES 1M</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-teal-500" /> Zone C - KES 750K</span>
                    </div>
                </motion.div>
            )}

            <div className="absolute bottom-20 left-4 z-30">
                <Button variant="secondary" size="sm" onClick={onAutoRotateToggle} className="bg-black/60 backdrop-blur-sm text-white border border-white/10">
                    {isAutoRotating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isAutoRotating ? 'Stop Rotation' : 'Auto Rotate'}
                </Button>
            </div>

            <div className="absolute bottom-20 right-4 z-30 bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h4 className="text-white text-sm font-semibold mb-2">Legend</h4>
                <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" /><span className="text-gray-300">Zone B (KES 1M)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-teal-500" /><span className="text-gray-300">Zone C (KES 750K)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500" /><span className="text-gray-300">School Zone</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-gray-300">Nursery</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-gray-300">River</span></div>
                </div>
            </div>

            <AnimatePresence>
                {selectedPlot && (
                    <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="absolute top-24 left-4 z-30 w-72 bg-black/90 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
                        <div className="p-4 bg-gradient-to-r from-teal-600/30 to-emerald-600/30 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Plot #{selectedPlot.plotNumber}</h3>
                                <button onClick={() => setSelectedPlot(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <Badge className="mt-2" style={{ backgroundColor: selectedPlot.zone === 'B' ? '#f97316' : '#14b8a6', color: 'white' }}>Zone {selectedPlot.zone}</Badge>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="text-white font-semibold">KES {selectedPlot.price?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Size</span><span className="text-white">{selectedPlot.size} acres</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge variant={selectedPlot.status === 'available' ? 'default' : 'secondary'}>{selectedPlot.status === 'available' ? 'Available' : 'Reserved'}</Badge></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

// ============================================
// ZONE DETAIL SECTION
// ============================================

function ZoneDetailSection({ onReserveClick }: { onReserveClick: (zoneId: string) => void }) {
    const offerZones = ZONES.filter(z => z.isOnOffer);
    return (
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                    <Badge className="bg-yellow-500 text-black mb-4"><Sparkles className="w-3 h-3 mr-1" />PLOTS ON OFFER</Badge>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Choose Your Zone</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Two prime zones available with a total of 100 plots. Prices increase after July 2026 — reserve now with just 10% deposit!</p>
                </motion.div>
                <div className="grid md:grid-cols-2 gap-8">
                    {offerZones.map((zone, index) => (
                        <motion.div key={zone.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="relative group">
                            <div className="absolute inset-0 rounded-3xl opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ backgroundColor: zone.color }} />
                            <div className="relative bg-gray-800/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                                <div className="p-8 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${zone.color}40, ${zone.color}20)` }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: zone.color }}>
                                                <Building2 className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{zone.name}</h3>
                                                <p className="text-gray-300 text-sm">{zone.plotsAvailable} plots available</p>
                                            </div>
                                        </div>
                                        {zone.id === 'zone-c' && <Badge className="bg-teal-500 text-white">BEST VALUE</Badge>}
                                    </div>
                                    <p className="text-gray-300">{zone.description}</p>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-sm text-gray-400">Current Price</div>
                                            <div className="text-4xl font-bold text-green-400">KES {zone.pricePerPlot.toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">per plot + tax & conveyance</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">10% Deposit</div>
                                            <div className="text-2xl font-bold text-teal-400">KES {(zone.pricePerPlot * 0.1).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-red-400"><Clock className="w-5 h-5" /><span className="font-medium">After July 2026</span></div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-white">KES {zone.priceAfterJuly2026.toLocaleString()}</div>
                                                <div className="text-sm text-red-400">+KES {(zone.priceAfterJuly2026 - zone.pricePerPlot).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {zone.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                                                <Check className="w-4 h-4 text-green-400" />{feature}
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={() => onReserveClick(zone.id)} className="w-full py-6 text-lg font-semibold rounded-xl shadow-lg" style={{ background: zone.id === 'zone-b' ? 'linear-gradient(to right, #f97316, #ea580c)' : 'linear-gradient(to right, #14b8a6, #10b981)' }}>
                                        Reserve Plot in {zone.name}<ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function TourPage() {
    const [activeZone, setActiveZone] = useState<string | null>(null);
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    const [isReservationOpen, setIsReservationOpen] = useState(false);

    const handleReserveClick = (zoneId: string) => {
        setActiveZone(zoneId);
        setIsReservationOpen(true);
    };

    return (
        <main className="bg-gray-900 min-h-screen overflow-x-hidden">
            <TourSection activeZone={activeZone} onZoneSelect={setActiveZone} isAutoRotating={isAutoRotating} onAutoRotateToggle={() => setIsAutoRotating(!isAutoRotating)} />
            <ZoneDetailSection onReserveClick={handleReserveClick} />

            {/* Floating WhatsApp Button */}
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2 }} className="fixed bottom-6 right-6 z-50">
                <Button asChild className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 shadow-lg shadow-green-500/25">
                    <a href="https://wa.me/254716575954" target="_blank" rel="noopener noreferrer"><MessageCircle className="w-6 h-6" /></a>
                </Button>
            </motion.div>

            <ReservationModal isOpen={isReservationOpen} onClose={() => setIsReservationOpen(false)} selectedZone={ZONES.find(z => z.id === activeZone) || null} />
        </main>
    );
}
