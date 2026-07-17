'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

// BDT formatting helper
function formatBDT(amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  return `BDT ${toBengaliDigits(formatted)}`;
}

// Sales trend data (dates in Bangla)
const SALES_TREND_DATA = [
  { date: '১ জানু', units: 1, revenue: 1450000 },
  { date: '৫ জানু', units: 3, revenue: 3800000 },
  { date: '১০ জানু', units: 2, revenue: 2600000 },
  { date: '১৫ জানু', units: 5, revenue: 6850000 },
  { date: '২০ জানু', units: 4, revenue: 5200000 },
  { date: '২৫ জানু', units: 7, revenue: 9800000 },
  { date: '৩০ জানু', units: 12, revenue: 17200000 }
];

// Lead Source donut data
const LEAD_SOURCE_DATA = [
  { name: 'Marketplace', value: 35, color: '#2563EB', count: 24 },
  { name: 'Walk-in', value: 25, color: '#16A34A', count: 17 },
  { name: 'WhatsApp', value: 20, color: '#D97706', count: 13 },
  { name: 'Facebook', value: 15, color: '#DC2626', count: 10 },
  { name: 'Referral', value: 5, color: '#7C3AED', count: 3 }
];

// Funnel data
const LEAD_FUNNEL_DATA = [
  { stage: 'নতুন', count: 67 },
  { stage: 'যোগাযোগ', count: 45 },
  { stage: 'যোগ্যতা', count: 32 },
  { stage: 'টেস্ট ড্রাইভ', count: 18 },
  { stage: 'কোটেশন', count: 15 },
  { stage: 'আলোচনা', count: 13 },
  { stage: 'সম্পন্ন', count: 12 },
  { stage: 'বন্ধ', count: 8 }
];

interface Insight {
  id: string;
  type: string;
  title: string;
  desc: string;
  priority: number;
  data: string;
  ctaText: string;
  link: string;
}

