'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

// BDT Price Formatter: e.g. "BDT ১৪,৫০,০০০"
function formatBDT(amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  return `BDT ${toBengaliDigits(formatted)}`;
}

interface Vehicle {
  id: string;
  stockNo: string;
  title: string;
  grade: string;
  color: string;
  transmission: string;
  price: number;
  status: 'Available' | 'In Recon' | 'Reserved' | 'Sold';
  daysOnLot: number;
  syncStatus: 'Synced' | 'Syncing' | 'Sync Error';
  imvRating: 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced';
  photo: string;
  photoCount: number;
}

const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', stockNo: 'SK-202501-0034', title: 'Toyota Axio', grade: 'G Grade', color: 'Pearl White', transmission: 'Automatic', price: 1450000, status: 'Available', daysOnLot: 15, syncStatus: 'Synced', imvRating: 'great_deal', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', photoCount: 8 },
  { id: '2', stockNo: 'SK-202501-0035', title: 'Honda Fit', grade: 'L Package', color: 'Midnight Black', transmission: 'Automatic', price: 1280000, status: 'In Recon', daysOnLot: 5, syncStatus: 'Syncing', imvRating: 'good_deal', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', photoCount: 12 },
  { id: '3', stockNo: 'SK-202501-0036', title: 'Toyota Premio', grade: 'F EX', color: 'Silver Metallic', transmission: 'Automatic', price: 2150000, status: 'Reserved', daysOnLot: 52, syncStatus: 'Synced', imvRating: 'fair_price', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', photoCount: 6 },
  { id: '4', stockNo: 'SK-202501-0037', title: 'Nissan X-Trail', grade: 'Xi Hybrid', color: 'Dark Blue', transmission: 'Automatic', price: 2900000, status: 'Sold', daysOnLot: 95, syncStatus: 'Synced', imvRating: 'great_deal', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', photoCount: 15 },
  { id: '5', stockNo: 'SK-202501-0038', title: 'Toyota Corolla', grade: 'WxB', color: 'White Pearl', transmission: 'Automatic', price: 1620000, status: 'Available', daysOnLot: 48, syncStatus: 'Sync Error', imvRating: 'fair_price', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', photoCount: 9 }
];

export default function InventoryListPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Available' | 'In Recon' | 'Reserved' | 'Sold' | 'Aging'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected items for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Developer states
  const [loading, setLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.status === 'Available').length;
    const recon = vehicles.filter(v => v.status === 'In Recon').length;
    const reserved = vehicles.filter(v => v.status === 'Reserved').length;
    const sold = vehicles.filter(v => v.status === 'Sold').length;
    const aging = vehicles.filter(v => v.daysOnLot >= 45).length;
    return { total, available, recon, reserved, sold, aging };
  }, [vehicles]);

  // Filter & Search Logic
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Status filter
    if (activeFilter === 'Available') {
      result = result.filter(v => v.status === 'Available');
    } else if (activeFilter === 'In Recon') {
      result = result.filter(v => v.status === 'In Recon');
    } else if (activeFilter === 'Reserved') {
      result = result.filter(v => v.status === 'Reserved');
    } else if (activeFilter === 'Sold') {
      result = result.filter(v => v.status === 'Sold');
    } else if (activeFilter === 'Aging') {
      result = result.filter(v => v.daysOnLot >= 45);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.stockNo.toLowerCase().includes(q) ||
        v.grade.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vehicles, activeFilter, searchQuery]);

  const handleSyncNow = (id: string) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, syncStatus: 'Syncing' } : v));
    addToast('info', 'মার্কেটপ্লেস সিঙ্ক শুরু হয়েছে...');
    setTimeout(() => {
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, syncStatus: 'Synced' } : v));
      addToast('success', 'মার্কেটপ্লেস সিঙ্ক সম্পন্ন হয়েছে');
    }, 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই গাড়িটি ইনভেন্টরি থেকে ডিলিট করতে চান?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      addToast('error', 'গাড়িটি ডিলিট করা হয়েছে');
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`আপনি কি নিশ্চিত যে নির্বাচিত ${selectedIds.length}টি গাড়ি মুছে ফেলতে চান?`)) {
      setVehicles(prev => prev.filter(v => !selectedIds.includes(v.id)));
      setSelectedIds([]);
      addToast('error', 'নির্বাচিত গাড়িগুলো মুছে ফেলা হয়েছে');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredVehicles.map(v => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(item => item !== id));
    }
  };

  // Status Badge Config
  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'Available':
        return { text: '#16A34A', bg: '#DCFCE7', label: 'Available' };
      case 'In Recon':
        return { text: '#D97706', bg: '#FEF3C7', label: 'In Recon' };
      case 'Reserved':
        return { text: '#2563EB', bg: '#DBEAFE', label: 'Reserved' };
      case 'Sold':
        return { text: '#6B7280', bg: '#F3F4F6', label: 'Sold' };
    }
  };

  // IMV Ratings Badge Config
  const getIMVBadge = (rating: Vehicle['imvRating']) => {
    switch (rating) {
      case 'great_deal':
        return { text: '#16A34A', bg: '#DCFCE7', label: '🟢 Great Deal' };
      case 'good_deal':
        return { text: '#0D9488', bg: '#CCFBF1', label: '🟢 Good Deal' };
      case 'fair_price':
        return { text: '#D97706', bg: '#FEF3C7', label: '🟡 Fair Price' };
      default:
        return { text: '#DC2626', bg: '#FEE2E2', label: '🔴 Overpriced' };
    }
  };

  // Days color helpers
  const getDaysStyle = (days: number) => {
    if (days >= 90) return 'text-red-600 font-extrabold flex items-center gap-1';
    if (days >= 45) return 'text-orange-600 font-bold';
    if (days >= 30) return 'text-amber-500 font-semibold';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-24 md:pb-0">
      
      {/* Dev Impersonation Bar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 text-[12px] font-sans flex flex-col sm:flex-row justify-between items-center z-50 gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-400">warning</span>
          <span className="font-semibold text-slate-200">শোরুম: <strong className="text-white">ঢাকা অটো হাউস</strong></span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="bg-[#2563EB] text-white px-2 py-0.5 rounded text-[10px] font-bold">রোল: {role}</span>
        </div>

        {/* Live Dev Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">রোল:</span>
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            {['Owner', 'Manager', 'Salesperson'].map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r as any); addToast('info', `রোল পরিবর্তন করে ${r} করা হয়েছে`); }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${role === r ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {r === 'Owner' ? 'Owner' : r === 'Manager' ? 'Manager' : 'Sales'}
              </button>
            ))}
          </div>

          <span className="text-slate-600">|</span>

          {/* Skeletons/Empty State Simulators */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => { setLoading(prev => !prev); setIsEmpty(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${loading ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              🔄 Loading
            </button>
            <button 
              onClick={() => { setIsEmpty(prev => !prev); setLoading(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isEmpty ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              📦 Empty
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen z-40">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[12px] text-[#6B7280] font-sans font-normal truncate">ঢাকা অটো হাউস</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: '🏠 ড্যাশবোর্ড', path: '/dashboard' },
                { id: 'inventory', label: '🚗 ইনভেন্টরি', path: '/dashboard/inventory', active: true },
                { id: 'leads', label: '👥 লিড (CRM)', path: '/dashboard/leads' },
                { id: 'deals', label: '🤝 ডিল', path: '/dashboard/deals' },
                { id: 'analytics', label: '📊 Analytics', path: '/dashboard/analytics' },
                { id: 'automation', label: '🤖 Automation Hub', path: '/dashboard/automation' },
                { id: 'website', label: '🌐 Website', path: '/dashboard/website' },
                { id: 'settings', label: '⚙️ Settings', path: '/dashboard/settings' }
              ].map((item) => {
                const isActive = item.active;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[12px] font-sans font-semibold transition-all ${
                      isActive 
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-l-3 border-[#2563EB] shadow-sm' 
                        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-[#111827] flex items-center justify-center font-bold text-xs">
                TR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">তানভীর রহমান</p>
                <span className="text-[10px] text-[#6B7280] font-sans font-normal block">{role}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Page Header */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <div className="text-left">
              <h1 className="text-[24px] font-bold text-[#111827] font-outfit leading-tight">ইনভেন্টরি</h1>
              <p className="text-[12px] text-[#6B7280] font-sans font-normal mt-0.5">
                {toBengaliDigits(stats.total)}টি গাড়ি · {toBengaliDigits(stats.available)}টি available · {toBengaliDigits(stats.recon)}টি recon-এ · {toBengaliDigits(stats.reserved)}টি reserved
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => addToast('info', 'CSV ডেটা এক্সপোর্ট করা হচ্ছে...')}
                className="h-10 px-4 bg-gray-100 border text-[#374151] rounded-lg text-[12px] font-sans font-bold hover:bg-gray-200 active:scale-95 transition-all shadow-sm"
              >
                📊 Export CSV
              </button>
              <Link 
                href="/dashboard/inventory/add"
                className="h-10 px-4 bg-[#2563EB] text-white rounded-lg text-[12px] font-sans font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center justify-center min-h-[44px]"
              >
                + গাড়ি যোগ করুন
              </Link>
            </div>
          </header>

          {/* STATS SUMMARY ROW (Horizontal scroll on mobile) */}
          <div className="bg-white border-b border-gray-150 px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide text-left shrink-0">
            {[
              { label: 'Available', count: stats.available, bg: 'bg-[#F0FDF4] border-emerald-200', text: 'text-[#16A34A]', icon: '🚗', filter: 'Available' },
              { label: 'In Recon', count: stats.recon, bg: 'bg-[#FEF3C7] border-amber-200', text: 'text-amber-600', icon: '🔧', filter: 'In Recon' },
              { label: 'Reserved', count: stats.reserved, bg: 'bg-[#EFF6FF] border-blue-200', text: 'text-[#2563EB]', icon: '🔒', filter: 'Reserved' },
              { label: 'Sold (this month)', count: stats.sold, bg: 'bg-[#F3F4F6] border-gray-200', text: 'text-gray-500', icon: '✅', filter: 'Sold' },
              { label: 'Aging 45+', count: stats.aging, bg: 'bg-[#FEE2E2] border-red-200', text: 'text-red-600', icon: '⚠️', filter: 'Aging' }
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={() => { setActiveFilter(stat.filter as any); addToast('info', `${stat.label} ফিল্টার সক্রিয় করা হয়েছে`); }}
                className={`p-3 rounded-xl border flex flex-col justify-between min-w-[130px] flex-1 shrink-0 active:scale-98 transition-all hover:shadow-sm ${stat.bg}`}
              >
                <span className="text-[12px] font-sans font-semibold text-gray-500">{stat.icon} {stat.label}</span>
                <span className={`text-[24px] font-bold font-outfit mt-2 ${stat.text}`}>
                  {toBengaliDigits(stat.count)}
                </span>
              </button>
            ))}
          </div>

          {/* CRM Main content container */}
          <main className="p-4 md:p-5 space-y-6 flex-1 bg-[#F9FAFB] overflow-y-auto">

            <AnimatePresence mode="wait">
              {loading ? (
                // SKELETON LOADING
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200 flex gap-4 animate-pulse">
                      <div className="w-[88px] h-[66px] bg-gray-200 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="flex gap-2">
                          <div className="h-5 bg-gray-200 rounded-full w-16" />
                          <div className="h-5 bg-gray-200 rounded-full w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : isEmpty ? (
                // EMPTY STATE
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4 shadow-sm"
                >
                  <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-[16px] font-sans font-semibold text-gray-950">আপনার lot খালি আছে</h3>
                  <p className="text-[12px] text-gray-500 font-sans font-normal max-w-sm mx-auto">
                    খুব সহজে ক্যামেরা দিয়ে VIN স্ক্যান করে ১ মিনিটে আপনার ইনভেন্টরিতে প্রথম গাড়ি যুক্ত করুন।
                  </p>
                  <Link 
                    href="/dashboard/inventory/add"
                    className="bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-[12px] font-sans font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm inline-block"
                  >
                    গাড়ি যোগ করুন →
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  
                  {/* Search Bar & Filter tabs */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    {/* Filter tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide text-[12px] font-sans font-bold">
                      {[
                        { id: 'all', label: `সব (${stats.total})` },
                        { id: 'Available', label: `Available (${stats.available})` },
                        { id: 'In Recon', label: `Recon (${stats.recon})` },
                        { id: 'Reserved', label: `Reserved (${stats.reserved})` },
                        { id: 'Sold', label: `Sold (${stats.sold})` }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveFilter(tab.id as any); addToast('info', `${tab.label} ভিউ সচল`); }}
                          className={`px-4 py-2.5 rounded-lg transition-all shrink-0 min-h-[44px] ${
                            activeFilter === tab.id
                              ? 'bg-[#2563EB] text-white shadow-sm'
                              : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-3.5 text-gray-400 text-[18px]">search</span>
                      <input
                        type="text"
                        placeholder="🔍 Stock No., গাড়ির নাম বা মডেল খুঁজুন..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-3 text-[13px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  {filteredVehicles.length === 0 ? (
                    // Filter empty result
                    <div className="bg-white border rounded-2xl p-6 text-center text-gray-500 font-sans">
                      <p className="text-[14px]">এই ফিল্টারে কোনো গাড়ি নেই</p>
                      <button onClick={() => { setActiveFilter('all'); setSearchQuery(''); }} className="text-[#2563EB] font-bold text-[12px] underline mt-2 block mx-auto">
                        সব গাড়ি দেখুন →
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* MOBILE VIEW — Card Stack (< 768px) */}
                      <div className="block md:hidden space-y-2.5">
                        {filteredVehicles.map((car) => {
                          const statusConfig = getStatusBadge(car.status);
                          const imvConfig = getIMVBadge(car.imvRating);
                          const isSelected = selectedIds.includes(car.id);

                          // Aging warning borders
                          let borderClass = 'border-l-3 border-l-transparent';
                          if (car.daysOnLot >= 90) {
                            borderClass = 'border-l-3 border-l-red-500';
                          } else if (car.daysOnLot >= 45) {
                            borderClass = 'border-l-3 border-l-orange-500';
                          }

                          return (
                            <div 
                              key={car.id} 
                              className={`bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col gap-3 relative text-left ${borderClass}`}
                            >
                              {/* Top Row: Photo + Specs details */}
                              <div className="flex gap-3">
                                {/* Photo Container */}
                                <div className="w-[88px] h-[66px] bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 relative">
                                  <img src={car.photo} alt={car.title} className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-extrabold px-1 rounded">
                                    📷 {toBengaliDigits(car.photoCount)}
                                  </span>
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex justify-between items-start">
                                    <span className="text-[11px] text-[#9CA3AF] font-mono leading-none">{car.stockNo}</span>
                                    {car.daysOnLot >= 90 && (
                                      <span className="bg-red-100 text-red-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                                        ⚠️ জরুরি
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-[15px] text-[#111827] truncate">{car.title} {car.grade} 2019</h4>
                                  <p className="text-[16px] text-[#16A34A] font-extrabold leading-none">{formatBDT(car.price)}</p>
                                </div>
                              </div>

                              {/* Bottom Row: badges + sync */}
                              <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-sans font-semibold">
                                  <span 
                                    style={{ color: statusConfig.text, backgroundColor: statusConfig.bg }}
                                    className="px-2.5 py-0.5 rounded-full border border-opacity-30"
                                  >
                                    {statusConfig.label}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full bg-[#F9FAFB] border ${getDaysStyle(car.daysOnLot)}`}>
                                    {toBengaliDigits(car.daysOnLot)} দিন
                                  </span>
                                  <span 
                                    style={{ color: imvConfig.text, backgroundColor: imvConfig.bg }}
                                    className="px-2.5 py-0.5 rounded-full border border-opacity-30"
                                  >
                                    {imvConfig.label}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Sync indicator */}
                                  <span className="text-[12px]">
                                    {car.syncStatus === 'Synced' && '✅'}
                                    {car.syncStatus === 'Syncing' && '🔄'}
                                    {car.syncStatus === 'Sync Error' && '⚠️'}
                                  </span>

                                  {/* Mobile checkbox option */}
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={(e) => handleSelectOne(car.id, e.target.checked)}
                                    className="rounded border-gray-300 text-primary w-4 h-4"
                                  />
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* DESKTOP VIEW — Data Table (>= 768px) */}
                      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
                        <table className="w-full text-left border-collapse text-[13px] font-sans font-semibold">
                          <thead>
                            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[11px] font-bold">
                              <th className="p-4 w-10 text-center">
                                <input 
                                  type="checkbox" 
                                  onChange={handleSelectAll}
                                  checked={selectedIds.length === filteredVehicles.length}
                                  className="rounded border-gray-300 text-[#2563EB] w-4 h-4" 
                                />
                              </th>
                              <th className="p-4">Photo</th>
                              <th className="p-4">Stock No.</th>
                              <th className="p-4">Vehicle</th>
                              <th className="p-4">Price</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-center">Days</th>
                              <th className="p-4 text-center">Sync</th>
                              <th className="p-4">IMV</th>
                              <th className="p-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {filteredVehicles.map((car) => {
                              const statusConfig = getStatusBadge(car.status);
                              const imvConfig = getIMVBadge(car.imvRating);
                              const isSelected = selectedIds.includes(car.id);

                              let rowBorderClass = 'border-l-3 border-l-transparent';
                              if (car.daysOnLot >= 90) {
                                rowBorderClass = 'border-l-3 border-l-red-500';
                              } else if (car.daysOnLot >= 45) {
                                rowBorderClass = 'border-l-3 border-l-orange-500';
                              }

                              return (
                                <tr 
                                  key={car.id} 
                                  className={`h-[72px] hover:bg-[#F9FAFB] transition-colors duration-100 ${rowBorderClass}`}
                                >
                                  <td className="p-4 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      onChange={(e) => handleSelectOne(car.id, e.target.checked)}
                                      className="rounded border-gray-300 text-[#2563EB] w-4 h-4" 
                                    />
                                  </td>
                                  <td className="p-4">
                                    <div className="w-20 h-15 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative shrink-0">
                                      <img src={car.photo} alt={car.title} className="w-full h-full object-cover" />
                                      <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-extrabold px-1 rounded">
                                        📷 {toBengaliDigits(car.photoCount)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono text-gray-400">{car.stockNo}</td>
                                  <td className="p-4">
                                    <span className="block font-bold text-[#111827] text-[14px]">{car.title} 2019</span>
                                    <span className="block text-[12px] text-gray-400 font-sans font-normal mt-0.5">
                                      {car.grade} · {car.color} · {car.transmission}
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-[#16A34A] text-[14px]">
                                    {formatBDT(car.price)}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span 
                                      style={{ color: statusConfig.text, backgroundColor: statusConfig.bg }}
                                      className="px-2.5 py-1 rounded-full text-[11px] font-sans font-bold border border-opacity-30"
                                    >
                                      {statusConfig.label}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center font-bold">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className={getDaysStyle(car.daysOnLot)}>
                                        {car.daysOnLot >= 90 && '⚠️ '}
                                        {toBengaliDigits(car.daysOnLot)} দিন
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    {car.syncStatus === 'Synced' && (
                                      <span className="text-emerald-600 font-extrabold" title="Synced">✅</span>
                                    )}
                                    {car.syncStatus === 'Syncing' && (
                                      <span className="text-blue-600 font-bold block animate-pulse" title="Syncing">🔄</span>
                                    )}
                                    {car.syncStatus === 'Sync Error' && (
                                      <button 
                                        onClick={() => handleSyncNow(car.id)}
                                        className="text-red-500 font-bold hover:underline flex items-center justify-center gap-0.5 mx-auto"
                                        title="Sync Error - Click to Retry"
                                      >
                                        ⚠️ Retry
                                      </button>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <span 
                                      style={{ color: imvConfig.text, backgroundColor: imvConfig.bg }}
                                      className="px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold border border-opacity-30"
                                    >
                                      {imvConfig.label}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 text-[12px] font-sans font-bold">
                                      <Link href={`/dashboard/inventory/edit/${car.id}`} className="text-[#2563EB] hover:underline">
                                        ✏️ Edit
                                      </Link>
                                      <span className="text-gray-200">|</span>
                                      <Link href={`/${car.id}`} className="text-emerald-600 hover:underline">
                                        👁️ View
                                      </Link>
                                      <span className="text-gray-200">|</span>
                                      <button 
                                        onClick={() => handleSyncNow(car.id)}
                                        className="text-indigo-600 hover:underline"
                                      >
                                        🔄 Sync
                                      </button>
                                      <span className="text-gray-200">|</span>
                                      <button 
                                        onClick={() => handleDelete(car.id)} 
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* FLOATING ACTION BAR FOR BULK ACTIONS */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-6 z-40 w-full max-w-lg border border-slate-700"
          >
            <span className="text-[12px] font-sans font-semibold text-slate-300">
              {toBengaliDigits(selectedIds.length)}টি গাড়ি নির্বাচিত
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { addToast('success', 'মার্কেটপ্লেস থেকে রিমুভ করা হয়েছে'); setSelectedIds([]); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-sans font-bold border border-slate-700 active:scale-95 transition-all"
              >
                Marketplace থেকে সরান
              </button>
              <button 
                onClick={() => { addToast('info', 'ডাটা এক্সপোর্ট করা হয়েছে'); setSelectedIds([]); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-sans font-bold border border-slate-700 active:scale-95 transition-all"
              >
                Export
              </button>
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-sans font-bold active:scale-95 transition-all"
              >
                মুছুন
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car', path: '/dashboard/inventory' },
          { id: 'leads', label: 'Leads', icon: 'groups', path: '/dashboard/leads' },
          { id: 'deals', label: 'Deals', icon: 'handshake', path: '/dashboard/deals' },
          { id: 'more', label: 'More', icon: 'menu', path: '/dashboard' }
        ].map((tab) => {
          const isActive = tab.id === 'inventory';
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] transition-all ${
                isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-[9px] font-bold">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* TOAST ALERTS */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 space-y-2 w-80">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`p-3 rounded-lg text-white text-[12px] font-sans font-semibold text-center shadow-lg flex justify-between items-center ${
                t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-[#2563EB]'
              }`}
            >
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
