'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

export default function WebsiteBuilderPage() {
  const router = useRouter();
  
  // Customization controls state
  const [headline, setHeadline] = useState('ঢাকা প্রিমিয়াম মটরস');
  const [tagline, setTagline] = useState('আপনার স্বপ্নের গাড়ি খুঁজে পাওয়ার বিশ্বস্ত শোরুম');
  const [accentColor, setAccentColor] = useState('#2563EB'); // Default GariSale blue
  const [customDomain, setCustomDomain] = useState('dhakapremiummotors.com');
  const [showDomainSetup, setShowDomainSetup] = useState(false);

  // Preset accent colors
  const colorPresets = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Amber', value: '#D97706' },
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Slate', value: '#475569' }
  ];

  // Most viewed inventory data
  const popularCars = [
    { title: 'Toyota Axio 2019', views: 342, leads: 18 },
    { title: 'Honda Fit 2018', views: 215, leads: 12 },
    { title: 'Toyota Premio 2017', views: 189, leads: 9 }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Impersonation Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>আপনি বর্তমানে Dhaka Premium Motors হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।</span>
        </div>
        <Link href="/dashboard" className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
          ড্যাশবোর্ড
        </Link>
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
                <h2 className="font-extrabold text-sm font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[10px] text-[#6B7280] font-bold truncate">Dhaka Premium Motors</p>
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
                const isActive = item.id === 'website';
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-xs font-bold transition-all ${
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-[#111827] flex items-center justify-center font-bold text-xs">
                TR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">তানভীর রহমান</p>
                <span className="text-[8px] font-semibold text-[#6B7280] block">Owner</span>
              </div>
            </div>
          </div>
        </aside>

        {/* TWO-COLUMN WEBSITE BUILDER WORKSPACE (Left Customizer, Right Preview) */}
        <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden h-screen">
          
          {/* LEFT CUSTOMIZER PANEL */}
          <div className="w-full md:w-[450px] bg-white border-r border-[#E5E7EB] flex flex-col overflow-y-auto shrink-0">
            
            <header className="p-6 border-b border-gray-100 shrink-0">
              <h1 className="font-extrabold text-base text-[#111827] font-outfit">Website Builder</h1>
              <p className="text-[10px] text-[#6B7280] font-bold">কাস্টম শোরুম ব্র্যান্ডিং ও ওয়েবসাইট বিল্ডার</p>
            </header>

            <div className="p-6 space-y-6">
              
              {/* Connection & Live URL Status Card */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>আপনার ওয়েবসাইট সচল আছে ✅</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6B7280] block uppercase font-bold">ওয়েবসাইট লিংক (Live URL)</span>
                  <Link 
                    href={`https://${customDomain}`} 
                    target="_blank"
                    className="text-xs font-extrabold text-[#2563EB] hover:underline"
                  >
                    https://{customDomain}
                  </Link>
                </div>
                <button 
                  onClick={() => setShowDomainSetup(true)}
                  className="bg-white border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-100/50 transition-all"
                >
                  ⚙️ কাস্টম ডোমেইন সেটআপ
                </button>
              </div>

              {/* Accent Color presets */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ব্র্যান্ড থিম কালার (Accent Color)</label>
                <div className="flex flex-wrap gap-2.5">
                  {colorPresets.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      style={{ backgroundColor: color.value }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        accentColor === color.value ? 'border-[#111827] scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Headline & Tagline input fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">হেডিং (Showroom Headline)</label>
                  <input 
                    type="text" 
                    value={headline} 
                    onChange={e => setHeadline(e.target.value)} 
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-bold text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ট্যাগলাইন (Showroom Tagline)</label>
                  <input 
                    type="text" 
                    value={tagline} 
                    onChange={e => setTagline(e.target.value)} 
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none text-[#111827] font-semibold"
                  />
                </div>
              </div>

              {/* Site Analytics Widget */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-[#6B7280] uppercase tracking-wider border-b pb-2">ওয়েবসাইট ভিজিটর রিপোর্ট</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] font-bold text-[#6B7280] uppercase">ইউনিক পেজভিউ</span>
                    <span className="text-xl font-extrabold text-[#111827]">{toBengaliDigits(1842)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#6B7280] uppercase">প্রাপ্ত লিড সংখ্যা</span>
                    <span className="text-xl font-extrabold text-[#2563EB]">{toBengaliDigits(32)}</span>
                  </div>
                </div>

                {/* Popular views table */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[9px] font-bold text-[#6B7280] block uppercase">সবচেয়ে জনপ্রিয় গাড়ি</span>
                  <div className="space-y-2 text-xs">
                    {popularCars.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b pb-1.5 font-semibold">
                        <span className="text-[#111827] truncate">{item.title}</span>
                        <div className="text-[10px] text-gray-500 shrink-0">
                          {toBengaliDigits(item.views)} ভিউ · {toBengaliDigits(item.leads)} লিড
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Layout Button */}
              <button 
                onClick={() => alert('ওয়েবসাইটের পরিবর্তনসমূহ সফলভাবে পাবলিশ করা হয়েছে!')}
                className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md"
              >
                পাবলিশ করুন (Save Changes)
              </button>

            </div>

          </div>

          {/* RIGHT LIVE PREVIEW CONTAINER */}
          <div className="flex-1 bg-gray-100 p-6 hidden md:flex flex-col overflow-hidden h-full">
            <div className="flex items-center justify-between pb-3 shrink-0">
              <span className="text-xs font-bold text-[#6B7280]">ওয়েবসাইট লাইভ প্রিভিউ (Live Preview)</span>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
            </div>

            {/* Simulated Live Website Iframe Device */}
            <div className="flex-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-lg overflow-hidden flex flex-col">
              
              {/* Nav */}
              <div className="h-14 border-b border-gray-100 flex justify-between items-center px-6 shrink-0">
                <span className="font-extrabold text-sm font-outfit" style={{ color: accentColor }}>
                  {headline}
                </span>
                <div className="flex gap-4 text-[10px] font-bold text-gray-600">
                  <span>Home</span>
                  <span>Inventory</span>
                  <span>About</span>
                  <span>Contact</span>
                </div>
              </div>

              {/* Hero Banner Section (updates dynamically) */}
              <div 
                style={{ backgroundColor: `${accentColor}10` }}
                className="p-10 text-center space-y-3 border-b border-gray-100 shrink-0"
              >
                <h2 className="text-xl font-extrabold text-[#111827] max-w-sm mx-auto leading-tight">
                  {headline}
                </h2>
                <p className="text-[10px] text-gray-500 max-w-xs mx-auto font-medium">
                  {tagline}
                </p>
                <button 
                  style={{ backgroundColor: accentColor }}
                  className="text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:brightness-110 mt-2"
                >
                  স্টক ব্রাউজ করুন →
                </button>
              </div>

              {/* Featured Inventory Mock Stack */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50/50">
                <span className="text-[9px] font-bold text-[#6B7280] block uppercase tracking-wider">আমাদের স্টক (Featured Inventory)</span>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'Toyota Axio 2019', price: 'BDT ১৪,৫০,০০০', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
                    { title: 'Honda Fit 2018', price: 'BDT ১২,৮০,০০০', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' }
                  ].map((car, idx) => (
                    <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="h-20 bg-gray-100 overflow-hidden">
                        <img src={car.img} alt={car.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="font-bold text-[10px] text-[#111827] truncate">{car.title}</h4>
                        <p className="text-[10px] text-[#16A34A] font-bold">{car.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Domain mapping modal */}
      {showDomainSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit">কাস্টম ডোমেইন সেটআপ</h3>
              <button onClick={() => setShowDomainSetup(false)} className="text-[#6B7280] hover:text-[#111827]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">আপনার কাস্টম ডোমেন এড্রেস</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] font-bold focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-[10px] font-semibold text-[#6B7280]">
                <span className="block font-bold text-[#111827]">⚠️ DNS কনফিগারেশন রুলস:</span>
                <p>১. আপনার ডোমেইন প্রোভাইডারে (যেমন: GoDaddy/Namecheap) লগইন করুন।</p>
                <p>২. CNAME রেকর্ড অ্যাড করুন: `cname.garisale.com` টার্গেটে।</p>
                <p>৩. ৩-৪ ঘণ্টার মধ্যে ক্লাউডফ্লেয়ার অটো-ডোমেন রাউটিং সম্পন্ন হবে।</p>
              </div>

              <button
                onClick={() => setShowDomainSetup(false)}
                className="w-full h-10 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2"
              >
                ডোমেন সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car', path: '/dashboard/inventory' },
          { id: 'leads', label: 'Leads', icon: 'groups', path: '/dashboard/leads' },
          { id: 'deals', label: 'Deals', icon: 'handshake', path: '/dashboard/deals' },
          { id: 'more', label: 'More', icon: 'menu', path: '/dashboard' }
        ].map((tab) => {
          const isActive = tab.id === 'more';
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-[9px] font-bold">{tab.label}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
