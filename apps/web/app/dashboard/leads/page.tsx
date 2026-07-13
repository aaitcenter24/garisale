'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  carInterest: string;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Test Drive' | 'Quote Sent' | 'Negotiation' | 'Closed' | 'Lost';
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  timeInStage: string;
  hoursUncontacted: number;
  dateAdded: string;
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'রফিক হাসান', phone: '01711-223344', carInterest: 'Toyota Axio 2019', stage: 'New', score: 85, priority: 'hot', timeInStage: '১০ মিনিট আগে', hoursUncontacted: 0.2, dateAdded: '2026-07-13T02:50:00' },
  { id: '2', name: 'জামিল আহমেদ', phone: '01822-334455', carInterest: 'Honda Fit 2018', stage: 'Contacted', score: 62, priority: 'warm', timeInStage: '৩ ঘণ্টা আগে', hoursUncontacted: 3, dateAdded: '2026-07-13T00:10:00' },
  { id: '3', name: 'করিম উল্লাহ', phone: '01933-445566', carInterest: 'Toyota Premio 2017', stage: 'Qualified', score: 45, priority: 'cold', timeInStage: '৫ ঘণ্টা আগে', hoursUncontacted: 5, dateAdded: '2026-07-12T22:15:00' },
  { id: '4', name: 'সাদিয়া রহমান', phone: '01544-556677', carInterest: 'Nissan X-Trail 2019', stage: 'Test Drive', score: 92, priority: 'hot', timeInStage: '২.৫ ঘণ্টা আগে', hoursUncontacted: 2.5, dateAdded: '2026-07-13T00:40:00' },
  { id: '5', name: 'আবুল কালাম', phone: '01655-667788', carInterest: 'Toyota Axio 2019', stage: 'Negotiation', score: 78, priority: 'hot', timeInStage: '৩০ মিনিট আগে', hoursUncontacted: 0.5, dateAdded: '2026-07-13T02:30:00' },
  { id: '6', name: 'ফারহানা ইসলাম', phone: '01366-778899', carInterest: 'Toyota Harrier 2020', stage: 'New', score: 95, priority: 'hot', timeInStage: '৪ ঘণ্টা আগে', hoursUncontacted: 4, dateAdded: '2026-07-12T23:10:00' },
  { id: '7', name: 'জহিরুল হক', phone: '01477-889900', carInterest: 'Honda Grace 2018', stage: 'Closed', score: 80, priority: 'hot', timeInStage: '১ দিন আগে', hoursUncontacted: 24, dateAdded: '2026-07-12T02:10:00' },
  { id: '8', name: 'মাহবুব আলম', phone: '01788-990011', carInterest: 'Suzuki Swift 2018', stage: 'Lost', score: 32, priority: 'cold', timeInStage: '২ দিন আগে', hoursUncontacted: 48, dateAdded: '2026-07-11T02:10:00' }
];

