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

interface PriceRecommendation {
  id: string;
  vehicle: string;
  stockId: string;
  currentPrice: number;
  recommendedPrice: number;
  reason: string;
  daysOnLot: number;
}

export default function MaestroAIDashboard() {
  // Mock Recommendations
  const [recommendations, setRecommendations] = useState<PriceRecommendation[]>([
    { id: '1', vehicle: 'Toyota Axio Hybrid 2019', stockId: 'SK-202501-0012', currentPrice: 1450000, recommendedPrice: 1406000, reason: 'অনুরূপ মডেলের চাহিদা গত সপ্তাহে ১৫% হ্রাস পেয়েছে। দাম ৩% কমালে ৭-১০ দিনের মধ্যে বিক্রি সম্ভব।', daysOnLot: 92 },
    { id: '2', vehicle: 'Honda Fit F-Package 2018', stockId: 'SK-202501-0034', currentPrice: 1280000, recommendedPrice: 1240000, reason: 'শোরুমে মাইলেজ বেশি থাকা গাড়ির সংখ্যা বৃদ্ধি পেয়েছে। প্রমোশনাল ছাড় বিক্রির গতি বাড়াবে।', daysOnLot: 54 },
    { id: '3', vehicle: 'Toyota Premio F 2017', stockId: 'SK-202501-0056', currentPrice: 2350000, recommendedPrice: 2300000, reason: 'বাজারে নতুন মডেল ঢোকার কারণে পুরনো মডেলের স্টক ক্লিয়ারেন্স রেকমেন্ডেশন।', daysOnLot: 42 }
  ]);

  const [activeTab, setActiveTab] = useState<'maestro' | 'analytics' | 'automation' | 'website' | 'settings'>('maestro');
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');

  const user = {
    name: 'তানভীর',
    role: 'Owner',
    dealership: 'Dhaka Premium Motors',
    plan: 'Starter'
  };

  const handleUpdatePrice = (id: string, recommended: number) => {
    alert(`সফলভাবে গাড়ির মূল্য আপডেট করে BDT ${toBengaliDigits(recommended.toLocaleString())} করা হয়েছে!`);
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const handleDismiss = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16 md:pb-0">
      
      {/* Impersonation alert */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>আপনি বর্তমানে {user.dealership} হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।</span>
        </div>
        <Link href="/dashboard" className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
          ড্যাশবোর্ড
        </Link>
      </div>

      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[10px] text-[#6B7280] font-bold truncate">{user.dealership}</p>
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
                const isActive = item.id === 'maestro';
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
            <div className="flex items-center justify-between">
              <span className="border border-[#2563EB] text-[#2563EB] bg-blue-50/50 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user.plan} Plan
              </span>
              <span className="text-[10px] font-bold text-gray-400">Language: {lang}</span>
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
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-10 space-y-8">
          
          {/* Header Title */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="font-extrabold text-base md:text-lg text-[#111827] font-outfit flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB]">psychology</span>
                Maestro AI (অটোমেশনRuleইঞ্জিন)
              </h1>
              <p className="text-[10px] text-[#6B7280] font-bold mt-0.5">শোরুম ও ইনভেন্টরির রিয়েল-টাইম এআই অ্যানালিটিক্স</p>
            </div>
            
            <div className="flex bg-white border border-[#E5E7EB] p-1 rounded-xl text-[10px] font-bold shadow-sm">
              <span className="px-2 py-1 bg-blue-50 text-[#2563EB] rounded-lg">AI Active ✅</span>
            </div>
          </div>

          {/* Morning Briefing 🌅 */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[80px]">sunny</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#2563EB]">wb_sunny</span>
                Morning Briefing (আজকের সকালের ব্রিফিং)
              </h3>
              <span className="text-[9px] text-gray-500 font-semibold block">তারিখ: ১৩ই জুলাই, ২০২৬ · আপডেট: সকাল ৮:০০ মিনিট</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white border border-blue-100/50 p-4 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-gray-400 block uppercase">গতকালকের অর্জন</span>
                <span className="text-sm font-bold text-[#111827] block">৩টি লিড এসেছে</span>
                <span className="text-[9px] text-[#16A34A] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">trending_up</span>
                  ২টি রিয়েল "হট লিড" চিহ্নিত
                </span>
              </div>
              <div className="bg-white border border-blue-100/50 p-4 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-gray-400 block uppercase">আজকের মূল কাজ</span>
                <span className="text-sm font-bold text-[#111827] block">২টি টেস্ট ড্রাইভ সিডিউল</span>
                <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                  দুপুর ২:০০ এবং বিকেল ৪:৩০ মিনিটে
                </span>
              </div>
              <div className="bg-white border border-blue-100/50 p-4 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-gray-400 block uppercase">জরুরি অ্যালার্ট</span>
                <span className="text-sm font-bold text-red-600 block">১টি গাড়ি ৯০+ দিন স্টক-এ</span>
                <span className="text-[9px] text-red-500 font-bold">
                  SK-202501-0012 লটে ৯২ দিন
                </span>
              </div>
            </div>
          </section>

          {/* Pricing Optimization Recommendations 💰 */}
          <section className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider pl-2">মূল্য অপ্টিমাইজেশান রেকমেন্ডেশনস (Price Optimizations)</h3>
            
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border text-center text-xs font-bold text-gray-500">
                  🎉 এই মুহূর্তে কোনো নতুন প্রাইস অপ্টিমাইজেশান পেন্ডিং নেই।
                </div>
              ) : (
                recommendations.map(rec => (
                  <div key={rec.id} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="bg-red-50 text-red-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                          লটে {toBengaliDigits(rec.daysOnLot)} দিন
                        </span>
                        <h4 className="font-bold text-xs text-[#111827]">{rec.vehicle}</h4>
                        <span className="text-[9px] text-gray-400 font-mono">Stock: {rec.stockId}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-3 flex flex-row md:flex-col items-center justify-between md:justify-end gap-3 md:gap-1.5 border-t md:border-0 pt-3 md:pt-0">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold block line-through">বর্তমান: BDT {toBengaliDigits(rec.currentPrice.toLocaleString())}</span>
                        <span className="text-xs font-extrabold text-[#2563EB] block">AI প্রস্তাবিত: BDT {toBengaliDigits(rec.recommendedPrice.toLocaleString())}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDismiss(rec.id)}
                          className="h-8 border border-gray-300 hover:bg-gray-50 text-[#111827] px-3 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                        >
                          খারিজ করুন
                        </button>
                        <button 
                          onClick={() => handleUpdatePrice(rec.id, rec.recommendedPrice)}
                          className="h-8 bg-[#2563EB] text-white hover:brightness-110 px-3.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm"
                        >
                          মূল্য আপডেট করুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Local Market Demand Insights 📊 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Supply vs Demand widget */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-[#111827] border-b pb-2 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#2563EB]">equalizer</span>
                স্থানীয় বাজার চাহিদা সূচক (Supply vs Demand)
              </h4>
              
              <div className="space-y-3">
                {[
                  { segment: 'Hybrid Sedan (যেমন: Axio)', demand: 85, supply: 60, status: 'High Demand 🔥' },
                  { segment: 'Premium Sedan (যেমন: Premio)', demand: 55, supply: 80, status: 'Over-supplied ⚠️' },
                  { segment: 'Compact Hatchback (যেমন: Fit)', demand: 72, supply: 68, status: 'Balanced ⚖️' },
                  { segment: 'Crossover/SUV (যেমন: X-Trail)', demand: 90, supply: 45, status: 'Critical Shortage 🚨' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#111827]">{item.segment}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${item.status.includes('High') || item.status.includes('Critical') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
                    </div>
                    {/* Visual Supply vs Demand bar */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-gray-400 font-mono w-10">চাহিদা:</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div style={{ width: `${item.demand}%` }} className="h-full bg-blue-500 rounded-full" />
                        </div>
                        <span className="text-[9px] text-[#111827] font-bold w-6 text-right">{toBengaliDigits(item.demand)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-gray-400 font-mono w-10">সরবরাহ:</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div style={{ width: `${item.supply}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </div>
                        <span className="text-[9px] text-[#111827] font-bold w-6 text-right">{toBengaliDigits(item.supply)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular models local area (Dhaka) */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-[#111827] border-b pb-2 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#2563EB]">stars</span>
                জনপ্রিয় গাড়ি ও ক্রেতার আগ্রহ (Most Searched models)
              </h4>

              <div className="space-y-3.5 text-xs font-semibold">
                {[
                  { model: 'Toyota Axio Hybrid', searchCount: '১,৪২০ ভিউ', trend: '+১২%', level: 'Very High' },
                  { model: 'Toyota Fielder Hybrid', searchCount: '৯৮০ ভিউ', trend: '+৫%', level: 'High' },
                  { model: 'Honda Fit GP5', searchCount: '৮৪০ ভিউ', trend: '+১৮%', level: 'Surging 🔥' },
                  { model: 'Toyota Premio 2018', searchCount: '৭৬০ ভিউ', trend: '-৪%', level: 'Declining' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2 hover:bg-gray-50/50">
                    <div className="space-y-0.5">
                      <span className="text-[#111827] block font-bold">{item.model}</span>
                      <span className="text-[9px] text-[#6B7280] block">স্থানীয় এলাকা: ঢাকা (Dhaka Division)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#2563EB] font-extrabold block text-[10px]">{toBengaliDigits(item.searchCount)}</span>
                      <span className={`text-[8px] font-bold ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{item.trend} ({item.level})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>

        </main>

      </div>

      {/* MOBILE INSET BOTTOM TABS */}
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
