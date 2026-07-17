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
  source: string;
  budgetMin: string;
  budgetMax: string;
}

const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'রফিক হাসান', phone: '01711223344', carInterest: 'Toyota Axio 2019', stage: 'New', score: 85, priority: 'hot', timeInStage: '১০ মিনিট আগে', hoursUncontacted: 0.2, dateAdded: '2026-07-17T16:00:00', source: 'Marketplace', budgetMin: '১০', budgetMax: '১৫' },
  { id: '2', name: 'জামিল আহমেদ', phone: '01822334455', carInterest: 'Honda Fit 2018', stage: 'Contacted', score: 62, priority: 'warm', timeInStage: '৩ ঘণ্টা আগে', hoursUncontacted: 3, dateAdded: '2026-07-17T13:30:00', source: 'Direct Call', budgetMin: '১২', budgetMax: '১৪' },
  { id: '3', name: 'করিম উল্লাহ', phone: '01933445566', carInterest: 'Toyota Premio 2017', stage: 'Qualified', score: 38, priority: 'cold', timeInStage: '৫ ঘণ্টা আগে', hoursUncontacted: 5, dateAdded: '2026-07-17T11:00:00', source: 'Facebook Page', budgetMin: '২০', budgetMax: '২৫' },
  { id: '4', name: 'সাদিয়া রহমান', phone: '01544556677', carInterest: 'Nissan X-Trail 2019', stage: 'Test Drive', score: 92, priority: 'hot', timeInStage: '২.৫ ঘণ্টা আগে', hoursUncontacted: 2.5, dateAdded: '2026-07-17T14:00:00', source: 'Marketplace', budgetMin: '২৫', budgetMax: '৩০' },
  { id: '5', name: 'আবুল কালাম', phone: '01655667788', carInterest: 'Toyota Axio 2019', stage: 'Negotiation', score: 78, priority: 'hot', timeInStage: '৩০ মিনিট আগে', hoursUncontacted: 0.5, dateAdded: '2026-07-17T15:45:00', source: 'Direct Walk-in', budgetMin: '১৩', budgetMax: '১৫' },
  { id: '6', name: 'ফারহানা ইসলাম', phone: '01366778899', carInterest: 'Toyota Harrier 2020', stage: 'New', score: 95, priority: 'hot', timeInStage: '৪ ঘণ্টা আগে', hoursUncontacted: 4, dateAdded: '2026-07-17T12:00:00', source: 'Marketplace', budgetMin: '৪০', budgetMax: '৪৫' },
  { id: '7', name: 'জহিরুল হক', phone: '01477889900', carInterest: 'Honda Grace 2018', stage: 'Closed', score: 80, priority: 'hot', timeInStage: '১ দিন আগে', hoursUncontacted: 24, dateAdded: '2026-07-16T16:00:00', source: 'WhatsApp Business', budgetMin: '১৫', budgetMax: '১৭' },
  { id: '8', name: 'মাহবুব আলম', phone: '01788990011', carInterest: '', stage: 'Lost', score: 32, priority: 'cold', timeInStage: '২ দিন আগে', hoursUncontacted: 48, dateAdded: '2026-07-15T16:00:00', source: 'Direct Call', budgetMin: '৮', budgetMax: '১০' }
];