export default function LeadPipelineCRM() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'contacted' | 'hot' | 'followup'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'stage'>('score');
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [leadsScope, setLeadsScope] = useState<'my' | 'all'>('my');
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostLeadId, setLostLeadId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('দামে মেলেনি (Price)');
  const [pendingStage, setPendingStage] = useState<Lead['stage'] | null>(null);

  // Form states for new lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCar, setNewLeadCar] = useState('Toyota Axio');

  // SLA Count: uncontacted > 2h (in stages 'New' or 'Contacted' or 'Qualified')
  const slaWarningLeadsCount = useMemo(() => {
    return leads.filter(l => l.hoursUncontacted >= 2 && ['New', 'Contacted', 'Qualified'].includes(l.stage)).length;
  }, [leads]);

  // Stage mapping
  const stages: Lead['stage'][] = ['New', 'Contacted', 'Qualified', 'Test Drive', 'Quote Sent', 'Negotiation', 'Closed', 'Lost'];

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // Apply filters
    if (activeFilter === 'new') {
      result = result.filter(l => l.stage === 'New');
    } else if (activeFilter === 'contacted') {
      result = result.filter(l => l.stage === 'Contacted');
    } else if (activeFilter === 'hot') {
      result = result.filter(l => l.priority === 'hot');
    } else if (activeFilter === 'followup') {
      result = result.filter(l => l.hoursUncontacted >= 2 && ['New', 'Contacted'].includes(l.stage));
    }

    // Apply Sorting
    if (sortBy === 'score') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    } else if (sortBy === 'stage') {
      result.sort((a, b) => a.stage.localeCompare(b.stage));
    }

    return result;
  }, [leads, activeFilter, sortBy]);

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    const newLead: Lead = {
      id: String(leads.length + 1),
      name: newLeadName,
      phone: newLeadPhone,
      carInterest: newLeadCar,
      stage: 'New',
      score: 75,
      priority: 'hot',
      timeInStage: '১ মিনিট আগে',
      hoursUncontacted: 0.01,
      dateAdded: new Date().toISOString()
    };

    setLeads([newLead, ...leads]);
    setNewLeadName('');
    setNewLeadPhone('');
    setShowAddLeadModal(false);
  };

  const handleMoveStage = (leadId: string, newStage: Lead['stage']) => {
    if (newStage === 'Lost') {
      setLostLeadId(leadId);
      setPendingStage(newStage);
      setShowLostReasonModal(true);
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    }
  };

  const handleLostReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostLeadId || !pendingStage) return;
    setLeads(prev => prev.map(l => l.id === lostLeadId ? { ...l, stage: pendingStage } : l));
    setShowLostReasonModal(false);
    setLostLeadId(null);
    setPendingStage(null);
  };

  // Avatar priority color helpers
  const getPriorityConfig = (priority: Lead['priority']) => {
    switch (priority) {
      case 'hot':
        return 'bg-red-100 text-red-600 border border-red-200';
      case 'warm':
        return 'bg-orange-100 text-orange-600 border border-orange-200';
      case 'cold':
        return 'bg-blue-100 text-blue-600 border border-blue-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-blue-600';
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Impersonation alert */}
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
                const isActive = item.id === 'leads';
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

        {/* MAIN CRM WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Bar with View Toggle */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <h1 className="font-extrabold text-base text-[#111827] font-outfit">লিড পাইপলাইন / CRM</h1>
            
            <div className="flex items-center gap-3">
              {/* Scope Toggle (RBAC context: Salesperson default = My Leads only) */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px] font-bold">
                <button
                  onClick={() => setLeadsScope('my')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    leadsScope === 'my' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#6B7280]'
                  }`}
                >
                  My Leads
                </button>
                <button
                  onClick={() => setLeadsScope('all')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    leadsScope === 'all' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#6B7280]'
                  }`}
                >
                  All Leads
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'list' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'kanban' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
                  🗂️ Kanban
                </button>
              </div>
            </div>
          </header>

          {/* SLA Warning Banner */}
          {slaWarningLeadsCount > 0 && (
            <div className="bg-orange-50 border-b border-orange-100 px-6 py-3 text-xs font-bold text-orange-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>
                ⚠️ {toBengaliDigits(slaWarningLeadsCount)} টি লিড ২ ঘণ্টার বেশি সময় ধরে যোগাযোগহীন — এখনই call করুন।
              </span>
            </div>
          )}

          {/* CRM Dashboard Scroll viewport */}
          <main className="p-6 space-y-6 flex-1 bg-[#F9FAFB] overflow-y-auto">
            
            {/* VIEW MODE 1: CRM LIST VIEW (Mobile Default) */}
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide text-xs font-bold">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'new', label: 'New 🔴' },
                    { id: 'contacted', label: 'Contacted' },
                    { id: 'hot', label: 'Hot 🔥' },
                    { id: 'followup', label: 'Follow-up Due' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={`px-4 py-2 rounded-full border transition-all shrink-0 ${
                        activeFilter === tab.id
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort Bar */}
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                  <span>লিড ফিল্টার ফলাফল ({toBengaliDigits(filteredAndSortedLeads.length)})</span>
                  <div className="flex items-center gap-2">
                    <span>Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-[#111827] focus:outline-none cursor-pointer"
                    >
                      <option value="score">Score ↓</option>
                      <option value="date">Date ↓</option>
                      <option value="stage">Stage</option>
                    </select>
                  </div>
                </div>

                {/* Leads Stack */}
                <div className="space-y-3">
                  {filteredAndSortedLeads.map((lead) => {
                    const priorityClass = getPriorityConfig(lead.priority);
                    const initials = lead.name.split(' ').map(n => n[0]).join('');
                    return (
                      <div 
                        key={lead.id} 
                        className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow relative overflow-hidden group"
                      >
                        {/* Lead priority border indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          lead.priority === 'hot' ? 'bg-red-500' : lead.priority === 'warm' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />

                        {/* Left Initials Circle */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${priorityClass}`}>
                          {initials}
                        </div>

                        {/* Center Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827] text-sm truncate">{lead.name}</span>
                            <span className="text-[10px] text-[#6B7280]">{lead.phone}</span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">{lead.carInterest}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-blue-50 text-[#2563EB] text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {lead.stage}
                            </span>
                            <span className="text-[9px] text-[#6B7280]">{lead.timeInStage}</span>
                          </div>
                        </div>

                        {/* Right Lead Score and WhatsApp CTA */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Score</span>
                            <span className={`block text-lg font-extrabold font-outfit ${getScoreColor(lead.score)}`}>
                              {toBengaliDigits(lead.score)}
                            </span>
                          </div>
                          
                          <Link 
                            href={`https://wa.me/${lead.phone.replace('-', '')}?text=${encodeURIComponent(`হ্যালো ${lead.name}! আমি ঢাকা প্রিমিয়াম মটরস থেকে তানভীর বলছি। আপনার পছন্দের ${lead.carInterest} সম্পর্কে...`)}`}
                            target="_blank"
                            className="w-11 h-11 bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0"
                          >
                            <span className="material-symbols-outlined text-[20px]">chat</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VIEW MODE 2: KANBAN PIPELINE VIEW (Desktop Default) */
              <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-12rem)] scrollbar-thin">
                {stages.map((stage) => {
                  const stageLeads = leads.filter(l => l.stage === stage);
                  return (
                    <div 
                      key={stage} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const leadId = e.dataTransfer.getData('text/plain');
                        handleMoveStage(leadId, stage);
                      }}
                      className="w-72 bg-gray-50/50 rounded-2xl border border-[#E5E7EB] flex flex-col shrink-0"
                    >
                      {/* Column Header */}
                      <div className="p-4 border-b border-[#E5E7EB] bg-white rounded-t-2xl flex items-center justify-between font-bold text-xs text-[#111827]">
                        <span>{stage}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[#6B7280]">
                          {toBengaliDigits(stageLeads.length)}
                        </span>
                      </div>

                      {/* Leads Column Stack */}
                      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        {stageLeads.map((lead) => (
                          <div 
                            key={lead.id} 
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', lead.id);
                            }}
                            className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm space-y-3 hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing"
                          >
                            {/* Score badge & Name */}
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[#111827] text-xs">{lead.name}</span>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                                lead.score > 70 ? 'bg-red-500' : 'bg-orange-500'
                              }`}>
                                {toBengaliDigits(lead.score)}
                              </span>
                            </div>

                            {/* Car Interest */}
                            <p className="text-[10px] text-[#6B7280] font-medium">{lead.carInterest}</p>

                            {/* Time indicator & WhatsApp CTA */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="text-[9px] text-[#6B7280]">{lead.timeInStage}</span>
                              <Link 
                                href={`https://wa.me/${lead.phone.replace('-', '')}?text=${encodeURIComponent(`হ্যালো ${lead.name}! আমি ঢাকা প্রিমিয়াম মটরস থেকে তানভীর বলছি। আপনার পছন্দের ${lead.carInterest} সম্পর্কে...`)}`}
                                target="_blank"
                                className="w-8 h-8 bg-[#16A34A] rounded-full flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]">chat</span>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* FAB BUTTON (Mobile, Bottom Right) */}
      <button 
        onClick={() => setShowAddLeadModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-xl hover:brightness-110 active:scale-95 transition-all z-40 md:bottom-6"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* Add Lead Dialog Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit">নতুন লিড যুক্ত করুন</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddLeadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ক্রেতার নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রফিক ইসলাম"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মোবাইল নম্বর</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 01711223344"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">আগ্রহের গাড়ি</label>
                <select
                  value={newLeadCar}
                  onChange={(e) => setNewLeadCar(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827]"
                >
                  <option value="Toyota Axio 2019">Toyota Axio 2019</option>
                  <option value="Honda Fit 2018">Honda Fit 2018</option>
                  <option value="Nissan X-Trail 2019">Nissan X-Trail 2019</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2"
              >
                লিড যুক্ত করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Lost Reason Modal */}
      {showLostReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit text-red-600">🚨 Lost হওয়ার কারণ নির্বাচন করুন</h3>
              <p className="text-[10px] text-[#6B7280] font-bold mt-1">লিডটি হারিয়ে যাওয়ার কারণ জানানো বাধ্যতামূলক।</p>
            </div>
            
            <form onSubmit={handleLostReasonSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">কারণ (Reason)</label>
                <select
                  required
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-2 text-xs text-[#111827] font-bold focus:ring-1 focus:ring-red-500 focus:outline-none"
                >
                  <option value="দামে মেলেনি (Price)">দামে মেলেনি (Price)</option>
                  <option value="অন্য ব্র্যান্ড কিনেছে (Bought Else)">অন্য ব্র্যান্ড কিনেছে (Bought Else)</option>
                  <option value="লোন অনুমোদন হয়নি (Finance Rejected)">লোন অনুমোদন হয়নি (Finance Rejected)</option>
                  <option value="যোগাযোগ করা যায়নি (Ghosted)">যোগাযোগ করা যায়নি (Ghosted)</option>
                  <option value="অন্যান্য (Other)">অন্যান্য (Other)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-xs shadow-md"
              >
                নিশ্চিত করুন (Confirm)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION (Tab bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car', path: '/dashboard/inventory' },
          { id: 'leads', label: 'Leads', icon: 'groups', path: '/dashboard/leads' },
          { id: 'deals', label: 'Deals', icon: 'handshake', path: '/dashboard/deals' },
          { id: 'more', label: 'More', icon: 'menu', path: '/dashboard' }
        ].map((tab) => {
          const isActive = tab.id === 'leads';
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
