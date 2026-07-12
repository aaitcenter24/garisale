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

// BDT formatting helper
function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '৳ ').replace('Rs', '৳ ');
}

interface TeamMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Salesperson';
  email: string;
  status: 'Active' | 'Pending';
}

export default function SettingsDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'subscription' | 'notifications'>('profile');

  // Business Profile form states
  const [businessName, setBusinessName] = useState('Dhaka Premium Motors');
  const [dealerBio, setDealerBio] = useState('আপনার বিশ্বস্ত ব্যবহৃত গাড়ি আমদানিকারক ও ডিলার।');
  const [showroomAddress, setShowroomAddress] = useState('H-24, Road-11, Banani, Dhaka');
  const [personalWebsite, setPersonalWebsite] = useState('https://dhakapremium.garisale.com');
  const [phone, setPhone] = useState('01711223344');
  const [whatsapp, setWhatsapp] = useState('01711223344');
  const [facebook, setFacebook] = useState('https://facebook.com/dhakapremiummotors');
  const [youtube, setYoutube] = useState('https://youtube.com/c/dhakapremiummotors');
  const [instagram, setInstagram] = useState('https://instagram.com/dhakapremiummotors');

  // Team state
  const [team, setTeam] = useState<TeamMember[]>([
    { id: '1', name: 'তানভীর রহমান', role: 'Owner', email: 'owner@dhakamotors.com', status: 'Active' },
    { id: '2', name: 'আরিফ হাসান', role: 'Manager', email: 'arif@dhakamotors.com', status: 'Active' },
    { id: '3', name: 'রাকিব উল্লাহ', role: 'Salesperson', email: 'rakib@dhakamotors.com', status: 'Active' }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Salesperson');

  // Subscription state
  const currentPlan = {
    name: 'Professional Pro',
    price: 4999,
    billingPeriod: 'Monthly',
    nextBilling: '2026-08-13'
  };

  const invoiceHistory = [
    { id: 'INV-2026-003', date: '2026-07-13', amount: 4999, status: 'Paid' },
    { id: 'INV-2026-002', date: '2026-06-13', amount: 4999, status: 'Paid' },
    { id: 'INV-2026-001', date: '2026-05-13', amount: 4999, status: 'Paid' }
  ];

  // Notification toggles
  const [notifyNewLeads, setNotifyNewLeads] = useState(true);
  const [notifySlaWarning, setNotifySlaWarning] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(false);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newMember: TeamMember = {
      id: String(team.length + 1),
      name: inviteName,
      role: inviteRole,
      email: inviteEmail,
      status: 'Pending'
    };

    setTeam([...team, newMember]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-[#6B7280] hover:text-[#111827]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          পেছনে
        </button>
        <span className="font-extrabold text-sm text-[#111827] font-outfit">শোরুম সেটিংস</span>
        <div className="w-10" />
      </header>

      {/* Main Settings Navigation Panel */}
      <main className="max-w-lg mx-auto w-full p-6 space-y-6">
        
        {/* Settings Tab Selector */}
        <div className="flex bg-white rounded-xl border border-[#E5E7EB] p-1 text-xs font-bold shadow-sm overflow-x-auto scrollbar-hide shrink-0">
          {[
            { id: 'profile', label: 'ব্যবসার প্রোফাইল' },
            { id: 'team', label: 'টিম' },
            { id: 'subscription', label: 'সাবস্ক্রিপশন' },
            { id: 'notifications', label: 'নোটিফিকেশন' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-center transition-all shrink-0 ${
                activeTab === tab.id ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Business Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#111827] border-b pb-2">প্রোফাইল তথ্য</h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">শোরুমের নাম</label>
                <input 
                  type="text" 
                  value={businessName} 
                  onChange={e => setBusinessName(e.target.value)} 
                  className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-semibold text-[#111827]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">শোরুম বায়ো (Bio)</label>
                <textarea 
                  value={dealerBio} 
                  onChange={e => setDealerBio(e.target.value)} 
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ঠিকানা</label>
                <input 
                  type="text" 
                  value={showroomAddress} 
                  onChange={e => setShowroomAddress(e.target.value)} 
                  className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-semibold text-[#111827]"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#111827] border-b pb-2">যোগাযোগ ও সোশ্যাল মিডিয়া</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মোবাইল</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">WhatsApp</label>
                  <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" />
                </div>
              </div>

              {/* Personal website Highlighted widget */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2">
                <span className="block text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">ডিলারের পার্সোনাল ওয়েবসাইট</span>
                <input 
                  type="text" 
                  value={personalWebsite} 
                  onChange={e => setPersonalWebsite(e.target.value)} 
                  className="w-full h-9 bg-white border border-blue-200 rounded-lg px-3 text-xs text-[#111827] font-bold focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                />
                <span className="text-[9px] text-[#6B7280] block font-semibold">
                  ℹ️ এই ওয়েবসাইটটি GariSale প্ল্যাটফর্মে তৈরি এবং কাস্টম ডোমেইন ম্যাপিং সহ সচল আছে।
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Facebook Link</label>
                  <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">YouTube Link</label>
                  <input type="text" value={youtube} onChange={e => setYoutube(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Instagram Link</label>
                  <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" />
                </div>
              </div>

              <button className="w-full h-10 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2">
                প্রোফাইল সেভ করুন
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Team Members */}
        {activeTab === 'team' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-[#111827]">টিম মেম্বার লিস্ট</h3>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="bg-[#2563EB] text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
              >
                + মেম্বার যুক্ত করুন
              </button>
            </div>

            <div className="divide-y divide-gray-150">
              {team.map((member) => (
                <div key={member.id} className="py-3 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <span className="block font-bold text-[#111827]">{member.name}</span>
                    <span className="text-[10px] text-[#6B7280]">{member.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="bg-gray-100 text-[#111827] px-2 py-0.5 rounded text-[10px] font-bold inline-block">
                      {member.role}
                    </span>
                    <span className={`block text-[9px] mt-1 font-bold ${member.status === 'Active' ? 'text-green-600' : 'text-orange-500'}`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Subscription & Billing */}
        {activeTab === 'subscription' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Current Plan Card */}
            <div className="bg-[#EFF6FF] border border-[#2563EB]/30 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[9px] font-bold text-[#2563EB] uppercase tracking-wider">অ্যাক্টিভ প্ল্যান</span>
                  <h3 className="text-xl font-extrabold text-[#111827] font-outfit mt-1">{currentPlan.name}</h3>
                </div>
                <span className="bg-[#2563EB] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-blue-100 text-[#111827]">
                <div>
                  <span className="text-[#6B7280] text-[9px] block uppercase">বিলিং সাইকেল</span>
                  <span>{currentPlan.billingPeriod}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] text-[9px] block uppercase">পরবর্তী বিলিং ডেট</span>
                  <span>{toBengaliDigits(currentPlan.nextBilling)}</span>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#111827] border-b pb-2">ইনভয়েস হিস্ট্রি</h3>
              
              <div className="space-y-3">
                {invoiceHistory.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center text-xs font-semibold border-b pb-2">
                    <div>
                      <span className="block font-bold text-[#111827]">{inv.id}</span>
                      <span className="text-[10px] text-[#6B7280]">{toBengaliDigits(inv.date)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-[#111827]">{formatBDT(inv.amount)}</span>
                      <span className="text-[9px] text-green-600 font-bold block mt-0.5">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Notifications Settings */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 animate-in fade-in duration-300">
            <h3 className="font-bold text-sm text-[#111827] border-b pb-2">নোটিফিকেশন অন/অফ করুন</h3>

            <div className="space-y-4">
              {[
                { label: 'নতুন লিড আসলে অ্যালার্ট পাঠান', checked: notifyNewLeads, setter: setNotifyNewLeads },
                { label: 'SLA সতর্কতা বার্তা পাঠান (লিড ২ ঘণ্টা যোগাযোগহীন থাকলে)', checked: notifySlaWarning, setter: setNotifySlaWarning },
                { label: 'সাপ্তাহিক ওনার সামারি রিপোর্ট ইমেইল করুন', checked: notifyWeeklyReport, setter: setNotifyWeeklyReport }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs font-bold text-[#111827]">
                  <span>{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={e => item.setter(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Invite Member Dialog Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit">টিম মেম্বার যুক্ত করুন</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মেম্বারের নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আরিফ ইসলাম"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ইমেইল অ্যাড্রেস</label>
                <input
                  type="email"
                  required
                  placeholder="যেমন: arif@dhakamotors.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">রোল (Role)</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827]"
                >
                  <option value="Salesperson">Salesperson</option>
                  <option value="Manager">Manager</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2"
              >
                আমন্ত্রণ পাঠান (Invite)
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