const MOCK_INSIGHTS: Insight[] = [
  { id: '1', type: 'PRICING', title: 'Toyota Axio দাম অপ্টিমাইজেশান', desc: 'SK-202501-0023 Toyota Axio গাড়িটি লটে ৪৫ দিন পার করেছে। বাজারদরের চেয়ে ৩% বেশি দাম থাকায় কাস্টমার এনকোয়ারি কমে গেছে।', priority: 8, data: 'গড় বাজার মূল্য: BDT ১৩,৫০,০০০ (আপনার মূল্য: BDT ১৪,৫০,০০০)', ctaText: 'SK-202501-0023 দেখুন ও দাম সমন্বয় করুন →', link: '/dashboard/inventory' },
  { id: '2', type: 'DEMAND', title: 'SUV ক্যাটাগরির হট ডিমান্ড সতর্কতা', desc: 'গত ১৫ দিনে ঢাকা বিভাগে ৭-সিটার SUV গাড়ির সার্চ ভলিউম ২৫% বৃদ্ধি পেয়েছে।', priority: 9, data: 'ডিমান্ড সূচক: ৮.৫/১০ (কাস্টমার ওয়েটিং লিস্ট: ১২ জন)', ctaText: 'কাস্টমার রিকোয়েস্ট লিস্ট দেখুন →', link: '/dashboard/leads' },
  { id: '3', type: 'CONVERSION', title: 'লিড রেসপন্স সময় কমানোর সুযোগ', desc: 'দুপুরের শিফটে লিড আসার পর রেসপন্স করার গড় সময় ২.৫ ঘণ্টা। এটি ২০ মিনিটের নিচে নামালে কনভার্সন ৩০% বৃদ্ধি পাবে।', priority: 7, data: 'দুপুরের শিফটের গড় রেসপন্স: ২.৪ ঘণ্টা (টার্গেট: < ১৫ মিনিট)', ctaText: 'জরুরি লিড পাইপলাইন দেখুন →', link: '/dashboard/leads?filter=followup_due' },
  { id: '4', type: 'EXPENSE', title: 'রিকনস্ট্রাকশন ব্যয় মনিটরিং', desc: 'এ মাসে এভারেজ কার রিকনস্ট্রাকশন বা ডেন্টিং-পেইন্টিং ব্যয় পূর্ববর্তী মাসের চেয়ে ১৫% বেড়ে গেছে।', priority: 6, data: 'গড় ব্যয় প্রতি গাড়ি: BDT ৪২,০০০ (বিগত মাস: BDT ৩৬,০০০)', ctaText: 'ভেন্ডর বিলিং ও লেজার চেক করুন →', link: '/dashboard/billing' },
  { id: '5', type: 'CONVERSION', title: 'হোয়াটসঅ্যাপ মেসেজ ড্রপ-আউট রেট', desc: 'প্রথম মেসেজ পাঠানোর পর কাস্টমারের রেসপন্স না পাওয়ার অন্যতম কারণ টেমপ্লেটের ধরণ। কাস্টমাইজড মেসেজ ট্রাই করুন।', priority: 5, data: 'মেসেজ ডেলিভারি রেট: ৯৮% (ড্রপ-আউট রেট: ৩৫%)', ctaText: 'মার্কেটিং মেসেজ টেমপ্লেট পরিবর্তন করুন →', link: '/dashboard/automation' }
];

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month' | 'last_month' | 'custom'>('month');

  // Date Range Pickers (for custom period)
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-17');

  // Developer role togglers
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');
  const [loading, setLoading] = useState(false);
  const [isEmptyInsights, setIsEmptyInsights] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Staff Performance mock data list
  const staffData = [
    { name: 'তানভীর রহমান', role: 'Owner', leads: 24, deals: 5, conv: 20.8, response: '১.২ ঘণ্টা', revenue: 6850000, current: true },
    { name: 'সালমান খান', role: 'Salesperson', leads: 18, deals: 3, conv: 16.6, response: '১.৮ ঘণ্টা', revenue: 4200000, current: false },
    { name: 'মিজানুর রহমান', role: 'Salesperson', leads: 15, deals: 2, conv: 13.3, response: '২.৪ ঘণ্টা', revenue: 2600000, current: false },
    { name: 'ফারজানা ববি', role: 'Salesperson', leads: 10, deals: 2, conv: 20.0, response: '০.৯ ঘণ্টা', revenue: 3550000, current: false }
  ];

  // RBAC Access Filters
  const visibleStaffRows = useMemo(() => {
    if (role === 'Salesperson') {
      // Salesperson sees only their own data
      return staffData.filter(s => s.name === 'সালমান খান' || s.role === 'Salesperson' && s.name === 'সালমান খান');
    }
    return staffData;
  }, [role]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-24 md:pb-0">
      
      {/* Dev Switcher Bar */}
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
              onClick={() => { setLoading(prev => !prev); setIsEmptyInsights(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${loading ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              🔄 Loading
            </button>
            <button 
              onClick={() => { setIsEmptyInsights(prev => !prev); setLoading(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isEmptyInsights ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              Empty Insights
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
                { id: 'inventory', label: '🚗 ইনভেন্টরি', path: '/dashboard/inventory' },
                { id: 'leads', label: '👥 লিড (CRM)', path: '/dashboard/leads' },
                { id: 'deals', label: '🤝 ডিল', path: '/dashboard/deals' },
                { id: 'analytics', label: '📊 Analytics', path: '/dashboard/analytics', active: true },
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

        {/* WORKSPACE CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <h1 className="text-[24px] font-bold text-[#111827] font-outfit">Analytics & Insights</h1>
            
            {/* Period selector pill tabs */}
            <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-[12px] font-sans font-bold">
              {[
                { id: 'today', label: 'আজ' },
                { id: 'week', label: 'সপ্তাহ' },
                { id: 'month', label: 'মাস' },
                { id: 'last_month', label: 'গত মাস' },
                { id: 'custom', label: 'কাস্টম' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActivePeriod(tab.id as any); addToast('info', `${tab.label} পিরিয়ড লোড করা হয়েছে`); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activePeriod === tab.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280] hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          {/* Conditional date range pickers for Custom view */}
          {activePeriod === 'custom' && (
            <div className="bg-white border-b px-6 py-3 flex gap-4 items-center justify-start text-xs font-bold animate-in slide-in-from-top-1 text-[#6B7280]">
              <div className="flex items-center gap-2">
                <span>শুরু:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="border rounded p-1 text-black font-semibold"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>শেষ:</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="border rounded p-1 text-black font-semibold"
                />
              </div>
              <button 
                onClick={() => addToast('success', 'কাস্টম ডেটা লোড হয়েছে')}
                className="bg-[#2563EB] text-white px-3 py-1.5 rounded"
              >
                আবেদন করুন
              </button>
            </div>
          )}

          {/* CRM Dashboard Scroll viewport */}
          <main className="p-4 md:p-5 space-y-6 md:space-y-8 flex-1 bg-[#F9FAFB] overflow-y-auto">

            <AnimatePresence mode="wait">
              {loading ? (
                // SKELETON PREVIEW
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 md:space-y-8"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                  <div className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    <div className="h-56 bg-gray-200 rounded-2xl" />
                    <div className="h-56 bg-gray-200 rounded-2xl" />
                  </div>
                  <div className="h-44 bg-gray-200 animate-pulse rounded-2xl" />
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 md:space-y-8"
                >
                  
                  {/* KPI CARDS (top row, 4 cards) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-left">
                    
                    {/* Card 1 — Units Sold */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[12px] text-[#6B7280] font-bold font-sans block">বিক্রিত গাড়ি</span>
                        <div className="w-9 h-9 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#16A34A] text-md">
                          🚗
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[32px] font-bold font-outfit text-gray-950 block leading-none">
                          {toBengaliDigits(12)}
                        </span>
                        <span className="text-[13px] text-green-600 font-bold block">
                          ▲ ৩টি বেশি গত মাসের চেয়ে
                        </span>
                      </div>
                    </div>

                    {/* Card 2 — Revenue (OWNER ONLY) */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[12px] text-[#6B7280] font-bold font-sans block">মোট আয়</span>
                        <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-blue-600 text-md">
                          💰
                        </div>
                      </div>
                      <div className="space-y-1">
                        {role === 'Owner' ? (
                          <>
                            <span className="text-[32px] font-bold font-outfit text-green-600 block leading-none">
                              BDT ৯৮L
                            </span>
                            <span className="text-[13px] text-green-600 font-bold block">
                              ▲ ১৫% বেশি
                            </span>
                          </>
                        ) : (
                          <>
                            <span 
                              className="text-[32px] font-bold font-outfit text-gray-400 block leading-none underline cursor-help"
                              title="শুধু Owner দেখতে পাবেন"
                            >
                              —
                            </span>
                            <span className="text-[12px] text-red-500 font-bold block">
                              🔒 শুধু Owner দেখতে পাবেন
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card 3 — New Leads */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[12px] text-[#6B7280] font-bold font-sans block">নতুন লিড</span>
                        <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-md">
                          👥
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[32px] font-bold font-outfit text-gray-950 block leading-none">
                          {toBengaliDigits(67)}
                        </span>
                        <span className="text-[13px] text-green-600 font-bold block">
                          ▲ ১২টি বেশি
                        </span>
                      </div>
                    </div>

                    {/* Card 4 — Conversion Rate */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[12px] text-[#6B7280] font-bold font-sans block">রূপান্তর হার (CR)</span>
                        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-md">
                          📈
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[32px] font-bold font-outfit text-indigo-600 block leading-none">
                          {toBengaliDigits('১৭.৯')}%
                        </span>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#2563EB] h-full" style={{ width: '17.9%' }} />
                        </div>
                        <span className="text-[11px] text-gray-500 font-sans font-normal block leading-none">
                          ১০০ লিডে ১৮টি ডিল
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* CHARTS SECTION */}
                  {mounted && (
                    <div className="space-y-6 text-left">
                      
                      {/* Chart 1 — Sales Trend */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-[16px] text-gray-950 font-sans">বিক্রির ট্রেন্ড</h3>
                          <p className="text-[12px] text-[#6B7280] font-sans font-normal">গত ৩০ দিনে ১২টি গাড়ি বিক্রি</p>
                        </div>
                        
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSalesRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                              <YAxis tick={{ fontSize: 9 }} />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 text-[11px] font-sans font-semibold space-y-1">
                                        <p className="text-slate-300">{data.date}</p>
                                        <p>গাড়ি বিক্রি: {toBengaliDigits(data.units)}টি</p>
                                        {role === 'Owner' && (
                                          <p className="text-emerald-400">রাজস্ব: {formatBDT(data.revenue)}</p>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area type="monotone" dataKey="units" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorSalesRev)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Side by side Charts (stacked mobile) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Donut Chart: Lead Source */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                          <h3 className="font-bold text-[14px] text-gray-950 font-sans">লিডের উৎস</h3>
                          
                          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 h-60">
                            {/* Donut graphic */}
                            <div className="relative w-40 h-40 shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={LEAD_SOURCE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={52}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {LEAD_SOURCE_DATA.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <span className="text-[18px] font-bold text-gray-900 font-sans">মোট ৬৭</span>
                                <span className="text-[9px] text-gray-400 font-bold mt-1">কাস্টমার লিড</span>
                              </div>
                            </div>

                            {/* Donut Legends (2 column) */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans font-semibold flex-1">
                              {LEAD_SOURCE_DATA.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                  <div className="min-w-0">
                                    <span className="text-gray-500 block truncate">{item.name}</span>
                                    <span className="text-[#111827] block font-bold">{toBengaliDigits(item.count)}টি ({toBengaliDigits(item.value)}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Horizontal Funnel */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                          <h3 className="font-bold text-[14px] text-gray-950 font-sans">লিড ফানেল অবস্থান</h3>
                          
                          <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={LEAD_FUNNEL_DATA} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <XAxis type="number" tick={{ fontSize: 9 }} />
                                <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={70} />
                                <Tooltip contentStyle={{ fontSize: 10 }} />
                                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={10} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* STAFF PERFORMANCE TABLE */}
                  {role !== 'Salesperson' ? (
                    <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden text-left">
                      <div className="p-4 border-b border-gray-100 bg-[#F9FAFB]">
                        <h3 className="font-bold text-[14px] text-gray-950 font-sans">স্টাফ পারফরম্যান্স</h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px] font-sans font-semibold">
                          <thead>
                            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[11px] font-bold">
                              <th className="p-4">কর্মচারী</th>
                              <th className="p-4">লিড</th>
                              <th className="p-4 text-center">ডিল</th>
                              <th className="p-4 text-center">রূপান্তর %</th>
                              <th className="p-4 text-center">গড় সাড়া দেওয়ার সময়</th>
                              <th className="p-4 text-right">আয়*</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {visibleStaffRows.map((staff, idx) => (
                              <tr key={idx} className="hover:bg-[#F9FAFB] h-14">
                                <td className="p-4 flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <span className="block font-bold text-[#111827]">{staff.name}</span>
                                    {staff.current && (
                                      <span className="bg-[#EFF6FF] text-[#2563EB] text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-150 mt-0.5 inline-block">
                                        আমার পারফরম্যান্স
                                      </span>
                                    )}
                                  </div>
                                </td>
                                
                                {/* Leads count + Sparkline simulation */}
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <span>{toBengaliDigits(staff.leads)}</span>
                                    {/* Tiny sparkline container */}
                                    <div className="w-12 h-4 flex items-end gap-0.5 shrink-0">
                                      <div className="w-2 bg-blue-400" style={{ height: '30%' }} />
                                      <div className="w-2 bg-blue-500" style={{ height: '60%' }} />
                                      <div className="w-2 bg-blue-600" style={{ height: '40%' }} />
                                      <div className="w-2 bg-[#2563EB]" style={{ height: '90%' }} />
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4 text-center font-bold text-[#111827]">
                                  {toBengaliDigits(staff.deals)}টি
                                </td>
                                
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-12 bg-gray-100 h-2 rounded-full overflow-hidden shrink-0">
                                      <div className="bg-[#16A34A] h-full" style={{ width: `${staff.conv}%` }} />
                                    </div>
                                    <span className="text-[11px]">{toBengaliDigits(staff.conv)}%</span>
                                  </div>
                                </td>

                                <td className="p-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    staff.response.includes('১.') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                    {staff.response}
                                  </span>
                                </td>

                                <td className="p-4 text-right font-bold text-[#16A34A]">
                                  {role === 'Owner' ? (
                                    formatBDT(staff.revenue)
                                  ) : (
                                    <span className="text-gray-400 underline cursor-help" title="শুধু Owner দেখতে পাবেন">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ) : (
                    // Salesperson view sees only their own stats card
                    <section className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm text-left space-y-3">
                      <h4 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">আমার পারফরম্যান্স</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <span className="text-[11px] text-[#6B7280] block">আমার লিড</span>
                          <span className="text-lg font-bold text-gray-900 block mt-1">{toBengaliDigits(18)}টি</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <span className="text-[11px] text-[#6B7280] block">আমার ডিল</span>
                          <span className="text-lg font-bold text-gray-900 block mt-1">{toBengaliDigits(3)}টি</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <span className="text-[11px] text-[#6B7280] block">কনভার্সন</span>
                          <span className="text-lg font-bold text-[#16A34A] block mt-1">{toBengaliDigits('16.6')}%</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* MAESTRO AI INSIGHTS PANEL */}
                  <section className="space-y-4 text-left">
                    <div className="flex justify-between items-end pl-2 border-l-3 border-[#2563EB]">
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-[16px] text-gray-950 font-sans">💡 Maestro AI Insights</h3>
                        <p className="text-[12px] text-[#6B7280] font-sans font-normal">নিয়মিত রাত ২টায় আপডেট হয়</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence>
                        {isEmptyInsights ? (
                          <motion.div 
                            key="empty-insights"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white p-6 rounded-2xl border border-dashed text-center text-gray-500 font-semibold"
                          >
                            <p>✅ আজ কোনো জরুরি পরামর্শ নেই</p>
                            <p className="text-[11px] text-gray-400 font-sans font-normal mt-1">পরবর্তী Maestro বিশ্লেষণ আগামীকাল রাত ২টায়</p>
                          </motion.div>
                        ) : (
                          MOCK_INSIGHTS.map((item) => (
                            <motion.div 
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <span className="bg-[#EFF6FF] text-[#2563EB] text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full border border-blue-150 uppercase tracking-wider">
                                  {item.type}
                                </span>
                                <span className="text-[12px] text-[#DC2626] font-bold font-sans">
                                  Priority: {toBengaliDigits(item.priority)}/১০
                                </span>
                              </div>

                              <p className="text-[14px] text-[#374151] font-sans font-medium leading-relaxed">
                                {item.desc}
                              </p>

                              {/* Supporting raw details */}
                              <div className="bg-[#F9FAFB] border p-3 rounded-lg text-[12px] font-sans font-semibold text-[#6B7280]">
                                {item.data}
                              </div>

                              {/* Action deep-link */}
                              <Link 
                                href={item.link}
                                className="w-full h-11 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center min-h-[44px]"
                              >
                                {item.ctaText}
                              </Link>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* TOAST SYSTEM */}
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