export default function LeadPipelineCRM() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'hot' | 'followup' | 'my'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  
  // Leads Database State
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  
  // Modals / Bottom Sheets
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostLeadId, setLostLeadId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('দামে মেলেনি (Price)');
  const [pendingStage, setPendingStage] = useState<Lead['stage'] | null>(null);

  // Swipe-left simulation on mobile
  const [swipedLeadId, setSwipedLeadId] = useState<string | null>(null);

  // Dragging Kanban state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Add Lead form fields (strict 3 fields only)
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCar, setNewLeadCar] = useState('');

  // Developer mock controls
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  // Toast Alerts system
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'error' ? 5000 : 3000);
  };

  // Header quick stats counts
  const hotCount = useMemo(() => leads.filter(l => l.priority === 'hot').length, [leads]);
  const followupCount = useMemo(() => leads.filter(l => l.hoursUncontacted >= 2 && ['New', 'Contacted'].includes(l.stage)).length, [leads]);
  const slaBreachLeads = useMemo(() => leads.filter(l => l.hoursUncontacted >= 2 && ['New', 'Contacted', 'Qualified'].includes(l.stage)), [leads]);

  // Stage mapping & columns color configuration
  const stagesList: { stage: Lead['stage']; color: string }[] = [
    { stage: 'New', color: 'border-l-4 border-l-[#6B7280]' },
    { stage: 'Contacted', color: 'border-l-4 border-l-[#2563EB]' },
    { stage: 'Qualified', color: 'border-l-4 border-l-[#0D9488]' },
    { stage: 'Test Drive', color: 'border-l-4 border-l-[#D97706]' },
    { stage: 'Quote Sent', color: 'border-l-4 border-l-[#7C3AED]' },
    { stage: 'Negotiation', color: 'border-l-4 border-l-[#F59E0B]' },
    { stage: 'Closed', color: 'border-l-4 border-l-[#16A34A]' },
    { stage: 'Lost', color: 'border-l-4 border-l-[#DC2626]' }
  ];

  // Filtering & Sorting list
  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    if (activeFilter === 'new') {
      result = result.filter(l => l.stage === 'New');
    } else if (activeFilter === 'hot') {
      result = result.filter(l => l.priority === 'hot');
    } else if (activeFilter === 'followup') {
      result = result.filter(l => l.hoursUncontacted >= 2 && ['New', 'Contacted'].includes(l.stage));
    }

    if (sortBy === 'score') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }

    return result;
  }, [leads, activeFilter, sortBy]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) {
      addToast('error', 'দয়া করে নাম ও মোবাইল নম্বর পূরণ করুন');
      return;
    }

    // Phone format check
    if (!newLeadPhone.match(/^01[3-9]\d{8}$/)) {
      addToast('error', 'মোবাইল নম্বর ০১XXXXXXXXX ফরম্যাটে দিন');
      return;
    }

    const newLead: Lead = {
      id: String(leads.length + 1),
      name: newLeadName,
      phone: newLeadPhone,
      carInterest: newLeadCar,
      stage: 'New',
      score: 72,
      priority: 'hot',
      timeInStage: '১ মিনিট আগে',
      hoursUncontacted: 0.01,
      dateAdded: new Date().toISOString(),
      source: 'Direct Walk-in',
      budgetMin: '১০',
      budgetMax: '১৫'
    };

    setLeads([newLead, ...leads]);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadCar('');
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
      addToast('success', `লিড সফলভাবে স্থানান্তরিত: ${newStage}`);
    }
  };

  const handleLostReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostLeadId || !pendingStage) return;
    setLeads(prev => prev.map(l => l.id === lostLeadId ? { ...l, stage: pendingStage } : l));
    setShowLostReasonModal(false);
    setLostLeadId(null);
    setPendingStage(null);
    addToast('error', `লিড বন্ধ করা হয়েছে। কারণ: ${lostReason}`);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    addToast('error', 'লিড সফলভাবে মুছে ফেলা হয়েছে');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Dev Switcher Bar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 text-[12px] font-sans flex flex-col sm:flex-row justify-between items-center z-50 gap-3 shadow-md">
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
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen z-40">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[12px] text-[#6B7280] font-sans font-normal truncate">ঢাকা অটো হাউস</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: '🏠 ড্যাশবোর্ড', path: '/dashboard' },
                { id: 'inventory', label: '🚗 ইনভেন্টরি', path: '/dashboard/inventory' },
                { id: 'leads', label: '👥 লিড (CRM)', path: '/dashboard/leads', active: true },
                { id: 'deals', label: '🤝 ডিল', path: '/dashboard/deals' },
                { id: 'analytics', label: '📊 Analytics', path: '/dashboard/analytics' },
                { id: 'automation', label: '🤖 Automation Hub', path: '/dashboard/automation' },
                { id: 'website', label: '🌐 Website', path: '/dashboard/website' },
                { id: 'settings', label: '⚙️ Settings', path: '/dashboard/settings' }
              ].map((item) => {
                const isActive = item.active;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[12px] font-sans font-semibold transition-all ${
                      isActive 
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-l-3 border-[#2563EB] shadow-sm' 
                        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
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
                <span className="text-[10px] text-[#6B7280] font-sans font-normal block">{role}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Page Header */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-4">
              <h1 className="text-[24px] font-bold text-[#111827] font-outfit">লিড পাইপলাইন</h1>
              
              {/* Header Stats Row (3 pills) */}
              <div className="hidden sm:flex items-center gap-2">
                <button 
                  onClick={() => { setActiveFilter('hot'); addToast('info', 'হট লিড ফিল্টার সচল'); }}
                  className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[12px] font-sans font-semibold active:scale-95 transition-all hover:bg-red-100/50"
                >
                  🔥 {toBengaliDigits(hotCount)} Hot
                </button>
                <button 
                  onClick={() => { setActiveFilter('followup'); addToast('info', 'ফলো-আপ লিড ফিল্টার সচল'); }}
                  className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full text-[12px] font-sans font-semibold active:scale-95 transition-all hover:bg-orange-100/50"
                >
                  📅 {toBengaliDigits(followupCount)} Follow-up Due
                </button>
                {slaBreachLeads.length > 0 && (
                  <button 
                    onClick={() => { setActiveFilter('followup'); addToast('error', 'SLA লঙ্ঘন করা লিড ফিল্টার সচল'); }}
                    className="bg-red-100 text-red-800 border border-red-300 px-3 py-1 rounded-full text-[12px] font-sans font-semibold active:scale-95 transition-all hover:bg-red-200"
                  >
                    ⚠️ {toBengaliDigits(slaBreachLeads.length)} SLA Breach
                  </button>
                )}
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-4">
              {/* View mode toggle */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3.5 py-1.5 rounded-md text-[12px] font-sans font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'list' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  📋 তালিকা
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3.5 py-1.5 rounded-md text-[12px] font-sans font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'kanban' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  🗂️ কানব্যান
                </button>
              </div>

              {/* Add Lead trigger button */}
              <button 
                onClick={() => setShowAddLeadModal(true)}
                className="bg-[#2563EB] hover:brightness-110 text-white px-4 py-2 rounded-lg text-[12px] font-sans font-bold active:scale-95 transition-all shadow-sm flex items-center gap-1 shrink-0 h-10 min-h-[44px]"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                + নতুন লিড
              </button>
            </div>
          </header>

          {/* SLA BREACH WARNING BANNER */}
          {slaBreachLeads.length > 0 && !loading && !apiFailed && (
            <div className="bg-[#FEF2F2] border-b-2 border-[#DC2626] px-6 py-3.5 text-[12px] font-sans font-semibold text-[#DC2626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top duration-300 z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] font-bold">warning</span>
                <span>⚠️ {toBengaliDigits(slaBreachLeads.length)}টি লিড ২+ ঘণ্টা ধরে যোগাযোগহীন — এখনই যোগাযোগ করুন:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {slaBreachLeads.map((lead) => (
                  <button 
                    key={lead.id}
                    onClick={() => { addToast('info', `${lead.name} এর বিবরণ লোড করা হচ্ছে`); }}
                    className="bg-[#DC2626]/10 text-[#DC2626] hover:bg-[#DC2626]/20 border border-[#DC2626]/30 px-2.5 py-1 rounded text-[11px] font-bold transition-all"
                  >
                    {lead.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CRM MAIN AREA */}
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
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </motion.div>
              ) : apiFailed ? (
                // ERROR ALERT
                <motion.div 
                  key="error"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm text-center space-y-4 max-w-md mx-auto mt-10"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <span className="material-symbols-outlined text-[24px]">error</span>
                  </div>
                  <h3 className="text-[16px] font-sans font-semibold text-red-900">ডেটা লোড হয়নি</h3>
                  <button 
                    onClick={() => { setLoading(true); setApiFailed(false); setTimeout(() => setLoading(false), 1000); }}
                    className="bg-red-600 text-white px-5 py-2 rounded-lg text-[12px] font-sans font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-sm"
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
                  className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4 shadow-sm"
                >
                  <svg className="w-20 h-20 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-[16px] font-sans font-semibold text-gray-900">কোনো কাস্টমার লিড নেই</h3>
                  <button 
                    onClick={() => setIsEmpty(false)}
                    className="bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-[12px] font-sans font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  >
                    ডিফল্ট ডাটা ফেরত আনুন
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  
                  {/* VIEW MODE 1: LIST VIEW (Mobile Default) */}
                  {viewMode === 'list' && (
                    <div className="space-y-4">
                      
                      {/* Filter tabs list (horizontal scroll) */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide text-[12px] font-sans font-semibold">
                        {[
                          { id: 'all', label: `সব (${leads.length})` },
                          { id: 'new', label: `নতুন (${leads.filter(l => l.stage === 'New').length})` },
                          { id: 'hot', label: `Hot 🔥 (${leads.filter(l => l.priority === 'hot').length})` },
                          { id: 'followup', label: `ফলো-আপ (${leads.filter(l => l.hoursUncontacted >= 2 && ['New', 'Contacted'].includes(l.stage)).length})` },
                          { id: 'my', label: 'আমার লিড' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => { setActiveFilter(tab.id as any); addToast('info', `${tab.label} ফিল্টার সচল করা হয়েছে`); }}
                            className={`px-4 py-2 rounded-full border transition-all shrink-0 min-h-[44px] ${
                              activeFilter === tab.id
                                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                                : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Sort Bar */}
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E5E7EB] text-[12px] font-sans font-semibold text-[#6B7280]">
                        <span>লিড ফিল্টার ফলাফল ({toBengaliDigits(filteredAndSortedLeads.length)})</span>
                        <div className="flex items-center gap-2">
                          <span>Sort:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent text-[#111827] focus:outline-none cursor-pointer font-bold"
                          >
                            <option value="score">স্কোর অনুযায়ী ↓</option>
                            <option value="date">তারিখ অনুযায়ী ↓</option>
                          </select>
                        </div>
                      </div>

                      {/* Lead Cards Stack */}
                      <div className="space-y-2">
                        {filteredAndSortedLeads.map((lead) => {
                          const initials = lead.name.split(' ').map(n => n[0]).join('');
                          const isSwiped = swipedLeadId === lead.id;
                          return (
                            <div 
                              key={lead.id} 
                              className="relative overflow-hidden bg-white rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between min-h-[96px] group transition-all duration-150"
                            >
                              
                              {/* Left priority color marker */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                lead.priority === 'hot' ? 'bg-red-500' : lead.priority === 'warm' ? 'bg-orange-500' : 'bg-gray-400'
                              }`} />

                              {/* Swipable content wrapper */}
                              <div 
                                className="flex-1 flex items-center justify-between p-4 md:p-5 transition-transform duration-200"
                                style={{ transform: isSwiped ? 'translateX(-180px)' : 'translateX(0)' }}
                                onClick={() => {
                                  // Click toggle swipe on mobile simulation
                                  if (window.innerWidth < 768) {
                                    setSwipedLeadId(isSwiped ? null : lead.id);
                                  }
                                }}
                              >
                                {/* Left side: Avatar circle (48px) + Score */}
                                <div className="w-[80px] flex flex-col items-center justify-center shrink-0 space-y-1.5">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${
                                    lead.priority === 'hot' 
                                      ? 'bg-red-500 text-white border border-red-600' 
                                      : lead.priority === 'warm' 
                                      ? 'bg-orange-100 text-orange-600 border border-orange-200' 
                                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}>
                                    {lead.priority === 'hot' ? '🔥' : initials}
                                  </div>
                                  <div className="text-center leading-tight">
                                    <span className={`block text-[15px] font-extrabold font-outfit ${
                                      lead.priority === 'hot' ? 'text-red-600' : lead.priority === 'warm' ? 'text-orange-500' : 'text-gray-500'
                                    }`}>
                                      {toBengaliDigits(lead.score)}
                                    </span>
                                    <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                                      lead.priority === 'hot' ? 'text-red-500' : lead.priority === 'warm' ? 'text-orange-400' : 'text-gray-400'
                                    }`}>
                                      {lead.priority === 'hot' ? 'Hot' : lead.priority === 'warm' ? 'Warm' : 'Cold'}
                                    </span>
                                  </div>
                                </div>

                                {/* Center Details info */}
                                <div className="flex-1 min-w-0 px-2 space-y-1 text-left">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-[#111827] text-[16px] font-sans truncate">{lead.name}</span>
                                    <span className="bg-blue-50 text-[#2563EB] text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full border border-blue-150">
                                      {lead.source}
                                    </span>
                                  </div>
                                  
                                  <p className="text-[14px] text-gray-500 font-sans font-medium">
                                    {lead.carInterest ? `🚗 ${lead.carInterest}` : <span className="italic text-gray-400">গাড়ি নির্ধারিত নয়</span>}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-teal-50 text-teal-800 text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                                      {lead.stage}
                                    </span>
                                    <span className="text-[12px] text-gray-400 font-sans font-normal">{toBengaliDigits(lead.timeInStage)}</span>
                                  </div>

                                  <p className="text-[12px] text-gray-500 font-sans font-semibold pt-0.5">
                                    {role === 'Salesperson' ? (
                                      <span className="text-gray-400 underline cursor-help" title="Owner শুধু দেখতে পারবেন">বাজেট: —</span>
                                    ) : (
                                      `বাজেট: BDT ${toBengaliDigits(lead.budgetMin)}L–${toBengaliDigits(lead.budgetMax)}L`
                                    )}
                                  </p>
                                </div>

                                {/* Right Side: Actions */}
                                <div className="flex flex-col items-center justify-center shrink-0 space-y-2 border-l pl-4 py-1 h-full">
                                  {/* WhatsApp Deep link */}
                                  <Link 
                                    onClick={() => addToast('info', 'WhatsApp মেসেজ পাঠানো হয়েছে')}
                                    href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(`হ্যালো ${lead.name}! ঢাকা অটো হাউস থেকে যোগাযোগ করা হচ্ছে...`)}`}
                                    target="_blank"
                                    className="w-11 h-11 bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0 min-h-[44px]"
                                  >
                                    <span className="material-symbols-outlined text-[20px] font-bold">chat</span>
                                  </Link>
                                  
                                  <a 
                                    href={`tel:${lead.phone}`}
                                    className="text-[12px] font-bold text-[#2563EB] hover:underline"
                                  >
                                    📞 কল
                                  </a>
                                </div>
                              </div>

                              {/* Swiped hidden slide-in buttons */}
                              <div className="absolute right-0 top-0 bottom-0 w-[180px] bg-gray-50 border-l flex items-center justify-around px-2 z-10">
                                <button 
                                  onClick={() => addToast('info', 'ফলো-আপ শিডিউল করা হচ্ছে')}
                                  className="flex flex-col items-center justify-center gap-0.5 text-orange-600 hover:text-orange-700 font-bold"
                                >
                                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                  <span className="text-[9px]">Follow-up</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    const nextStage = lead.stage === 'New' ? 'Contacted' : 'Qualified';
                                    handleMoveStage(lead.id, nextStage);
                                  }}
                                  className="flex flex-col items-center justify-center gap-0.5 text-[#2563EB] hover:text-blue-700 font-bold"
                                >
                                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                  <span className="text-[9px]">Stage</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="flex flex-col items-center justify-center gap-0.5 text-red-600 hover:text-red-700 font-bold"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                  <span className="text-[9px]">Delete</span>
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                  {/* VIEW MODE 2: KANBAN PIPELINE VIEW (Desktop Default) */}
                  {viewMode === 'kanban' && (
                    <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-14rem)] scrollbar-thin">
                      {stagesList.map(({ stage, color }) => {
                        const stageLeads = leads.filter(l => l.stage === stage);
                        const isOver = dragOverColumn === stage;
                        
                        return (
                          <div 
                            key={stage} 
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverColumn(stage);
                            }}
                            onDragLeave={() => setDragOverColumn(null)}
                            onDrop={(e) => {
                              const leadId = e.dataTransfer.getData('text/plain');
                              handleMoveStage(leadId, stage);
                              setDragOverColumn(null);
                            }}
                            className={`w-72 rounded-2xl border flex flex-col shrink-0 transition-all ${
                              isOver 
                                ? 'bg-[#F0F9FF] border-2 border-dashed border-[#2563EB] scale-98' 
                                : 'bg-gray-50/50 border-[#E5E7EB]'
                            }`}
                          >
                            {/* Column Header */}
                            <div className={`p-4 border-b border-[#E5E7EB] bg-white rounded-t-2xl flex items-center justify-between font-bold text-xs text-[#111827] shadow-sm shrink-0 ${color}`}>
                              <span>{stage}</span>
                              <span className="bg-gray-100 px-2.5 py-0.5 rounded-full text-[#6B7280]">
                                {toBengaliDigits(stageLeads.length)}
                              </span>
                            </div>

                            {/* Leads Column Stack */}
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
                              {stageLeads.map((lead) => {
                                const isDragging = draggedLeadId === lead.id;
                                return (
                                  <div 
                                    key={lead.id} 
                                    draggable="true"
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', lead.id);
                                      setDraggedLeadId(lead.id);
                                    }}
                                    onDragEnd={() => setDraggedLeadId(null)}
                                    className={`bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm space-y-3 hover:shadow-md cursor-grab active:cursor-grabbing transition-all ${
                                      isDragging ? 'scale-102 shadow-lg opacity-50' : 'opacity-100'
                                    }`}
                                  >
                                    {/* Top Row: Name + Score badge */}
                                    <div className="flex justify-between items-start gap-2">
                                      <span className="font-bold text-[#111827] text-sm leading-tight truncate">{lead.name}</span>
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0 ${
                                        lead.score > 70 ? 'bg-red-500' : 'bg-orange-500'
                                      }`}>
                                        {toBengaliDigits(lead.score)}
                                      </span>
                                    </div>

                                    {/* Mid Row: Car Interest */}
                                    <p className="text-[13px] text-[#6B7280] font-sans font-normal truncate">
                                      {lead.carInterest ? `🚗 ${lead.carInterest}` : <span className="italic text-gray-400">গাড়ি নির্ধারিত নয়</span>}
                                    </p>

                                    {/* Row: Time + Assigned initials avatar */}
                                    <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
                                      <span className="bg-gray-50 border border-gray-150 px-2 py-0.5 rounded text-[10px] text-gray-500 font-bold">
                                        {toBengaliDigits(lead.timeInStage)}
                                      </span>
                                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-extrabold text-[8px]">
                                        TR
                                      </div>
                                    </div>

                                    {/* Bottom: WhatsApp CTA */}
                                    <Link 
                                      onClick={() => addToast('info', 'WhatsApp চ্যাট ওপেন করা হয়েছে')}
                                      href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(`হ্যালো ${lead.name}! ঢাকা অটো হাউস থেকে তানভীর বলছি...`)}`}
                                      target="_blank"
                                      className="w-full h-9 bg-[#F0FDF4] hover:bg-[#E8FDF0] text-[#16A34A] border border-[#16A34A] rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                    >
                                      <span className="material-symbols-outlined text-[16px] font-bold">chat</span>
                                      WhatsApp
                                    </Link>

                                  </div>
                                );
                              })}
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

      {/* FLOATING FAB BUTTON (Mobile) */}
      <button 
        onClick={() => setShowAddLeadModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all z-40 md:bottom-6 min-h-[44px]"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* ADD LEAD BOTTOM SHEET MODAL (Slides Up) */}
      <AnimatePresence>
        {showAddLeadModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4 animate-in fade-in duration-300">
            {/* Backdrop click dismiss */}
            <div className="absolute inset-0" onClick={() => setShowAddLeadModal(false)} />
            
            {/* Bottom Sheet Box */}
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-6 shadow-2xl relative z-10 text-[#111827] text-left"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-[16px] font-sans font-semibold text-[#111827] font-outfit">নতুন লিড যুক্ত করুন</h3>
                <button onClick={() => setShowAddLeadModal(false)} className="text-[#6B7280] hover:text-[#111827] w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Form - strict 3 fields maximum */}
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">নাম (Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: রফিক হাসান"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">ফোন (Phone) *</label>
                  <input
                    type="text"
                    required
                    placeholder="০১XXXXXXXXX ফরম্যাটে"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB] tracking-widest font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-sans font-semibold text-[#6B7280]">গাড়ির আগ্রহ (Vehicle Interest)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Toyota Axio 2019"
                    value={newLeadCar}
                    onChange={(e) => setNewLeadCar(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2 h-11 min-h-[44px]"
                >
                  লিড সেভ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY LOST REASON BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {showLostReasonModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setShowLostReasonModal(false)} />
            
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-5 shadow-2xl relative z-10 text-[#111827] text-left"
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

      {/* MOBILE BOTTOM NAVIGATION (Fixed bottom, white, shadow-top, z-40) */}
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
