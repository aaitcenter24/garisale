'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

export default function DealerOSDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to logged in for direct preview
  const [email, setEmail] = useState('owner@dhakamotors.com');
  const [password, setPassword] = useState('password123');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'leads' | 'deals' | 'more'>('dashboard');
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');

  const user = {
    name: 'তানভীর',
    role: 'Owner',
    dealership: 'Dhaka Premium Motors',
    plan: 'Starter'
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
  };

  // RENDER STATE 1: Light Theme Login Panel
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] p-8 rounded-3xl shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] font-outfit">
              GariSale <span className="text-[#2563EB]">Dealer OS</span>
            </h1>
            <p className="text-xs text-[#6B7280] font-semibold">ডিজিটাল শোরুম ম্যানেজমেন্ট সিস্টেম</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ইমেইল অ্যাড্রেস</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-3 text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-3 text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-sm shadow-md mt-2"
            >
              ডিলার ওএস-এ লগইন করুন
            </button>
          </form>

          {/* Quick Helper Credentials */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <span className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Demo Credentials</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#111827] font-semibold">
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

  // RENDER STATE 2: Pure Light Theme Dealer OS Dashboard Layout
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16 md:pb-0">
      
      {/* Impersonation alert */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>আপনি বর্তমানে {user.dealership} হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
        >
          লগআউট
        </button>
      </div>

      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR (width 240px, fixed, white) */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen">
          <div className="space-y-6">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[10px] text-[#6B7280] font-bold truncate">{user.dealership}</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: '🏠 ড্যাশবোর্ড' },
                { id: 'inventory', label: '🚗 ইনভেন্টরি' },
                { id: 'leads', label: '👥 লিড (CRM)' },
                { id: 'deals', label: '🤝 ডিল' },
                { id: 'analytics', label: '📊 Analytics' },
                { id: 'automation', label: '🤖 Automation Hub' },
                { id: 'website', label: '🌐 Website' },
                { id: 'settings', label: '⚙️ Settings' }
              ].map((item) => {
                const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'dashboard');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (['dashboard', 'inventory', 'leads', 'deals'].includes(item.id)) {
                        setActiveTab(item.id as any);
                      }
                    }}
                    className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-[#2563EB] text-white shadow-sm' 
                        : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111827] bg-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom components */}
          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="border border-[#2563EB] text-[#2563EB] bg-blue-50/50 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user.plan} Plan
              </span>
              <button className="text-[10px] font-bold text-[#2563EB] hover:underline">
                আপগ্রেড করুন
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 bg-gray-50 p-1.5 rounded-lg border">
              <span>ভাষা / Language:</span>
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
                <span className="text-[8px] font-semibold text-[#6B7280] block">Owner</span>
              </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-9 border border-[#E5E7EB] text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              লগআউট
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Bar */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-4 w-96">
              <span className="material-symbols-outlined text-[#6B7280] text-[20px]">search</span>
              <input
                type="text"
                placeholder="গাড়ি, লিড অথবা ডিল খুঁজুন..."
                className="w-full text-xs font-medium focus:outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-[#6B7280] hover:text-[#111827] p-2">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-xs font-bold text-[#111827]">{user.dealership}</span>
            </div>
          </header>

          {/* Main scroll wrapper */}
          <main className="p-6 space-y-6 flex-1 bg-[#F9FAFB]">
            
            {/* Header Title */}
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827] font-outfit">
                শুভ সকাল, {user.name}! 👋
              </h1>
              <p className="text-xs text-[#6B7280] font-semibold mt-0.5">রবিবার, ১৩ জুলাই ২০২৬</p>
            </div>

            {/* Morning Briefing card */}
            <div className="bg-[#EFF6FF] border-l-4 border-[#2563EB] p-5 rounded-r-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#2563EB]">
                <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
                <h3 className="font-bold text-xs uppercase tracking-wider">আজকের মর্নিং ব্রিফিং</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-[#111827]">
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase">গতকালকের অর্জন</span>
                  <p className="mt-1">
                    {toBengaliDigits(2)} টি বিক্রি · BDT {toBengaliDigits('২৮.৫')}L রাজস্ব · {toBengaliDigits(7)} নতুন লিড
                  </p>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase">আজকের জরুরি অ্যাকশন</span>
                  <p className="mt-1">
                    {toBengaliDigits(3)} টি follow-up · {toBengaliDigits(1)} টি পুরানো গাড়ি
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Available Cars', value: '২৩', icon: 'directions_car', color: 'text-blue-600' },
                { label: 'Active Leads', value: '১৫', icon: 'groups', color: 'text-indigo-600' },
                { label: 'Follow-ups Today', value: '৩', icon: 'calendar_today', color: 'text-emerald-600' },
                { label: 'Pending Deals', value: '২', icon: 'handshake', color: 'text-amber-600' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{stat.label}</span>
                    <span className="block text-2xl font-bold font-outfit text-[#111827] mt-1">{toBengaliDigits(stat.value)} টি</span>
                  </div>
                  <span className={`material-symbols-outlined text-2xl ${stat.color}`}>{stat.icon}</span>
                </div>
              ))}
            </section>

            {/* Maestro AI Insight Card */}
            <div className="bg-white border border-[#2563EB] p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#2563EB]">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">💡 Maestro-র পরামর্শ</h4>
                </div>
                <span className="bg-blue-50 text-[#2563EB] border border-blue-100 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  DEMAND
                </span>
              </div>
              <p className="text-xs text-[#111827] leading-relaxed max-w-2xl font-medium">
                "Toyota Axio-র বাজারমূল্য চলতি মাসে ঢাকায় ৮% বৃদ্ধি পেয়েছে। আপনার স্টকে ৩টি Toyota Axio রয়েছে। ডিল ক্লিয়ার করার জন্য এখনই বিজ্ঞাপন আপডেট করুন।"
              </p>
              <button className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1">
                এখনই দেখুন →
              </button>
            </div>

            {/* Urgent Aging Stock Warning Card */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-red-700">
                <span className="material-symbols-outlined text-red-600 text-[20px]">warning</span>
                <span className="text-xs font-bold">🚨 জরুরি: SK-202501-0012 লটে ৯২ দিন ধরে আছে</span>
              </div>
              <Link 
                href="/dashboard/inventory" 
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-700 active:scale-95 transition-all"
              >
                ব্যবস্থা নিন
              </Link>
            </div>

            {/* Recent Activity Feed */}
            <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider border-b pb-3">সাম্প্রতিক অ্যাক্টিভিটি</h3>
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
                      <p className="text-xs font-bold text-[#111827]">{act.desc}</p>
                      <span className="text-[9px] font-semibold text-[#6B7280] block">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB NAVIGATION (fixed at bottom, white, shadow-top) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car' },
          { id: 'leads', label: 'Leads', icon: 'groups' },
          { id: 'deals', label: 'Deals', icon: 'handshake' },
          { id: 'more', label: 'More', icon: 'menu' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-[9px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
