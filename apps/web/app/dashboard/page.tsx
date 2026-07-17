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

// BDT Price Formatter: e.g. "BDT ১৪,৫০,০০০"
function formatBDT(amount: number): string {
  const formatted = amount.toLocaleString('en-US');
  return `BDT ${toBengaliDigits(formatted)}`;
}

export default function DealerOSDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [email, setEmail] = useState('owner@dhakaautohouse.com');
  const [password, setPassword] = useState('password123');
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');

  // Dev Toggle States
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');
  const [loading, setLoading] = useState(false);
  const [isEmptyLeads, setIsEmptyLeads] = useState(false);
  const [isEmptyVehicles, setIsEmptyVehicles] = useState(false);
  const [showAgingAlert, setShowAgingAlert] = useState(true);

  // Toast Notification System
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
  const [countAvailable, setCountAvailable] = useState(0);
  const [countLeads, setCountLeads] = useState(0);
  const [countFollowups, setCountFollowups] = useState(0);

  useEffect(() => {
    if (isLoggedIn && !loading) {
      let startAvailable = 0;
      let startLeads = 0;
      let startFollowups = 0;

      const timer1 = setInterval(() => {
        startAvailable += 1;
        setCountAvailable(startAvailable);
        if (startAvailable >= 23) clearInterval(timer1);
      }, 30);

      const timer2 = setInterval(() => {
        startLeads += 2;
        setCountLeads(startLeads);
        if (startLeads >= 47) {
          setCountLeads(47);
          clearInterval(timer2);
        }
      }, 20);

      const timer3 = setInterval(() => {
        startFollowups += 1;
        setCountFollowups(startFollowups);
        if (startFollowups >= 8) clearInterval(timer3);
      }, 50);

      return () => {
        clearInterval(timer1);
        clearInterval(timer2);
        clearInterval(timer3);
      };
    }
  }, [isLoggedIn, loading]);

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
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-sans font-semibold text-[#6B7280]">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-[14px] shadow-sm mt-2"
            >
              ডিলার ওএস-এ লগইন করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Dev Impersonation Bar */}
      <div className="bg-slate-900 text-white px-4 py-2 text-[12px] font-sans flex flex-col sm:flex-row justify-between items-center z-50 gap-3 shadow-md">
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
              onClick={() => { setLoading(prev => !prev); setIsEmptyLeads(false); setIsEmptyVehicles(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${loading ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              🔄 Simulate Loading
            </button>
            <button 
              onClick={() => { setIsEmptyLeads(prev => !prev); setIsEmptyVehicles(false); setLoading(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isEmptyLeads ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              Empty Leads
            </button>
            <button 
              onClick={() => { setIsEmptyVehicles(prev => !prev); setIsEmptyLeads(false); setLoading(false); }} 
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isEmptyVehicles ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              Empty Cars
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen z-40">
          <div className="space-y-5">
            {/* Top Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                  G
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold font-outfit text-[#111827] leading-tight truncate">GariSale</h2>
                  <p className="text-[12px] font-sans font-semibold text-[#111827] truncate">ঢাকা অটো হাউস</p>
                </div>
              </div>
              <p className="text-[12px] text-[#6B7280] font-sans font-normal pl-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                ধোলাইখাল, ঢাকা
              </p>
              <div className="h-px bg-gray-200" />
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: '🏠 ড্যাশবোর্ড', path: '/dashboard', count: 0, dotColor: '' },
                { id: 'inventory', label: '🚗 ইনভেন্টরি', path: '/dashboard/inventory', count: 0, dotColor: '' },
                { id: 'leads', label: '👥 লিড (CRM)', path: '/dashboard/leads', count: 47, dotColor: 'bg-red-500' },
                { id: 'deals', label: '🤝 ডিল', path: '/dashboard/deals', count: 0, dotColor: '' },
                { id: 'analytics', label: '📊 Analytics', path: '/dashboard/analytics', count: 0, dotColor: '' },
                { id: 'automation', label: '🤖 Automation Hub', path: '/dashboard/automation', count: 0, dotColor: '' },
                { id: 'website', label: '🌐 Website', path: '/dashboard/website', count: 0, dotColor: '' },
                { id: 'settings', label: '⚙️ Settings', path: '/dashboard/settings', count: 3, dotColor: 'bg-orange-500' }
              ].map((item) => {
                const isActive = item.id === 'dashboard';
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center justify-between h-11 px-3 rounded-xl text-[12px] font-sans font-semibold transition-all ${
                      isActive 
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-l-3 border-[#2563EB] shadow-sm' 
                        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.count > 0 && (
                      <span className={`w-5 h-5 rounded-full ${item.dotColor} text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm`}>
                        {toBengaliDigits(item.count)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom components */}
          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            {/* Plan Progress card */}
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-gray-150 space-y-2">
              <div className="flex justify-between items-center">
                <span className="bg-[#2563EB]/10 text-[#2563EB] text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-150 uppercase tracking-wider">
                  Starter Plan
                </span>
                <Link href="/dashboard/billing" className="text-[11px] font-bold text-[#2563EB] hover:underline">
                  আপগ্রেড
                </Link>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-gray-500">
                  <span>স্টক লিমিট ব্যবহৃত</span>
                  <span>{toBengaliDigits(32)}/{toBengaliDigits(50)} গাড়ি</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '64%' }} />
                </div>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-gray-500 bg-gray-50 p-1 rounded-lg border">
              <span>ভাষা:</span>
              <div className="flex gap-1.5">
                <button onClick={() => setLang('EN')} className={`px-1.5 py-0.5 rounded ${lang === 'EN' ? 'bg-[#2563EB] text-white shadow-sm' : 'hover:bg-gray-200'}`}>EN</button>
                <button onClick={() => setLang('BN')} className={`px-1.5 py-0.5 rounded ${lang === 'BN' ? 'bg-[#2563EB] text-white shadow-sm' : 'hover:bg-gray-200'}`}>বাংলা</button>
              </div>
            </div>

            {/* User Account block */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
                  TR
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">তানভীর রহমান</p>
                  <span className="text-[10px] text-[#6B7280] font-sans font-normal block leading-none">{role}</span>
                </div>
              </div>
              <button onClick={handleSignOut} className="text-gray-400 hover:text-red-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
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
              <button className="relative text-[#6B7280] hover:text-[#111827] p-2">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-[12px] font-sans font-semibold text-[#111827]">ঢাকা অটো হাউস</span>
            </div>
          </header>

          <main className="p-4 md:p-5 space-y-6 md:space-y-8 flex-1 bg-[#F9FAFB] overflow-y-auto">

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
                  <div className="h-44 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                  <div className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="h-56 bg-gray-200 animate-pulse rounded-2xl" />
                </motion.div>
              ) : isEmptyLeads ? (
                // EMPTY LEADS STATE
                <motion.div 
                  key="empty-leads"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center space-y-4 shadow-sm"
                >
                  <svg className="w-20 h-20 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-3H6" />
                  </svg>
                  <h3 className="text-[16px] font-sans font-semibold text-gray-950">এখনো কোনো লিড নেই</h3>
                  <p className="text-[12px] text-gray-500 font-sans font-normal max-w-sm mx-auto">
                    আপনার গাড়ির লিস্টিং পাবলিক মার্কেটপ্লেসে শেয়ার করুন এবং ক্রেতার লিড সংগ্রহ করুন।
                  </p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('https://garisale.com/dhaka-auto-house');
                      addToast('success', 'Marketplace লিংক কপি করা হয়েছে');
                    }}
                    className="bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-[12px] font-sans font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  >
                    Marketplace লিংক কপি করুন
                  </button>
                </motion.div>
              ) : isEmptyVehicles ? (
                // EMPTY VEHICLES STATE
                <motion.div 
                  key="empty-vehicles"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center space-y-4 shadow-sm"
                >
                  <svg className="w-20 h-20 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-[16px] font-sans font-semibold text-gray-950">আপনার প্রথম গাড়ি যোগ করুন</h3>
                  <p className="text-[12px] text-gray-500 font-sans font-normal max-w-sm mx-auto">
                    খুব সহজে ক্যামেরা দিয়ে VIN স্ক্যান করে ১ মিনিটে আপনার ইনভেন্টরিতে গাড়ি যুক্ত করুন।
                  </p>
                  <Link 
                    href="/dashboard/inventory/add"
                    className="bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-[12px] font-sans font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm inline-block"
                  >
                    VIN স্ক্যান করে ১ মিনিটে যোগ করুন
                  </Link>
                </motion.div>
              ) : (
                // NORMAL PORTFOLIO
                <motion.div 
                  key="normal-content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 md:space-y-8"
                >
                  
                  {/* AGING WATCHLIST BANNER (shows if any vehicle 45+ days) */}
                  {showAgingAlert && (
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-red-500">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white text-[28px]">warning</span>
                        <div className="space-y-0.5">
                          <h4 className="text-[14px] font-bold font-sans">SK-202501-0023 • Toyota Axio • ৬৭ দিন লটে আছে</h4>
                          <p className="text-[12px] text-orange-100 font-sans font-semibold">প্রতিদিন BDT ১,২০০ ক্ষতি হচ্ছে (holding cost)</p>
                        </div>
                      </div>
                      <Link 
                        href="/dashboard/maestro"
                        className="bg-white text-orange-700 px-4 py-2 rounded-lg text-[12px] font-sans font-bold hover:bg-orange-50 active:scale-95 transition-all shadow-sm shrink-0"
                      >
                        দাম কমান →
                      </Link>
                    </div>
                  )}

                  {/* MORNING BRIEFING CARD */}
                  <div className="bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-l-4 border-[#2563EB] p-6 rounded-2xl shadow-sm space-y-4">
                    {/* Row 1 */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h2 className="text-[20px] font-bold font-outfit text-[#111827]">🌅 শুভ সকাল, {user.name}!</h2>
                        <p className="text-[14px] text-[#6B7280] font-sans font-semibold">শুক্রবার, ১৭ই জুলাই ২০২৬</p>
                      </div>
                      <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A] text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Starter Plan ✦
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#BFDBFE]" />

                    {/* Row 2: Yesterday's Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-[12px] text-[#6B7280] font-bold uppercase tracking-wider block">গতকালের বিক্রি</span>
                        <span className="text-xl font-bold text-[#111827] block font-outfit">{toBengaliDigits(3)}টি গাড়ি</span>
                        {role === 'Salesperson' ? (
                          <span className="text-[14px] text-gray-400 underline cursor-help block font-sans" title="Owner শুধু দেখতে পারবেন">—</span>
                        ) : (
                          <span className="text-[14px] text-green-600 font-bold block">▲ BDT ৪৫L</span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[12px] text-[#6B7280] font-bold uppercase tracking-wider block">নতুন লিড</span>
                        <span className="text-xl font-bold text-[#111827] block font-outfit">{toBengaliDigits(12)}টি</span>
                        <span className="text-[13px] text-green-600 font-bold block">৮টি যোগাযোগ করা হয়েছে</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[12px] text-[#6B7280] font-bold uppercase tracking-wider block">জরুরি কাজ</span>
                        <span className="text-xl font-bold text-[#DC2626] block font-outfit">{toBengaliDigits(3)}টি</span>
                        <Link href="/dashboard/aging" className="text-[13px] text-[#DC2626] font-bold hover:underline block">
                          এখনই দেখুন →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* QUICK STATS ROW (4 cards) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    
                    {/* Card 1: Available Cars */}
                    <Link 
                      href="/dashboard/inventory?status=available"
                      className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-150 text-left"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[13px] text-[#6B7280] font-bold font-sans">Available Cars</span>
                        <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-blue-600 text-lg">
                          🚗
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[28px] md:text-[32px] font-bold font-outfit text-[#111827] leading-none">
                          {toBengaliDigits(countAvailable)}
                        </span>
                        <span className="text-[12px] text-gray-500 block font-semibold">বিক্রির জন্য প্রস্তুত গাড়ি</span>
                        <span className="text-[12px] text-green-600 font-bold block">▲ ৩টি এই সপ্তাহে যোগ হয়েছে</span>
                      </div>
                    </Link>

                    {/* Card 2: Active Leads */}
                    <Link 
                      href="/dashboard/leads"
                      className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-150 text-left"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[13px] text-[#6B7280] font-bold font-sans">Active Leads</span>
                        <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center text-purple-600 text-lg">
                          👥
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[28px] md:text-[32px] font-bold font-outfit text-[#111827] leading-none">
                          {toBengaliDigits(countLeads)}
                        </span>
                        <span className="text-[12px] text-gray-500 block font-semibold">সক্রিয় লিড</span>
                        <span className="text-[12px] text-red-600 font-bold block">🔥 ৫টি Hot Lead</span>
                      </div>
                    </Link>

                    {/* Card 3: Follow-ups Today */}
                    <Link 
                      href="/dashboard/leads?filter=followup_due"
                      className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-150 text-left"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[13px] text-[#6B7280] font-bold font-sans">Follow-ups Today</span>
                        <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-orange-600 text-lg">
                          📅
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[28px] md:text-[32px] font-bold font-outfit text-[#111827] leading-none">
                          {toBengaliDigits(countFollowups)}
                        </span>
                        <span className="text-[12px] text-gray-500 block font-semibold">আজকের ফলো-আপ</span>
                        <span className="text-[12px] text-orange-600 font-bold block">৩টি অতিমাত্রায় বিলম্বিত</span>
                      </div>
                    </Link>

                    {/* Card 4: Pending Approvals */}
                    <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-150">
                      <div className="flex justify-between items-start">
                        <span className="text-[13px] text-[#6B7280] font-bold font-sans">Pending Approvals</span>
                        <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center text-red-600 text-lg">
                          ⏳
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {role === 'Salesperson' ? (
                          <div className="space-y-1">
                            <span className="text-red-500 font-bold block text-xs">Access Restricted</span>
                            <span className="text-[10px] text-gray-400 block font-bold leading-normal">Owner শুধু দেখতে পারবেন</span>
                          </div>
                        ) : (
                          <>
                            <Link href="/dashboard/deals?status=pending_approval" className="block">
                              <span className="text-[28px] md:text-[32px] font-bold font-outfit text-[#111827] leading-none hover:text-[#2563EB]">
                                {toBengaliDigits(2)}
                              </span>
                            </Link>
                            <span className="text-[12px] text-gray-500 block font-semibold">অনুমোদন বাকি ডিল</span>
                            <span className="text-[12px] text-red-600 font-bold block">Manager approval required</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* MAESTRO AI INSIGHT CARD */}
                  <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 space-y-4 text-left">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-[15px] font-bold text-[#111827] font-sans flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#2563EB] text-[20px]">psychology</span>
                        💡 Maestro-র আজকের পরামর্শ
                      </h4>
                      <span className="bg-[#DBEAFE] text-[#1D4ED8] rounded-full px-3 py-1 text-[11px] font-sans font-semibold">
                        PRICING
                      </span>
                    </div>

                    <p className="text-[16px] text-[#374151] leading-relaxed font-sans font-medium">
                      আপনার Toyota Axio 2019 গাড়িটি ৪৫ দিন ধরে বিক্রি হয়নি। একই গাড়ি ঢাকায় BDT ১৩,৫০,০০০-এ বিক্রি হচ্ছে। BDT ৫০,০০০ কমালে এই সপ্তাহেই বিক্রির সম্ভাবনা আছে।
                    </p>

                    <button 
                      onClick={() => addToast('info', 'প্রাইস অপ্টিমাইজেশান লোড করা হচ্ছে...')}
                      className="w-full h-11 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-sm flex items-center justify-center gap-1.5"
                    >
                      SK-202501-0023 দেখুন ও দাম পরিবর্তন করুন →
                    </button>

                    <div className="flex justify-between text-[12px] font-sans font-semibold text-[#6B7280] pt-2">
                      <span>আইএমভি এনালাইটিক্স</span>
                      <Link href="/dashboard/analytics" className="text-[#2563EB] hover:underline">
                        আরো ৪টি পরামর্শ আছে →
                      </Link>
                    </div>
                  </div>

                  {/* RECENT ACTIVITY TIMELINE */}
                  <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-5 text-left">
                    <h3 className="text-[16px] font-sans font-semibold text-[#111827] uppercase tracking-wider border-b pb-3">সাম্প্রতিক অ্যাক্টিভিটি</h3>
                    
                    <div className="relative border-l border-gray-100 ml-4 space-y-6 py-2">
                      {[
                        { time: '৫ মিনিট আগে', desc: 'নতুন লিড: রফিক হোসেন → Toyota Axio', icon: 'groups', color: 'bg-emerald-500 text-white' },
                        { time: '২২ মিনিট আগে', desc: 'Salman WhatsApp করেছেন Lead #1234-কে', icon: 'chat', color: 'bg-blue-500 text-white' },
                        { time: '১ ঘণ্টা আগে', desc: 'ডিল #D-089 অনুমোদিত হয়েছে', icon: 'handshake', color: 'bg-emerald-500 text-white' },
                        { time: '২ ঘণ্টা আগে', desc: 'Honda Fit sync হয়েছে marketplace-এ', icon: 'sync', color: 'bg-indigo-500 text-white' },
                        { time: '৩ ঘণ্টা আগে', desc: 'SK-202501-0056 sync error — retry করুন', icon: 'sync_problem', color: 'bg-red-500 text-white' }
                      ].map((act, idx) => (
                        <div key={idx} className="relative pl-8">
                          {/* Timeline dot icon */}
                          <div className={`absolute left-0 top-0.5 -ml-[16px] w-8 h-8 rounded-full flex items-center justify-center text-[14px] shadow-sm border border-white z-10 ${act.color}`}>
                            <span className="material-symbols-outlined text-[14px]">{act.icon}</span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[14px] font-sans font-normal text-[#374151]">{act.desc}</p>
                            <span className="text-[12px] font-sans font-normal text-[#6B7280] block">{toBengaliDigits(act.time)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t text-center">
                      <button 
                        onClick={() => addToast('info', 'সম্পূর্ণ অ্যাক্টিভিটি লগ লোড করা হচ্ছে')}
                        className="text-[12px] font-sans font-semibold text-[#2563EB] hover:underline"
                      >
                        সব Activity দেখুন →
                      </button>
                    </div>
                  </section>

                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-45 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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
