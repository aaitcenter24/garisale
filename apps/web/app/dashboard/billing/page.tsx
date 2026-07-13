'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'Paid' | 'Pending';
}

export default function SubscriptionBillingPage() {
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');
  
  // Current Plan State
  const [currentPlan, setCurrentPlan] = useState<'Starter' | 'Business' | 'Enterprise'>('Starter');
  const [daysRemaining, setDaysRemaining] = useState(14);

  // bKash Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<'Business' | 'Enterprise'>('Business');
  const [checkoutStep, setCheckoutStep] = useState<'phone' | 'otp' | 'pin' | 'success'>('phone');
  const [bkashPhone, setBkashPhone] = useState('');
  const [bkashOtp, setBkashOtp] = useState('');
  const [bkashPin, setBkashPin] = useState('');

  // Invoice History State
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-202607-0012', date: '2026-07-01', amount: 0, planName: 'Starter Plan (Free Trial)', status: 'Paid' }
  ]);

  const user = {
    name: 'তানভীর',
    role: 'Owner',
    dealership: 'Dhaka Premium Motors'
  };

  const handleStartCheckout = (plan: 'Business' | 'Enterprise') => {
    setCheckoutTargetPlan(plan);
    setCheckoutStep('phone');
    setShowCheckoutModal(true);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bkashPhone.match(/^01[3-9]\d{8}$/)) {
      alert('সঠিক ১১ ডিজিটের বিকাশ মোবাইল নম্বর দিন!');
      return;
    }
    setCheckoutStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bkashOtp.length !== 6) {
      alert('৬ ডিজিটের ওটিপি কোড প্রদান করুন!');
      return;
    }
    setCheckoutStep('pin');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bkashPin.length !== 5) {
      alert('৫ ডিজিটের বিকাশ পিন নম্বর প্রদান করুন!');
      return;
    }
    setCheckoutStep('success');
    
    // Simulate successful subscription upgrade in UI
    setTimeout(() => {
      setCurrentPlan(checkoutTargetPlan);
      setDaysRemaining(30);
      
      // Append new paid invoice to billing ledger
      const newInvoice: Invoice = {
        id: `INV-202607-00${invoices.length + 12}`,
        date: new Date().toISOString().split('T')[0],
        amount: checkoutTargetPlan === 'Business' ? 5000 : 15000,
        planName: `${checkoutTargetPlan === 'Business' ? 'Business' : 'Enterprise'} Plan (Monthly)`,
        status: 'Paid'
      };
      setInvoices([newInvoice, ...invoices]);
    }, 800);
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
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 h-full sticky top-0">
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
                const isActive = item.id === 'billing';
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
                {currentPlan} Plan
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

        {/* WORKSPACE */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-10 space-y-8">
          
          {/* Header Title */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="font-extrabold text-base md:text-lg text-[#111827] font-outfit flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB]">credit_card</span>
                সাবস্ক্রিপশন ও বিলিং (DEALER-08)
              </h1>
              <p className="text-[10px] text-[#6B7280] font-bold mt-0.5">শোরুম ওনারশিপ প্ল্যান আপগ্রেড এবং বিকাশ পেমেন্ট</p>
            </div>
          </div>

          {/* Current Subscription Status Bar */}
          <div className="bg-white border rounded-3xl p-5 shadow-sm flex justify-between items-center flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">বর্তমান সাবস্ক্রিপশন</span>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#111827]">{currentPlan} Plan</h3>
                <span className="bg-blue-50 text-[#2563EB] text-[8px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {currentPlan === 'Starter' ? 'Free Trial' : 'Active ✅'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block">পরবর্তী নবায়ন / মেয়াদ শেষ</span>
                <span className="text-xs font-extrabold text-amber-600">{toBengaliDigits(daysRemaining)} দিন বাকি আছে</span>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Plan Cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider pl-2">আমাদের শোরুম প্ল্যানসমূহ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Plan 1: Starter */}
              <div className={`bg-white border rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between relative ${currentPlan === 'Starter' ? 'border-[#2563EB] ring-2 ring-blue-50/50' : ''}`}>
                {currentPlan === 'Starter' && (
                  <span className="absolute -top-3 left-6 bg-[#2563EB] text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Current Plan
                  </span>
                )}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-[#111827]">Starter Plan</h4>
                  <span className="text-xs font-extrabold text-gray-500 font-sans block">BDT ০ / মাস</span>
                  <p className="text-[10px] text-[#6B7280] font-semibold leading-relaxed pt-2">
                    বেসিক শোরুম প্রোফাইল, সর্বোচ্চ ৫টি গাড়ির লিস্টিং এবং ডিফল্ট সাবডোমেন অ্যাক্সেস।
                  </p>
                </div>
                <button 
                  disabled 
                  className="w-full h-10 border border-gray-200 text-gray-400 font-bold rounded-xl text-xs cursor-not-allowed"
                >
                  {currentPlan === 'Starter' ? 'সচল আছে' : 'ডিফল্ট'}
                </button>
              </div>

              {/* Plan 2: Business */}
              <div className={`bg-white border rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between relative ${currentPlan === 'Business' ? 'border-[#2563EB] ring-2 ring-blue-50/50' : ''}`}>
                {currentPlan === 'Business' && (
                  <span className="absolute -top-3 left-6 bg-[#2563EB] text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Current Plan
                  </span>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-sm text-[#111827]">Business Plan</h4>
                    <span className="bg-blue-50 text-[#2563EB] text-[8px] font-bold px-2 py-0.5 rounded border border-blue-150 uppercase">Popular</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#2563EB] font-sans block">BDT ৫,০০০ / মাস</span>
                  <p className="text-[10px] text-[#6B7280] font-semibold leading-relaxed pt-2">
                    🔒 কাস্টম ডোমেন কানেকশন, আনলিমিটেড ইনভেন্টরি, উন্নত ওয়েবসাইট বিল্ডার এবং ওনার সেটিংস আরব্যাক মডুল।
                  </p>
                </div>
                <button 
                  onClick={() => handleStartCheckout('Business')}
                  disabled={currentPlan === 'Business' || currentPlan === 'Enterprise'}
                  className={`w-full h-10 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm ${
                    currentPlan === 'Business' || currentPlan === 'Enterprise'
                      ? 'border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'bg-[#2563EB] text-white hover:brightness-110'
                  }`}
                >
                  {currentPlan === 'Business' ? 'সচল আছে' : currentPlan === 'Enterprise' ? 'ডাউনগ্রেড লক' : 'আপগ্রেড করুন (বিকাশ)'}
                </button>
              </div>

              {/* Plan 3: Enterprise */}
              <div className={`bg-white border rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between relative ${currentPlan === 'Enterprise' ? 'border-[#2563EB] ring-2 ring-blue-50/50' : ''}`}>
                {currentPlan === 'Enterprise' && (
                  <span className="absolute -top-3 left-6 bg-[#2563EB] text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Current Plan
                  </span>
                )}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-[#111827]">Enterprise Plan</h4>
                  <span className="text-xs font-extrabold text-gray-500 font-sans block">BDT ১৫,০০০ / মাস</span>
                  <p className="text-[10px] text-[#6B7280] font-semibold leading-relaxed pt-2">
                    আনলিমিটেড WhatsApp ফলোআপ, উৎসব মোড মার্কেটিং, মেকানিকাল রিকন খরচ ইন্টিগ্রেশন এবং সম্পূর্ণ এআই অপ্টিমাইজেশন।
                  </p>
                </div>
                <button 
                  onClick={() => handleStartCheckout('Enterprise')}
                  disabled={currentPlan === 'Enterprise'}
                  className={`w-full h-10 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm ${
                    currentPlan === 'Enterprise'
                      ? 'border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'bg-[#2563EB] text-white hover:brightness-110'
                  }`}
                >
                  {currentPlan === 'Enterprise' ? 'সচল আছে' : 'আপগ্রেড করুন (বিকাশ)'}
                </button>
              </div>

            </div>
          </div>

          {/* Billing / Invoice Ledger History */}
          <section className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider pl-2">বিলিং লেনদেনের ইতিহাস (Invoice Ledger)</h3>
            
            <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[10px] text-[#6B7280] uppercase font-bold">
                      <th className="p-4">রসিদ আইডি</th>
                      <th className="p-4">তারিখ</th>
                      <th className="p-4">বিবরণ / প্ল্যান</th>
                      <th className="p-4">পরিমাণ (BDT)</th>
                      <th className="p-4 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-[#111827]">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-mono text-[10px] text-gray-500">{inv.id}</td>
                        <td className="p-4 text-gray-600">{toBengaliDigits(inv.date)}</td>
                        <td className="p-4">{inv.planName}</td>
                        <td className="p-4">BDT {toBengaliDigits(inv.amount.toLocaleString())}</td>
                        <td className="p-4 text-right">
                          <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {inv.status === 'Paid' ? 'Paid ✓' : 'Pending 🔒'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </main>

      </div>

      {/* bKash Tokenized Checkout Modal Simulator */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
          
          <div className="bg-[#E2136E] w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col font-sans text-white">
            
            {/* bKash Logo Header */}
            <div className="bg-white p-4 flex justify-between items-center shrink-0 border-b border-pink-100">
              <div className="h-10 w-24 relative flex items-center justify-center text-[#E2136E] font-bold font-outfit text-base">
                bKash | গেটওয়ে
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)} 
                className="w-8 h-8 rounded-full bg-pink-50 text-[#E2136E] flex items-center justify-center hover:bg-pink-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Merchant Details Bar */}
            <div className="bg-pink-900/40 p-4 flex justify-between items-center text-xs font-bold shrink-0">
              <div className="space-y-0.5">
                <span className="text-pink-200 block text-[9px]">মার্চেন্ট: GariSale BD</span>
                <span className="text-[11px]">শোরুম সাবস্ক্রিপশন</span>
              </div>
              <div className="text-right">
                <span className="text-pink-200 block text-[9px]">পরিমাণ:</span>
                <span className="text-sm font-extrabold">BDT {toBengaliDigits(checkoutTargetPlan === 'Business' ? '৫,০০০' : '১৫,০০০')}</span>
              </div>
            </div>

            {/* Steps Container */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              
              {checkoutStep === 'phone' && (
                // Step 1: Phone Input
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <p className="text-[11px] text-pink-50 leading-relaxed font-semibold text-center">
                    বিকাশ টোকেনাইজড পেমেন্ট সম্পন্ন করতে আপনার বিকাশ একাউন্ট নম্বর দিন:
                  </p>
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      required
                      placeholder="যেমন: 017XXXXXXXX"
                      value={bkashPhone}
                      onChange={e => setBkashPhone(e.target.value)}
                      className="w-full h-11 bg-white border border-pink-200 text-[#111827] rounded-xl px-4 text-xs font-bold text-center tracking-widest focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full h-11 bg-white text-[#E2136E] rounded-xl font-extrabold hover:bg-pink-50 active:scale-95 transition-all text-xs"
                  >
                    পরবর্তী (Next)
                  </button>
                </form>
              )}

              {checkoutStep === 'otp' && (
                // Step 2: Verification Code (OTP)
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <p className="text-[11px] text-pink-50 leading-relaxed font-semibold text-center">
                    আপনার বিকাশ নম্বরে প্রেরিত ৬ ডিজিটের ওটিপি কোডটি দিন (সিমুলেশন: ১২৩৪৫৬):
                  </p>
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      maxLength={6}
                      required
                      placeholder="১২৩৪৫৬"
                      value={bkashOtp}
                      onChange={e => setBkashOtp(e.target.value)}
                      className="w-full h-11 bg-white border border-pink-200 text-[#111827] rounded-xl px-4 text-xs font-bold text-center tracking-widest focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full h-11 bg-white text-[#E2136E] rounded-xl font-extrabold hover:bg-pink-50 active:scale-95 transition-all text-xs"
                  >
                    পিন নিশ্চিত করুন (Enter PIN)
                  </button>
                </form>
              )}

              {checkoutStep === 'pin' && (
                // Step 3: PIN Input
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <p className="text-[11px] text-pink-50 leading-relaxed font-semibold text-center">
                    নিরাপদ পেমেন্ট নিশ্চিত করতে আপনার বিকাশ একাউন্টের ৫ ডিজিট পিন নম্বর দিন:
                  </p>
                  <div className="space-y-1.5">
                    <input 
                      type="password" 
                      maxLength={5}
                      required
                      placeholder="•••••"
                      value={bkashPin}
                      onChange={e => setBkashPin(e.target.value)}
                      className="w-full h-11 bg-white border border-pink-200 text-[#111827] rounded-xl px-4 text-xs font-bold text-center tracking-widest focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full h-11 bg-pink-900 text-white rounded-xl font-extrabold hover:bg-pink-950 active:scale-95 transition-all text-xs"
                  >
                    নিশ্চিত করুন (Confirm Payment)
                  </button>
                </form>
              )}

              {checkoutStep === 'success' && (
                // Step 4: Success Message
                <div className="text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 bg-white text-[#E2136E] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <span className="material-symbols-outlined text-[32px] font-bold">check_circle</span>
                  </div>
                  <h3 className="font-extrabold text-sm">পেমেন্ট সফল হয়েছে!</h3>
                  <p className="text-[10px] text-pink-50 leading-relaxed">
                    আপনার শোরুম প্ল্যানটি সফলভাবে **{checkoutTargetPlan}** প্ল্যানে আপগ্রেড করা হয়েছে।
                  </p>
                  <button 
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-full h-11 bg-white text-[#E2136E] rounded-xl font-extrabold hover:bg-pink-50 active:scale-95 transition-all text-xs mt-2"
                  >
                    ড্যাশবোর্ডে ফিরে যান
                  </button>
                </div>
              )}

            </div>

            {/* bKash Footer Helpline */}
            <div className="bg-pink-900/60 p-3 text-center text-[8px] text-pink-200 font-semibold shrink-0">
              🔒 16247 নম্বরে কল করে সাহায্য নিতে পারেন। বিকাশ কোন পিন বা ওটিপি চায় না।
            </div>

          </div>

        </div>
      )}

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
