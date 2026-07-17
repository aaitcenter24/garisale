'use client';

import React, { useState, useEffect } from 'react';
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

// BDT Formatter: e.g. "BDT ১৪,৫০,০০০"
function formatBDT(amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  return `BDT ${toBengaliDigits(formatted)}`;
}

export default function DealerOSDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [email, setEmail] = useState('owner@dhakamotors.com');
  const [password, setPassword] = useState('password123');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'leads' | 'deals' | 'more'>('dashboard');
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');

  // Global Quality States
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // Toast notifications array
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'error' ? 5000 : 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    addToast('success', 'সফলভাবে লগইন হয়েছে');
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    addToast('info', 'সফলভাবে লগআউট করা হয়েছে');
  };

  // Stat Counter Animation Simulation
  const [countVal, setCountVal] = useState(0);
  useEffect(() => {
    if (isLoggedIn && !loading && !apiFailed) {
      let start = 0;
      const end = 23;
      const duration = 800; // ms
      const stepTime = Math.abs(Math.floor(duration / end));
      const timer = setInterval(() => {
        start += 1;
        setCountVal(start);
        if (start >= end) clearInterval(timer);
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn, loading, apiFailed]);

  // RENDER STATE 1: Light Theme Login Panel
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] p-8 rounded-2xl shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-[24px] font-bold tracking-tight text-[#111827] font-outfit">
              GariSale <span className="text-[#2563EB]">Dealer OS</span>
            </h1>
            <p className="text-[12px] text-[#6B7280] font-sans font-normal">ডিজিটাল শোরুম ম্যানেজমেন্ট সিস্টেম</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[12px] font-sans font-semibold text-[#6B7280]">ইমেইল অ্যাড্রেস</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-sans font-semibold text-[#6B7280]">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-[14px] shadow-sm mt-2"
            >
              ডিলার ওএস-এ লগইন করুন
            </button>
          </form>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <span className="block text-[12px] font-sans font-semibold text-[#6B7280] uppercase tracking-wider">Demo Credentials</span>
            <div className="grid grid-cols-2 gap-2 text-[12px] text-[#111827] font-semibold">
              <button 
                onClick={() => { setEmail('owner@dhakamotors.com'); setPassword('password123'); }}
                className="bg-white border border-gray-300 py-1.5 rounded-lg hover:bg-gray-50 text-left px-2"
              >
                🔑 Owner
              </button>
              <button 
                onClick={() => { setEmail('sales@dhakamotors.com'); setPassword('password123'); }}
                className="bg-white border border-gray-300 py-1.5 rounded-lg hover:bg-gray-50 text-left px-2"
              >
                🔑 Salesperson
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Impersonation alert & Role switcher */}
      <div className="bg-slate-900 text-white px-4 py-2.5 text-[12px] font-sans flex flex-col sm:flex-row justify-between items-center z-50 gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-400">warning</span>
          <span className="font-semibold text-slate-200">শোরুম: <strong className="text-white">Dhaka Premium Motors</strong></span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="bg-[#2563EB] text-white px-2 py-0.5 rounded text-[10px] font-bold">রোল: {role}</span>
        </div>

        {/* Interactive Dev Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">রোল পরিবর্তন:</span>
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            {['Owner', 'Manager', 'Salesperson'].map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r as any); addToast('info', `রোল পরিবর্তন করে ${r} করা হয়েছে`); }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${role === r ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                {r === 'Owner' ? 'Owner' : r === 'Manager' ? 'Manager' : 'Sales'}
              </button>
            ))}
          </div>

          <span className="text-slate-600">|</span>

          {/* Load/Error/Empty State Simulators */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => { setLoading(prev => !prev); setApiFailed(false); setIsEmpty(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${loading ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              🔄 Loading
            </button>
            <button 
              onClick={() => { setApiFailed(prev => !prev); setLoading(false); setIsEmpty(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${apiFailed ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              ⚠️ Error
            </button>
            <button 
              onClick={() => { setIsEmpty(prev => !prev); setLoading(false); setApiFailed(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isEmpty ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              📦 Empty
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR (width 240px, fixed, white) */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[12px] text-[#6B7280] font-sans font-normal truncate">Dhaka Premium Motors</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: '🏠 ড্যাশবোর্ড', path: '/dashboard' },
                { id: 'inventory', label: '🚗 ইনভেন্টরি', path: '/dashboard/inventory' },
                { id: 'leads', label: '👥 লিড (CRM)', path: '/dashboard/leads' },
                { id: 'deals', label: '🤝 ডিল', path: '/dashboard/deals' },
                { id: 'analytics', label: '📊 Analytics', path: '/dashboard/analytics' },
                { id: 'automation', label: '🤖 Automation Hub', path: '/dashboard/automation' },
                { id: 'website', label: '🌐 Website', path: '/dashboard/website' },
                { id: 'settings', label: '⚙️ Settings', path: '/dashboard/settings' }
              ].map((item) => {
                const isActive = item.id === 'dashboard';
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg text-[12px] font-sans font-semibold transition-all ${
                      isActive 
                        ? 'bg-[#2563EB] text-white shadow-sm' 
                        : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111827] bg-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="border border-[#2563EB] text-[#2563EB] bg-blue-50/50 text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Starter Plan
              </span>
              <button 
                onClick={() => addToast('info', 'আপগ্রেড রিকোয়েস্ট পাঠানো হয়েছে')}
                className="text-[12px] font-sans font-semibold text-[#2563EB] hover:underline"
              >
                আপগ্রেড করুন
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[12px] font-sans font-semibold text-gray-500 bg-gray-50 p-1.5 rounded-lg border">
              <span>ভাষা:</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setLang('EN')} 
                  className={`px-1.5 py-0.5 rounded ${lang === 'EN' ? 'bg-[#2563EB] text-white' : 'hover:bg-gray-200'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang('BN')} 
                  className={`px-1.5 py-0.5 rounded ${lang === 'BN' ? 'bg-[#2563EB] text-white' : 'hover:bg-gray-200'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-[#111827] flex items-center justify-center font-bold text-xs">
                TR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">তানভীর রহমান</p>
                <span className="text-[12px] font-sans font-normal text-[#6B7280] block">Owner</span>
              </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-11 border border-[#E5E7EB] text-red-600 hover:bg-red-50 rounded-lg text-[12px] font-sans font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              লগআউট
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-4 w-96">
              <span className="material-symbols-outlined text-[#6B7280] text-[20px]">search</span>
              <input
                type="text"
                placeholder="গাড়ি, লিড অথবা ডিল খুঁজুন..."
                className="w-full text-[12px] font-sans font-normal focus:outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => addToast('info', 'কোনো নতুন নোটিফিকেশন নেই')}
                className="relative text-[#6B7280] hover:text-[#111827] p-2"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-[12px] font-sans font-semibold text-[#111827]">Dhaka Premium Motors</span>
            </div>
          </header>

          <main className="p-4 md:p-5 space-y-6 md:space-y-8 flex-1 bg-[#F9FAFB]">
            
            {/* Page Title with fade-in animation */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-1"
            >
              <h1 className="text-[24px] font-bold text-[#111827] font-outfit">
                শুভ সকাল, {user.name}! 👋
              </h1>
              <p className="text-[12px] text-[#6B7280] font-sans font-normal">আজ সকাল ১০টা ৩০ মিনিট</p>
            </motion.div>

            {/* Dynamic Rendering: Loading vs Error vs Empty vs Content */}
            <AnimatePresence mode="wait">
              {loading ? (
                // SKELETON LOADER
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 md:space-y-8"
                >
                  <div className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                  <div className="h-20 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="h-48 bg-gray-200 animate-pulse rounded-2xl" />
                </motion.div>
              ) : apiFailed ? (
                // RED ERROR ALERT
                <motion.div 
                  key="error"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-red-50 border border-red-200 p-5 rounded-2xl shadow-sm text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <span className="material-symbols-outlined text-[24px]">error</span>
                  </div>
                  <h3 className="text-[16px] font-sans font-semibold text-red-900">ডেটা লোড হয়নি</h3>
                  <button 
                    onClick={() => { setLoading(true); setApiFailed(false); setTimeout(() => setLoading(false), 1000); }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-[12px] font-sans font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                  >
                    আবার চেষ্টা করুন
                  </button>
                </motion.div>
              ) : isEmpty ? (
                // EMPTY STATE ILLUSTRATION
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border rounded-2xl p-6 text-center space-y-4 shadow-sm"
                >
                  {/* Automotive illustration SVG */}
                  <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <h3 className="text-[16px] font-sans font-semibold text-gray-900">কোনো তথ্য খুঁজে পাওয়া যায়নি</h3>
                  <p className="text-[12px] text-gray-500 font-sans font-normal max-w-sm mx-auto">
                    আপনার শোরুমের ডাটাবেজে বর্তমানে কোনো অ্যাক্টিভিটি নেই। একটি লিস্টিং তৈরি করুন বা নতুন লিড যোগ করুন।
                  </p>
                  <button 
                    onClick={() => setIsEmpty(false)}
                    className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-[12px] font-sans font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  >
                    ডিফল্ট ডেটা ফেরত আনুন
                  </button>
                </motion.div>
              ) : (
                // NORMAL HIGH FIDELITY DASHBOARD VIEW
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 md:space-y-8"
                >
                  
                  {/* Morning Briefing card */}
                  <div className="bg-[#EFF6FF] border-l-4 border-[#2563EB] p-4 md:p-5 rounded-r-2xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-[#2563EB]">
                      <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
                      <h3 className="text-[16px] font-sans font-semibold uppercase tracking-wider">আজকের মর্নিং ব্রিফিং</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px] font-sans font-normal text-[#374151]">
                      <div>
                        <span className="text-[#6B7280] block text-[12px] font-sans font-normal uppercase">গতকালকের অর্জন</span>
                        <p className="mt-1 font-semibold text-[#111827]">
                          {toBengaliDigits(2)} টি বিক্রি · {role === 'Salesperson' ? (
                            <span className="text-gray-400 underline cursor-help" title="Owner শুধু দেখতে পারবেন">—</span>
                          ) : (
                            formatBDT(2850000)
                          )} রাজস্ব · {toBengaliDigits(7)} নতুন লিড
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block text-[12px] font-sans font-normal uppercase">আজকের জরুরি অ্যাকশন</span>
                        <p className="mt-1 font-semibold text-[#111827]">
                          {toBengaliDigits(3)} টি follow-up · {toBengaliDigits(1)} টি পুরানো গাড়ি
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Grid with stagger fade-in */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { label: 'Available Cars', value: `${toBengaliDigits(countVal)} টি`, icon: 'directions_car', color: 'text-blue-600', hide: false },
                      { label: 'Active Leads', value: `${toBengaliDigits(15)} টি`, icon: 'groups', color: 'text-indigo-600', hide: false },
                      { label: 'Follow-ups Today', value: `${toBengaliDigits(3)} টি`, icon: 'calendar_today', color: 'text-emerald-600', hide: false },
                      { label: 'Pending Deals', value: `${toBengaliDigits(2)} টি`, icon: 'handshake', color: 'text-amber-600', hide: false }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-150">
                        <div className="space-y-1">
                          <span className="block text-[12px] font-sans font-normal text-[#6B7280] uppercase tracking-wider">{stat.label}</span>
                          <span className="block text-[28px] md:text-[32px] font-bold font-outfit text-[#111827] leading-none">{stat.value}</span>
                        </div>
                        <span className={`material-symbols-outlined text-2xl ${stat.color}`}>{stat.icon}</span>
                      </div>
                    ))}
                  </div>

                  {/* Maestro AI Advice */}
                  <div className="bg-white border border-[#2563EB] p-4 md:p-5 rounded-2xl shadow-sm space-y-3 hover:shadow-md transition-all duration-150 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#2563EB]">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                        <h4 className="text-[16px] font-sans font-semibold uppercase tracking-wider">💡 Maestro-র পরামর্শ</h4>
                      </div>
                      <span className="bg-blue-50 text-[#2563EB] border border-blue-100 text-[12px] font-sans font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        DEMAND
                      </span>
                    </div>
                    <p className="text-[14px] font-sans font-normal text-[#374151] leading-relaxed max-w-2xl">
                      "Toyota Axio-র বাজারমূল্য চলতি মাসে ঢাকায় ৮% বৃদ্ধি পেয়েছে। আপনার স্টকে ৩টি Toyota Axio রয়েছে। ডিল ক্লিয়ার করার জন্য এখনই বিজ্ঞাপন আপডেট করুন।"
                    </p>
                    <button 
                      onClick={() => addToast('info', 'Maestro এনালাইটিক্স লোড করা হচ্ছে')}
                      className="text-[12px] font-sans font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      এখনই দেখুন →
                    </button>
                  </div>

                  {/* Urgent Aging Stock Warning Card */}
                  <div className="bg-red-50 border border-red-200 p-4 md:p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="material-symbols-outlined text-red-600 text-[20px]">warning</span>
                      <span className="text-[14px] font-sans font-normal">🚨 জরুরি: SK-202501-0012 লটে ৯২ দিন ধরে আছে</span>
                    </div>
                    <Link 
                      href="/dashboard/inventory" 
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-[12px] font-sans font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                    >
                      ব্যবস্থা নিন
                    </Link>
                  </div>

                  {/* Recent Activity Feed */}
                  <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 md:p-5 space-y-4">
                    <h3 className="text-[16px] font-sans font-semibold text-[#111827] uppercase tracking-wider border-b pb-3">সাম্প্রতিক অ্যাক্টিভিটি</h3>
                    <div className="relative border-l border-gray-100 ml-3 space-y-5 py-2">
                      {[
                        { time: '১০ মিনিট আগে', desc: 'New lead: Rafiq Hasan → Toyota Axio (Marketplace)', icon: 'groups', color: 'bg-blue-500' },
                        { time: '২৫ মিনিট আগে', desc: 'Deal SK-0022 approved by Manager', icon: 'handshake', color: 'bg-emerald-500' },
                        { time: '৪৫ মিনিট আগে', desc: '2019 Honda Fit price updated', icon: 'sell', color: 'bg-indigo-500' },
                        { time: '২ ঘণ্টা আগে', desc: 'Daily summary report delivered to owner', icon: 'analytics', color: 'bg-purple-500' },
                        { time: '৩ ঘণ্টা আগে', desc: 'New lead: Karim Ullah → Honda Grace', icon: 'groups', color: 'bg-blue-500' }
                      ].map((act, idx) => (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute left-0 top-1 -ml-3 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[#6B7280] shadow-sm border border-gray-200 z-10">
                            <span className="material-symbols-outlined text-[12px]">{act.icon}</span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[14px] font-sans font-normal text-[#374151]">{act.desc}</p>
                            <span className="text-[12px] font-sans font-normal text-[#6B7280] block">{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB NAVIGATION (fixed, white, shadow-top, z-50) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-50 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car', path: '/dashboard/inventory' },
          { id: 'leads', label: 'Leads', icon: 'groups', path: '/dashboard/leads' },
          { id: 'deals', label: 'Deals', icon: 'handshake', path: '/dashboard/deals' },
          { id: 'more', label: 'More', icon: 'menu', path: '/dashboard' }
        ].map((tab) => {
          const isActive = tab.id === 'dashboard';
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
              {t.type === 'error' && (
                <button 
                  onClick={() => addToast('info', 'পুনরায় চেষ্টা করা হচ্ছে...')} 
                  className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase hover:bg-white/30"
                >
                  Retry
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
