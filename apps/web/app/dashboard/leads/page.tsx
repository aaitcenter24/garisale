'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  budget: number;
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'রফিক হাসান', phone: '01711-223344', carInterest: 'Toyota Axio 2019', stage: 'New', score: 85, priority: 'hot', timeInStage: '১০ মিনিট আগে', hoursUncontacted: 0.2, dateAdded: '2026-07-13T02:50:00', budget: 1450000 },
  { id: '2', name: 'জামিল আহমেদ', phone: '01822-334455', carInterest: 'Honda Fit 2018', stage: 'Contacted', score: 62, priority: 'warm', timeInStage: '৩ ঘণ্টা আগে', hoursUncontacted: 3, dateAdded: '2026-07-13T00:10:00', budget: 1250000 },
  { id: '3', name: 'করিম উল্লাহ', phone: '01933-445566', carInterest: 'Toyota Premio 2017', stage: 'Qualified', score: 45, priority: 'cold', timeInStage: '৫ ঘণ্টা আগে', hoursUncontacted: 5, dateAdded: '2026-07-12T22:15:00', budget: 2300000 },
  { id: '4', name: 'সাদিয়া রহমান', phone: '01544-556677', carInterest: 'Nissan X-Trail 2019', stage: 'Test Drive', score: 92, priority: 'hot', timeInStage: '২.৫ ঘণ্টা আগে', hoursUncontacted: 2.5, dateAdded: '2026-07-13T00:40:00', budget: 2850000 },
  { id: '5', name: 'আবুল কালাম', phone: '01655-667788', carInterest: 'Toyota Axio 2019', stage: 'Negotiation', score: 78, priority: 'hot', timeInStage: '৩০ মিনিট আগে', hoursUncontacted: 0.5, dateAdded: '2026-07-13T02:30:00', budget: 1400000 },
  { id: '6', name: 'ফারহানা ইসলাম', phone: '01366-778899', carInterest: 'Toyota Harrier 2020', stage: 'New', score: 95, priority: 'hot', timeInStage: '৪ ঘণ্টা আগে', hoursUncontacted: 4, dateAdded: '2026-07-12T23:10:00', budget: 4200000 },
  { id: '7', name: 'জহিরুল হক', phone: '01477-889900', carInterest: 'Honda Grace 2018', stage: 'Closed', score: 80, priority: 'hot', timeInStage: '১ দিন আগে', hoursUncontacted: 24, dateAdded: '2026-07-12T02:10:00', budget: 1650000 },
  { id: '8', name: 'মাহবুব আলম', phone: '01788-990011', carInterest: 'Suzuki Swift 2018', stage: 'Lost', score: 32, priority: 'cold', timeInStage: '২ দিন আগে', hoursUncontacted: 48, dateAdded: '2026-07-11T02:10:00', budget: 950000 }
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

  // Global Quality States
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  // Toast Notification System
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'error' ? 5000 : 3000);
  };

  // Form states for new lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCar, setNewLeadCar] = useState('Toyota Axio 2019');
  const [newLeadBudget, setNewLeadBudget] = useState('');

  // SLA Count: uncontacted >= 2h
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

    const budgetVal = Number(newLeadBudget) || 1200000;

    const newLead: Lead = {
      id: String(leads.length + 1),
      name: newLeadName,
      phone: newLeadPhone,
      carInterest: newLeadCar,
      stage: 'New',
      score: 75,
      priority: 'hot',
      timeInStage: '১০ মিনিট আগে',
      hoursUncontacted: 0.01,
      dateAdded: new Date().toISOString(),
      budget: budgetVal
    };

    setLeads([newLead, ...leads]);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadBudget('');
    setShowAddLeadModal(false);
    addToast('success', 'লিড সেভ হয়েছে');
  };

  const handleMoveStage = (leadId: string, newStage: Lead['stage']) => {
    if (newStage === 'Lost') {
      setLostLeadId(leadId);
      setPendingStage(newStage);
      setShowLostReasonModal(true);
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
      addToast('success', `লিড স্টেজ পরিবর্তন করা হয়েছে: ${newStage}`);
    }
  };

  const handleLostReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostLeadId || !pendingStage) return;
    setLeads(prev => prev.map(l => l.id === lostLeadId ? { ...l, stage: pendingStage } : l));
    setShowLostReasonModal(false);
    setLostLeadId(null);
    setPendingStage(null);
    addToast('error', `লিড ড্রপ করা হয়েছে। কারণ: ${lostReason}`);
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
      
      {/* Impersonation & Developer Control panel */}
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
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${role === r ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'}`}
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
                const isActive = item.id === 'leads';
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-[#111827] flex items-center justify-center font-bold text-xs">
                TR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">তানভীর রহমান</p>
                <span className="text-[12px] font-sans font-normal text-[#6B7280] block">Owner</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CRM WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Bar with View Toggle */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <h1 className="text-[20px] font-semibold text-[#111827] font-outfit">লিড পাইপলাইন / CRM</h1>
            
            <div className="flex items-center gap-3">
              {/* Scope Toggle (RBAC context) */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[12px] font-sans font-semibold">
                <button
                  onClick={() => { setLeadsScope('my'); addToast('info', 'শুধুমাত্র আপনার নির্ধারিত লিড ফিল্টার সচল'); }}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    leadsScope === 'my' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                  }`}
                >
                  My Leads
                </button>
                <button
                  disabled={role === 'Salesperson'}
                  onClick={() => { setLeadsScope('all'); addToast('info', 'শোরুমের সকল লিড ফিল্টার সচল'); }}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    role === 'Salesperson'
                      ? 'text-gray-300 cursor-not-allowed'
                      : leadsScope === 'all'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-gray-500 hover:text-[#111827]'
                  }`}
                  title={role === 'Salesperson' ? 'Owner শুধু দেখতে পারবেন' : ''}
                >
                  All Leads {role === 'Salesperson' && '🔒'}
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-sans font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'list' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-sans font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'kanban' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                  }`}
                >
                  🗂️ Kanban
                </button>
              </div>
            </div>
          </header>

          {/* SLA Warning Banner */}
          {slaWarningLeadsCount > 0 && !loading && !apiFailed && (
            <div className="bg-orange-50 border-b border-orange-100 px-6 py-3 text-[12px] font-sans font-semibold text-orange-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>
                ⚠️ {toBengaliDigits(slaWarningLeadsCount)} টি লিড ২ ঘণ্টার বেশি সময় ধরে যোগাযোগহীন — এখনই call করুন।
              </span>
            </div>
          )}

          {/* CRM Dashboard Scroll viewport */}
          <main className="p-4 md:p-5 space-y-6 md:space-y-8 flex-1 bg-[#F9FAFB] overflow-y-auto">
            
            <AnimatePresence mode="wait">
              {loading ? (
                // SKELETON LOADER
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </motion.div>
              ) : apiFailed ? (
                // ERROR ALERT
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
                // EMPTY STATE
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border rounded-2xl p-6 text-center space-y-4 shadow-sm"
                >
                  <svg className="w-20 h-20 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-[16px] font-sans font-semibold text-gray-900">কোনো কাস্টমার লিড নেই</h3>
                  <p className="text-[12px] text-gray-500 font-sans font-normal max-w-sm mx-auto">
                    আপনার শোরুম পাইপলাইনে বর্তমানে কোনো কাস্টমার লিড নেই।
                  </p>
                  <button 
                    onClick={() => { setIsEmpty(false); }}
                    className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-[12px] font-sans font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  >
                    ডিফল্ট ডাটা লোড করুন
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* VIEW MODE 1: CRM LIST VIEW (Mobile Default) */}
                  {viewMode === 'list' ? (
                    <div className="space-y-4">
                      {/* Filter Tabs */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide text-[12px] font-sans font-semibold">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'new', label: 'New 🔴' },
                          { id: 'contacted', label: 'Contacted' },
                          { id: 'hot', label: 'Hot 🔥' },
                          { id: 'followup', label: 'Follow-up Due' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => { setActiveFilter(tab.id as any); addToast('info', `${tab.label} ফিল্টার সচল করা হয়েছে`); }}
                            className={`px-4 py-2 min-h-[44px] rounded-full border transition-all shrink-0 ${
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
                      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-[#E5E7EB] text-[12px] font-sans font-semibold text-[#6B7280]">
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
                              className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-all duration-150 relative overflow-hidden group"
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                lead.priority === 'hot' ? 'bg-red-500' : lead.priority === 'warm' ? 'bg-orange-500' : 'bg-blue-500'
                              }`} />

                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${priorityClass}`}>
                                {initials}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#111827] text-[14px] font-sans truncate">{lead.name}</span>
                                  <span className="text-[12px] font-sans font-normal text-[#6B7280]">{lead.phone}</span>
                                </div>
                                <p className="text-[12px] text-[#6B7280] font-sans font-normal mt-0.5">
                                  {lead.carInterest} · {role === 'Salesperson' ? (
                                    <span className="text-gray-400 underline cursor-help" title="Owner শুধু দেখতে পারবেন">বাজেট: —</span>
                                  ) : (
                                    `বাজেট: ${formatBDT(lead.budget)}`
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="bg-blue-50 text-[#2563EB] text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full border border-blue-150">
                                    {lead.stage}
                                  </span>
                                  <span className="text-[12px] font-sans font-normal text-[#6B7280]">{lead.timeInStage}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <span className="block text-[12px] font-sans font-semibold text-[#6B7280] uppercase tracking-wider">Score</span>
                                  <span className={`block text-lg font-extrabold font-outfit ${getScoreColor(lead.score)}`}>
                                    {toBengaliDigits(lead.score)}
                                  </span>
                                </div>
                                
                                <button 
                                  onClick={() => {
                                    handleMoveStage(lead.id, 'Lost');
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 hover:bg-red-50/50 px-2 py-1 rounded-md"
                                >
                                  Drop Lost
                                </button>

                                <Link 
                                  onClick={() => addToast('info', 'WhatsApp চ্যাট উইন্ডো ওপেন করা হয়েছে')}
                                  href={`https://wa.me/${lead.phone.replace('-', '')}?text=${encodeURIComponent(`হ্যালো ${lead.name}! আমি ঢাকা প্রিমিয়াম মটরস থেকে তানভীর বলছি। আপনার পছন্দের ${lead.carInterest} সম্পর্কে...`)}`}
                                  target="_blank"
                                  className="w-11 h-11 bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
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
                    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-14rem)] scrollbar-thin">
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
                            <div className="p-4 border-b border-[#E5E7EB] bg-white rounded-t-2xl flex items-center justify-between font-bold text-xs text-[#111827]">
                              <span>{stage}</span>
                              <span className="bg-gray-100 px-2.5 py-0.5 rounded-full text-[#6B7280]">
                                {toBengaliDigits(stageLeads.length)}
                              </span>
                            </div>

                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                              {stageLeads.map((lead) => (
                                <div 
                                  key={lead.id} 
                                  draggable="true"
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', lead.id);
                                  }}
                                  className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3 hover:shadow-md transition-all duration-150 relative cursor-grab active:cursor-grabbing"
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-bold text-[#111827] text-xs">{lead.name}</span>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                                      lead.score > 70 ? 'bg-red-500' : 'bg-orange-500'
                                    }`}>
                                      {toBengaliDigits(lead.score)}
                                    </span>
                                  </div>

                                  <p className="text-[12px] text-[#6B7280] font-sans font-normal leading-tight">
                                    {lead.carInterest} · {role === 'Salesperson' ? (
                                      <span className="text-gray-400 underline cursor-help" title="Owner শুধু দেখতে পারবেন">—</span>
                                    ) : (
                                      formatBDT(lead.budget)
                                    )}
                                  </p>

                                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-[12px] text-[#6B7280] font-sans font-normal">{lead.timeInStage}</span>
                                    <Link 
                                      onClick={() => addToast('info', 'WhatsApp চ্যাট ওপেন করা হয়েছে')}
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

                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* FAB BUTTON (Mobile, Bottom Right) */}
      <button 
        onClick={() => setShowAddLeadModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all z-40 md:bottom-6 min-h-[44px]"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* Add Lead Bottom Sheet / Modal */}
      <AnimatePresence>
        {showAddLeadModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4">
            {/* Click outside backdrop */}
            <div className="absolute inset-0" onClick={() => setShowAddLeadModal(false)} />
            
            {/* Modal Body: Bottom Sheet on Mobile, Centered Card on Desktop */}
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-6 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-[16px] font-sans font-semibold text-[#111827] font-outfit">নতুন লিড যুক্ত করুন</h3>
                <button onClick={() => setShowAddLeadModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <form onSubmit={handleAddLeadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">ক্রেতার নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: রফিক ইসলাম"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 01711223344"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">আগ্রহের গাড়ি</label>
                  <select
                    value={newLeadCar}
                    onChange={(e) => setNewLeadCar(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-2 text-[14px] text-[#111827]"
                  >
                    <option value="Toyota Axio 2019">Toyota Axio 2019</option>
                    <option value="Honda Fit 2018">Honda Fit 2018</option>
                    <option value="Nissan X-Trail 2019">Nissan X-Trail 2019</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">বাজেট (টাকা)</label>
                  <input
                    type="number"
                    required
                    placeholder="যেমন: ১৫০০০০০"
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2"
                >
                  লিড যুক্ত করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mandatory Lost Reason Bottom Sheet / Modal */}
      <AnimatePresence>
        {showLostReasonModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4">
            <div className="absolute inset-0" onClick={() => setShowLostReasonModal(false)} />
            
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-5 shadow-2xl relative z-10"
            >
              <div className="border-b pb-3">
                <h3 className="text-[16px] font-sans font-semibold text-red-600 font-outfit">🚨 Lost হওয়ার কারণ নির্বাচন করুন</h3>
                <p className="text-[12px] text-[#6B7280] font-sans font-normal mt-1">লিডটি হারিয়ে যাওয়ার কারণ জানানো বাধ্যতামূলক।</p>
              </div>
              
              <form onSubmit={handleLostReasonSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">কারণ (Reason)</label>
                  <select
                    required
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-2 text-[14px] text-[#111827] focus:ring-1 focus:ring-red-500 focus:outline-none"
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
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all text-xs shadow-md"
                >
                  নিশ্চিত করুন (Confirm)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION (Tab bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-45 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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
