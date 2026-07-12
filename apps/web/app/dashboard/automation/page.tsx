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

interface LogEntry {
  id: string;
  time: string;
  contact: string;
  channel: 'whatsapp' | 'facebook' | 'email' | 'sms';
  template: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Skipped';
  triggerEvent: string;
  details: string;
}

export default function AutomationHubPage() {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'facebook' | 'social' | 'marketing' | 'logs'>('whatsapp');

  // WhatsApp states
  const [waGreetingOn, setWaGreetingOn] = useState(true);
  const [waAwayOn, setWaAwayOn] = useState(false);
  const [waFollowupOn, setWaFollowupOn] = useState(true);

  // Facebook states
  const [fbAutoReplyOn, setFbAutoReplyOn] = useState(true);
  const [fbKeywords, setFbKeywords] = useState<{ word: string; template: string }[]>([
    { word: 'price', template: 'vehicle_details_pricing' },
    { word: 'location', template: 'showroom_directions' },
    { word: 'loan', template: 'emi_calculator_info' }
  ]);

  // Social states
  const [socialDays, setSocialDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [enableScheduledPosting, setEnableScheduledPosting] = useState(true);

  // Marketing states
  const [leadScoringThreshold, setLeadScoringThreshold] = useState(70);

  // Logs states
  const [logFilterChannel, setLogFilterChannel] = useState<'All' | 'WhatsApp' | 'Facebook' | 'Email' | 'SMS'>('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const logs: LogEntry[] = [
    { id: '1', time: '10:45 AM', contact: 'তানভীর হোসাইন', channel: 'whatsapp', template: 'lead_instant_reply', status: 'Delivered', triggerEvent: 'New Lead Auto-Reply', details: 'Message: "হ্যালো তানভীর হোসাইন! আপনার পছন্দের Toyota Axio 2019..." Meta Msg ID: wamid.HBgMOTE3MTEx...' },
    { id: '2', time: '09:12 AM', contact: 'রফিকুল ইসলাম', channel: 'sms', template: 'hot_lead_alert', status: 'Sent', triggerEvent: 'Lead Score Threshold Met', details: 'Message: "রফিকুল ইসলাম, আপনার জন্য আকর্ষণীয় Toyota Premio অফার..." Provider: Greenweb BD, ID: 847294' },
    { id: '3', time: 'Yesterday', contact: 'জিম রহমান', channel: 'facebook', template: 'keyword_auto_reply', status: 'Delivered', triggerEvent: 'Keyword Trigger "price"', details: 'Message: "জিম রহমান, গাড়ির বর্তমান অফিশিয়াল মূল্য BDT ১৪,৫০,০০০..."' },
    { id: '4', time: '2 days ago', contact: 'আহসান হাবিব', channel: 'email', template: 'welcome_sequence_1', status: 'Failed', triggerEvent: 'New Dealer Signup', details: 'Error: Connection Timeout with SMTP mail.garisale.com. Retry Count: 2' }
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
                const isActive = item.id === 'automation';
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

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <div>
              <h1 className="font-extrabold text-base text-[#111827] font-outfit">Automation Hub (Maestro)</h1>
              <p className="text-[10px] text-[#6B7280] font-bold">এআই দ্বারা পরিচালিত রেসপন্স ও ক্যাম্পেইন অটোমেশন</p>
            </div>
          </header>

          {/* CHANNEL SELECTOR / TABS PANEL (Horizontal layout for responsive flow) */}
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide text-xs font-bold shrink-0">
            {[
              { id: 'whatsapp', label: '💬 WhatsApp', badge: '3 rules · Connected' },
              { id: 'facebook', label: '📘 Facebook', badge: '2 rules · Connected' },
              { id: 'social', label: '📱 Social Media', badge: 'Auto-post ON' },
              { id: 'marketing', label: '📧 Marketing', badge: '2 sequences' },
              { id: 'logs', label: '📋 Logs', badge: 'Realtime' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveChannel(tab.id as any)}
                className={`px-4 py-2 rounded-full border transition-all shrink-0 text-left ${
                  activeChannel === tab.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                <div className="text-[11px]">{tab.label}</div>
                <div className={`text-[8px] font-medium block opacity-85 ${activeChannel === tab.id ? 'text-blue-100' : 'text-gray-400'}`}>
                  {tab.badge}
                </div>
              </button>
            ))}
          </div>

          <main className="p-6 flex-1 bg-[#F9FAFB] overflow-y-auto space-y-6">
            
            {/* WHATSAPP TAB VIEW */}
            {activeChannel === 'whatsapp' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Connection Status Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      WhatsApp Business API Connected ✅
                    </span>
                    <h3 className="font-bold text-xs text-[#111827] pt-1">Dhaka Premium Motors Official</h3>
                    <p className="text-[10px] text-[#6B7280] font-semibold">Token Expires in: ৪৭ দিন (expires 2026-08-30)</p>
                  </div>
                  <button className="bg-gray-100 text-[#111827] px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all">
                    Reconnect
                  </button>
                </div>

                {/* Rule Cards */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <h3 className="font-extrabold text-xs text-[#6B7280] uppercase tracking-wider">বেসিক রুলস</h3>

                  {/* Greeting message */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#111827]">শুভেচ্ছা বার্তা (Greeting Message)</h4>
                        <span className="bg-blue-50 text-[#2563EB] text-[8px] font-bold px-1.5 py-0.5 rounded">Auto</span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] leading-relaxed max-w-sm">
                        "হ্যালো! ঢাকা প্রিমিয়াম মটরস-এ আপনাকে স্বাগতম। আমরা কীভাবে আপনাকে সাহায্য করতে পারি?"
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={waGreetingOn} onChange={e => setWaGreetingOn(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  {/* Away message */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#111827]">অনুপস্থিতি বার্তা (Away Message)</h4>
                      <p className="text-[10px] text-[#6B7280] leading-relaxed max-w-sm">
                        "ধন্যবাদ আমাদের মেসেজ দেওয়ার জন্য। আমাদের অফিস আওয়ার সকাল ৯টা থেকে সন্ধ্যা ৬টা..."
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={waAwayOn} onChange={e => setWaAwayOn(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  {/* Quick replies */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-[#111827]">Quick Replies (১০টি সংরক্ষিত)</h4>
                      <span className="text-[9px] text-[#6B7280] block font-semibold mt-0.5">১. শোরুমের ঠিকানা · ২. টেস্ট ড্রাইভ বুকিং · ৩. ইএমআই স্কিম</span>
                    </div>
                    <button className="border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0">
                      সম্পাদনা করুন
                    </button>
                  </div>
                </div>

                {/* Lead follow up sequence */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">লিড ফলো-আপ সিকোয়েন্স (Lead Follow-up Sequence)</h3>
                      <span className="text-[9px] text-orange-600 font-bold block mt-0.5">৪টি ধাপ কনফিগার করা হয়েছে</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={waFollowupOn} onChange={e => setWaFollowupOn(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="relative py-4 flex items-center justify-between">
                    <div className="absolute left-0 right-0 h-0.5 bg-gray-200 z-0" />
                    {[
                      { step: 'Day 0', label: 'Instant' },
                      { step: 'Day 1', label: 'Followup' },
                      { step: 'Day 3', label: 'TestDrive' },
                      { step: 'Day 7', label: 'Expires' }
                    ].map((dot, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center bg-[#F9FAFB] px-2">
                        <div className="w-5 h-5 rounded-full bg-[#2563EB] border-4 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-[9px] font-bold text-[#111827] mt-1">{dot.step}</span>
                        <span className="text-[8px] text-[#6B7280] font-semibold">{dot.label}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full h-10 border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] rounded-xl font-bold text-xs transition-all shadow-sm">
                    সিকোয়েন্স এডিট করুন (Edit Sequence)
                  </button>
                </div>

                {/* Third-party adapters */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
                  <h3 className="font-extrabold text-xs text-[#6B7280] uppercase tracking-wider">থার্ড-পার্টি কানেকশন</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['ManyChat', 'AiSensy'].map((provider) => (
                      <div key={provider} className="border border-[#E5E7EB] p-3.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111827]">{provider}</span>
                        <button className="bg-[#2563EB] text-white px-3 py-1 rounded text-[9px] font-bold hover:brightness-110">
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FACEBOOK TAB VIEW */}
            {activeChannel === 'facebook' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Facebook Page Connected ✅
                    </span>
                    <h3 className="font-bold text-xs text-[#111827] pt-1">Dhaka Premium Motors Official Page</h3>
                    <p className="text-[10px] text-[#6B7280] font-semibold">Instagram: Connected (@dhakapremiummotors)</p>
                  </div>
                  <button className="bg-red-50 text-red-600 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">
                    Disconnect
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <h3 className="font-extrabold text-xs text-[#6B7280] uppercase tracking-wider">মেসেঞ্জার অটো-রেপ্লাই ও কিওয়ার্ডস</h3>
                  
                  <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#111827]">ইনস্ট্যান্ট মেসেঞ্জার রিপ্লাই</h4>
                      <p className="text-[10px] text-[#6B7280]">"মেসেজ দেওয়ার জন্য ধন্যবাদ! আমাদের প্রতিনিধি শীঘ্রই যোগাযোগ করবেন।"</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={fbAutoReplyOn} onChange={e => setFbAutoReplyOn(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-[#111827]">কীওয়ার্ড রুলস (Keyword Triggers)</h4>
                    {fbKeywords.map((k, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b pb-2">
                        <div>
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[#111827]">{k.word}</span>
                          <span className="text-[#6B7280] text-[10px] ml-2">→ {k.template}</span>
                        </div>
                        <button className="text-red-600 hover:text-red-700 font-bold text-[10px]">Delete</button>
                      </div>
                    ))}
                    <button className="text-xs text-[#2563EB] font-bold hover:underline">+ কীওয়ার্ড যোগ করুন</button>
                  </div>
                </div>
              </div>
            )}

            {/* SOCIAL MEDIA TAB VIEW */}
            {activeChannel === 'social' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">সোশ্যাল ক্যাম্পেইন সিডিউলার</h3>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={enableScheduledPosting} onChange={e => setEnableScheduledPosting(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs font-semibold text-[#111827]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B7280]">১. পোস্ট ফ্রিকোয়েন্সি (প্রতি সপ্তাহে)</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPostsPerWeek(Math.max(1, postsPerWeek - 1))} className="w-6 h-6 border rounded">-</button>
                        <span>{toBengaliDigits(postsPerWeek)}টি</span>
                        <button onClick={() => setPostsPerWeek(postsPerWeek + 1)} className="w-6 h-6 border rounded">+</button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[#6B7280] block">২. পোস্ট করার দিনসমূহ</span>
                      <div className="flex gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const isSelected = socialDays.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                if (isSelected) setSocialDays(socialDays.filter(d => d !== day));
                                else setSocialDays([...socialDays, day]);
                              }}
                              className={`w-10 h-8 rounded border text-[10px] font-bold transition-all ${
                                isSelected ? 'bg-blue-50 border-[#2563EB] text-[#2563EB]' : 'bg-white text-gray-500 border-gray-200'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Queue list table */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">পোস্ট কিউ (Post Queue)</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 border-b pb-3">
                      <div className="w-10 h-8 bg-gray-100 rounded overflow-hidden shrink-0">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1" alt="Car" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-xs text-[#111827] truncate">Toyota Axio 2019</span>
                        <span className="text-[9px] text-[#6B7280] font-semibold">Scheduled: Tue 09:00 AM</span>
                      </div>
                      <span className="bg-blue-50 text-[#2563EB] text-[9px] font-bold px-2 py-0.5 rounded">Scheduled</span>
                    </div>

                    <div className="flex items-center gap-3 border-b pb-3">
                      <div className="w-10 h-8 bg-gray-100 rounded overflow-hidden shrink-0">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1" alt="Car" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-xs text-[#111827] truncate">Toyota Premio 2017</span>
                        <span className="text-[9px] text-[#6B7280] font-semibold">Scheduled: Thu 09:00 AM</span>
                      </div>
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded">Approval Req</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MARKETING TAB VIEW */}
            {activeChannel === 'marketing' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Lead scoring scale graphic */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">লিড স্কোরিং কনফিগারেশন</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B7280] font-bold">Hot Lead থ্রেশহোল্ড স্কোর</span>
                      <span className="font-extrabold text-[#2563EB]">{toBengaliDigits(leadScoringThreshold)} Points</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="90" 
                      value={leadScoringThreshold} 
                      onChange={e => setLeadScoringThreshold(Number(e.target.value))}
                      className="w-full accent-[#2563EB] h-1.5 rounded bg-gray-200"
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-[#6B7280] uppercase tracking-wide">
                    <span>Cold (0-40)</span>
                    <span>Warm (40-70)</span>
                    <span>Hot (70-100)</span>
                  </div>
                </div>

                {/* Email campaigns sequence cards */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">ইমেইল সিকোয়েন্স (Email Sequences)</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <span className="font-bold text-xs text-[#111827] block">Welcome / New Lead Sequence</span>
                        <span className="text-[9px] text-[#6B7280] block font-semibold">৩টি ইমেইল · শেষ পাঠানো হয়েছে গতকাল</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded">Active</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs text-[#111827] block">Post-Sale Followup Sequence</span>
                        <span className="text-[9px] text-[#6B7280] block font-semibold">২টি ইমেইল · রিভিউ সংগ্রহ টেমপ্লেট</span>
                      </div>
                      <span className="bg-gray-100 text-[#6B7280] text-[9px] font-bold px-2 py-0.5 rounded">Inactive</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AUTOMATION LOGS TAB VIEW */}
            {activeChannel === 'logs' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Aggregate stats summary card */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm grid grid-cols-4 gap-2 text-center">
                  <div>
                    <span className="block text-[8px] font-bold text-[#6B7280] uppercase">মোট মেসেজ</span>
                    <span className="text-sm font-extrabold text-[#111827]">{toBengaliDigits(847)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#6B7280] uppercase">ডেলিভারি</span>
                    <span className="text-sm font-extrabold text-green-600">{toBengaliDigits(94)}%</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#6B7280] uppercase">ফেইলর</span>
                    <span className="text-sm font-extrabold text-red-600">{toBengaliDigits(1.2)}%</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#6B7280] uppercase">অপ্ট-আউট</span>
                    <span className="text-sm font-extrabold text-gray-500">{toBengaliDigits(2)}</span>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-gray-150 flex gap-3 text-[10px] font-bold overflow-x-auto scrollbar-hide">
                  <select 
                    value={logFilterChannel} 
                    onChange={e => setLogFilterChannel(e.target.value as any)}
                    className="border border-[#E5E7EB] rounded px-2 h-7 bg-white"
                  >
                    <option value="All">All Channels</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                  </select>

                  <select className="border border-[#E5E7EB] rounded px-2 h-7 bg-white">
                    <option>All Statuses</option>
                    <option>Sent</option>
                    <option>Delivered</option>
                    <option>Failed</option>
                  </select>
                </div>

                {/* Log List Table */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden text-xs">
                  <div className="divide-y divide-gray-150">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                          <div 
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="flex justify-between items-center gap-3 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#111827]">{log.contact}</span>
                                <span className="text-[10px] text-[#6B7280] font-mono">{log.time}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 font-semibold block pt-0.5">{log.triggerEvent}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">{log.channel}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                log.status === 'Delivered' || log.status === 'Sent'
                                  ? 'bg-green-50 text-green-600'
                                  : log.status === 'Failed'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-gray-100 text-[#6B7280]'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/80 p-3 rounded-lg text-[10px] font-semibold text-[#6B7280] space-y-2 animate-in slide-in-from-top-1 duration-200">
                              <p className="text-[#111827]">{log.details}</p>
                              <div className="flex justify-between text-[9px] font-bold">
                                <span>Template: {log.template}</span>
                                <Link href="/dashboard/leads/1" className="text-[#2563EB] hover:underline">
                                  লিড ভিউ →
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

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
