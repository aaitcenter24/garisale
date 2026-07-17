'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  source: string;
  budgetMin: string;
  budgetMax: string;
  vehiclePrice: number;
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'রফিক হাসান', phone: '01711223344', carInterest: 'Toyota Axio 2019', stage: 'Contacted', score: 72, priority: 'hot', timeInStage: '৩ ঘণ্টা আগে', hoursUncontacted: 3, source: 'Marketplace', budgetMin: '১০,০০,০০০', budgetMax: '১৫,০০,০০০', vehiclePrice: 1450000 },
  { id: '2', name: 'জামিল আহমেদ', phone: '01822334455', carInterest: 'Honda Fit 2018', stage: 'Contacted', score: 62, priority: 'warm', timeInStage: '৫ ঘণ্টা আগে', hoursUncontacted: 5, source: 'Direct Call', budgetMin: '১২,০০,০০০', budgetMax: '১৪,০০,০০০', vehiclePrice: 1250000 },
  { id: '3', name: 'করিম উল্লাহ', phone: '01933445566', carInterest: 'Toyota Premio 2017', stage: 'Qualified', score: 45, priority: 'cold', timeInStage: '১ দিন আগে', hoursUncontacted: 24, source: 'Facebook Page', budgetMin: '২০,০০,০০০', budgetMax: '২৫,০০,০০০', vehiclePrice: 2300000 },
  { id: '4', name: 'সাদিয়া রহমান', phone: '01544556677', carInterest: 'Nissan X-Trail 2019', stage: 'Test Drive', score: 92, priority: 'hot', timeInStage: '২ ঘণ্টা আগে', hoursUncontacted: 2, source: 'Marketplace', budgetMin: '২৫,০০,০০০', budgetMax: '৩০,০০,০০০', vehiclePrice: 2850000 },
  { id: '5', name: 'আবুল কালাম', phone: '01655667788', carInterest: 'Toyota Axio 2019', stage: 'Negotiation', score: 78, priority: 'hot', timeInStage: '১ ঘণ্টা আগে', hoursUncontacted: 1, source: 'Direct Walk-in', budgetMin: '১৩,০০,০০০', budgetMax: '১৫,০০,০০০', vehiclePrice: 1400000 }
];

const STAGES: Lead['stage'][] = ['New', 'Contacted', 'Qualified', 'Test Drive', 'Quote Sent', 'Negotiation', 'Closed', 'Lost'];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const leadId = params.id;

  // Find target lead from database or fall back to lead 1
  const initialLead = useMemo(() => {
    return MOCK_LEADS.find(l => l.id === leadId) || MOCK_LEADS[0];
  }, [leadId]);

  const [lead, setLead] = useState<Lead>(initialLead);
  
  // Note State
  const [noteText, setNoteText] = useState('');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [activities, setActivities] = useState([
    { type: 'note', desc: 'নোট: গাড়ি দেখতে আগ্রহী, রবিবার আসবেন', time: '৩০ মিনিট আগে', icon: 'description', color: 'bg-amber-100 text-amber-700' },
    { type: 'whatsapp', desc: "WhatsApp পাঠানো হয়েছে — 'হ্যালো রফিক হাসান! ঢাকা অটো হাউস থেকে...'", time: '২ ঘণ্টা আগে', icon: 'chat', color: 'bg-emerald-100 text-emerald-700' },
    { type: 'call', desc: 'কল করা হয়েছে — ৪ মিনিট কথা হয়েছে', time: '৫ ঘণ্টা আগে', icon: 'call', color: 'bg-blue-100 text-blue-700' },
    { type: 'created', desc: 'লিড তৈরি হয়েছে — Marketplace থেকে', time: '৩ ঘণ্টা আগে', icon: 'add_circle', color: 'bg-gray-100 text-gray-700' }
  ]);

  // Score Breakdown view state
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Stepper Stage Index
  const stageIndex = STAGES.indexOf(lead.stage);

  // Lost modal state
  const [showLostBottomSheet, setShowLostBottomSheet] = useState(false);
  const [selectedLostReason, setSelectedLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');

  // Follow-up Scheduler states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('2026-07-18');
  const [followUpTime, setFollowUpTime] = useState('15:00');
  const [followUpChannel, setFollowUpChannel] = useState('WhatsApp');
  const [followUpInfo, setFollowUpInfo] = useState<string | null>('শনিবার, ১৮ জুলাই, বিকেল ৩:০০ মিনিট (WhatsApp দ্বারা)');
  const [followUpCountdown, setFollowUpCountdown] = useState('২২ ঘণ্টা ৩২ মিনিট বাকি');

  // Toast alert system
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Auto-save note on blur
  const handleNoteBlur = () => {
    if (!noteText.trim()) return;
    
    setActivities([
      { 
        type: 'note', 
        desc: `নোট: ${noteText}`, 
        time: 'এখনই', 
        icon: 'description', 
        color: 'bg-amber-100 text-amber-700' 
      },
      ...activities
    ]);
    
    setNoteText('');
    setSavedIndicator(true);
    addToast('success', 'নোটটি সেভ করা হয়েছে');
    setTimeout(() => setSavedIndicator(false), 2000);
  };

  // Move stage stepper
  const handlePrevStage = () => {
    if (stageIndex > 0) {
      const prevStage = STAGES[stageIndex - 1];
      setLead({ ...lead, stage: prevStage });
      addToast('info', `ধাপ পরিবর্তন: ${prevStage}`);
    }
  };

  const handleNextStage = () => {
    if (stageIndex < STAGES.length - 1) {
      const nextStage = STAGES[stageIndex + 1];
      if (nextStage === 'Lost') {
        setShowLostBottomSheet(true);
      } else {
        setLead({ ...lead, stage: nextStage });
        addToast('success', `ধাপ পরিবর্তন: ${nextStage}`);
      }
    }
  };

  const handleLostConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedLostReason === 'অন্যান্য' ? customLostReason : selectedLostReason;
    if (!finalReason) return;

    setLead({ ...lead, stage: 'Lost' });
    setShowLostBottomSheet(false);
    
    setActivities([
      {
        type: 'stage',
        desc: `লিড বন্ধ করা হয়েছে (Lost) - কারণ: ${finalReason}`,
        time: 'এখনই',
        icon: 'cancel',
        color: 'bg-red-100 text-red-700'
      },
      ...activities
    ]);

    addToast('error', `লিড Lost হিসেবে মার্ক করা হয়েছে: ${finalReason}`);
  };

  // Initials generator
  const initials = lead.name.split(' ').map(n => n[0]).join('');

  // 2-Tap WhatsApp link generation
  const salespersonName = 'তানভীর';
  const dealerName = 'ঢাকা অটো হাউস';
  const whatsappMsg = `হ্যালো ${lead.name}! আমি ${salespersonName} ${dealerName}-থেকে বলছি। ${lead.carInterest || 'গাড়ি'} সম্পর্কে আপনার enquiry পেয়েছি। এখনো কি আগ্রহী আছেন?`;
  const whatsappUrl = `https://wa.me/${lead.phone}?text=${encodeURIComponent(whatsappMsg)}`;

  // Budget validation: checks if vehiclePrice is within min/max budget
  // Mock check parses budgetMin & budgetMax string to number
  const isWithinBudget = useMemo(() => {
    const minVal = parseInt(lead.budgetMin.replace(/,/g, '')) || 0;
    const maxVal = parseInt(lead.budgetMax.replace(/,/g, '')) || 9999999;
    return lead.vehiclePrice >= minVal && lead.vehiclePrice <= maxVal;
  }, [lead]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-24 md:pb-32">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-[#6B7280] hover:text-[#111827] h-11 min-h-[44px]"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          পেছনে
        </button>
        
        <div className="text-center">
          <span className="font-extrabold text-[16px] text-[#111827] font-outfit block">লিড বিবরণ</span>
          <span className="bg-blue-50 text-[#2563EB] text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full border border-blue-150 mt-0.5 inline-block">
            {lead.stage}
          </span>
        </div>

        <button className="text-[#6B7280] hover:text-[#111827] w-11 h-11 flex items-center justify-center min-h-[44px]">
          <span className="material-symbols-outlined text-[24px]">more_vert</span>
        </button>
      </header>

      <main className="max-w-md mx-auto w-full p-4 space-y-6">
        
        {/* HERO CARD */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4 text-left">
          {/* Avatar Circle */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-[24px] text-white shadow-md shrink-0 ${
            lead.priority === 'hot' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
              : lead.priority === 'warm' 
              ? 'bg-orange-500' 
              : 'bg-gray-400'
          }`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-[20px] font-bold text-[#111827] font-outfit leading-tight truncate">{lead.name}</h2>
            <a 
              href={`tel:${lead.phone}`}
              className="text-[16px] text-[#2563EB] font-bold hover:underline block"
            >
              📞 {lead.phone}
            </a>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="bg-blue-50 text-[#2563EB] text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full border border-blue-150">
                🛒 {lead.source}
              </span>
              <span className="text-[12px] text-gray-500 font-sans font-normal">
                {lead.timeInStage} আগে যোগ হয়েছে
              </span>
            </div>
          </div>
        </section>

        {/* PRIMARY ACTION BUTTONS (WhatsApp Dominant) */}
        <section className="space-y-3">
          {/* WhatsApp dominant Reply button */}
          <Link 
            onClick={() => addToast('success', 'WhatsApp চ্যাট ওপেন করা হচ্ছে...')}
            href={whatsappUrl}
            target="_blank"
            className="w-full h-14 bg-[#16A34A] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-[16px] shadow-md min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[22px] font-extrabold">chat</span>
            WhatsApp-এ Reply করুন
          </Link>

          {/* Equal call/follow-up CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`tel:${lead.phone}`}
              className="h-11 bg-white border border-[#D1D5DB] text-[#374151] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-xs shadow-sm min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              📞 কল করুন
            </a>
            <button 
              onClick={() => setShowFollowUpModal(true)}
              className="h-11 bg-white border border-[#D1D5DB] text-[#374151] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-xs shadow-sm min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              📅 ফলো-আপ
            </button>
          </div>
        </section>

        {/* IMV + VEHICLE WIDGET */}
        <section className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3 text-left">
          {lead.carInterest ? (
            <>
              <span className="block text-[11px] font-sans font-semibold text-[#6B7280] uppercase tracking-wider">আগ্রহের গাড়ি</span>
              <div className="flex gap-3">
                <div className="w-20 h-15 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1" 
                    alt={lead.carInterest}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[14px] text-[#111827] truncate">{lead.carInterest} G Grade</h4>
                  <p className="text-[14px] text-[#16A34A] font-bold mt-0.5">{formatBDT(lead.vehiclePrice)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[12px] font-sans font-semibold">
                <span className="text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                  🟢 Great Deal
                </span>
                <Link href={`/${lead.id}`} className="text-[#2563EB] hover:underline flex items-center gap-0.5">
                  লিস্টিং দেখুন →
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <span className="block text-[11px] font-sans font-semibold text-[#6B7280] uppercase tracking-wider">আগ্রহের গাড়ি</span>
              <div className="bg-gray-50 border p-4 rounded-xl text-center space-y-2">
                <p className="text-[14px] text-gray-500 italic">🚗 গাড়ি নির্ধারিত নয়, বাজেট BDT ১৫L</p>
                <button 
                  onClick={() => addToast('info', 'ইনভেন্টরি লিস্টিং লিংক করুন')}
                  className="text-[12px] font-sans font-bold text-[#2563EB] hover:underline block mx-auto"
                >
                  + গাড়ি লিংক করুন
                </button>
              </div>
            </div>
          )}
        </section>

        {/* BUDGET COMPARISON DISPLAY */}
        <section className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2 text-left">
          <span className="block text-[11px] font-sans font-semibold text-[#6B7280] uppercase tracking-wider">বাজেট ও গাড়ির মূল্য তুলনা</span>
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-bold text-[#111827]">
              বাজেট: BDT {toBengaliDigits(lead.budgetMin)} – {toBengaliDigits(lead.budgetMax)}
            </span>
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded border ${
              isWithinBudget 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {isWithinBudget ? 'বাজেটের মধ্যে ✓' : 'বাজেটের বাইরে ✗'}
            </span>
          </div>
        </section>

        {/* LEAD SCORE WIDGET */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-[14px] font-bold text-[#111827] flex items-center gap-1">
              লিড স্কোর
              <span className="material-symbols-outlined text-[16px] text-gray-400 cursor-help" title="ক্রেতার অ্যাকশন ভিত্তিক স্কোরিং">info</span>
            </h4>
            {lead.score >= 70 && (
              <span className="bg-red-50 text-red-600 border border-red-100 text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full">
                Hot Lead 🔥
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Simple Circular gauge display */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-gray-100 fill-none" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className={`fill-none ${lead.score >= 70 ? 'stroke-red-500' : 'stroke-orange-500'}`} 
                  strokeWidth="6" 
                  strokeDasharray="213" 
                  strokeDashoffset={213 - (213 * lead.score) / 200}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-[24px] font-bold font-outfit text-gray-900">{toBengaliDigits(lead.score)}</span>
                <span className="text-[9px] text-gray-400 font-bold font-sans">/২০০</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <button 
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                className="text-[12px] font-sans font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
              >
                {showScoreBreakdown ? 'বিস্তারিত বন্ধ করুন' : 'কীভাবে এই স্কোর?'} 
                <span className="material-symbols-outlined text-xs">
                  {showScoreBreakdown ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              <p className="text-[12px] text-gray-500 font-sans font-normal leading-tight">
                শোরুমের কাস্টমার ইন্টারেকশন ও এআই অ্যানালিটিক্স স্কোর।
              </p>
            </div>
          </div>

          {showScoreBreakdown && (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2 text-[12px] text-[#6B7280] font-sans font-semibold animate-in slide-in-from-top duration-200">
              <div className="flex justify-between items-center">
                <span>+30 Enquiry submitted</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span>+20 Phone number revealed</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span>+15 Vehicle viewed 3+ times</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span>+7 Email link clicked</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <div className="flex justify-between items-center border-t pt-1 font-bold text-[#111827]">
                <span>মোট স্কোর:</span>
                <span>{toBengaliDigits(lead.score)}/২০০</span>
              </div>
            </div>
          )}
        </section>

        {/* PIPELINE STAGE STEPPER */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 text-left">
          <span className="block text-[11px] font-sans font-semibold text-[#6B7280] uppercase tracking-wider">ধাপ ভিত্তিক অবস্থান</span>
          
          {/* Stepper progress indicator */}
          <div className="flex items-center justify-between px-1">
            {STAGES.map((st, idx) => {
              const isPassed = idx < stageIndex;
              const isCurrent = idx === stageIndex;
              return (
                <React.Fragment key={st}>
                  <div 
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] transition-all duration-200 z-10 shrink-0 ${
                      isCurrent 
                        ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 shadow-sm' 
                        : isPassed 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-100 text-gray-400 border'
                    }`}
                    title={st}
                  >
                    {isPassed ? '✓' : toBengaliDigits(idx + 1)}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`flex-1 h-0.5 transition-all duration-200 ${
                      idx < stageIndex ? 'bg-emerald-500' : 'bg-gray-100'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] font-sans font-semibold text-gray-500 pt-1">
            <span>ধাপ: {lead.stage}</span>
            <span>মোট ৮ ধাপ</span>
          </div>

          {/* Stepper control buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              disabled={stageIndex === 0}
              onClick={handlePrevStage}
              className="h-10 bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-50 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
            >
              ← আগের ধাপ
            </button>
            <button 
              disabled={stageIndex === STAGES.length - 1}
              onClick={handleNextStage}
              className="h-10 bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
            >
              পরের ধাপ →
            </button>
          </div>
        </section>

        {/* FOLLOW-UP SCHEDULER */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-[14px] font-bold text-[#111827]">পরবর্তী ফলো-আপ</h4>
            <button 
              onClick={() => setShowFollowUpModal(true)}
              className="text-[#2563EB] font-bold text-[12px] hover:underline"
            >
              ফলো-আপ পরিবর্তন
            </button>
          </div>

          {followUpInfo ? (
            <div className="space-y-1">
              <p className="text-[14px] font-sans font-semibold text-gray-800">{followUpInfo}</p>
              <div className="flex items-center gap-1.5 text-[12px] text-orange-600 font-bold">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>{followUpCountdown}</span>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-400 italic">ফলো-আপ শিডিউল করা নেই</p>
          )}
        </section>

        {/* ACTIVITY TIMELINE & NOTES */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-[14px] font-bold text-[#111827]">কার্যক্রমের ইতিহাস</h4>
            <span className="text-[12px] text-gray-400 font-sans">ইতিহাস</span>
          </div>

          {/* Timeline Feed */}
          <div className="relative border-l border-gray-100 ml-4 space-y-6 py-2">
            {activities.map((act, idx) => (
              <div key={idx} className="relative pl-8">
                <div className={`absolute left-0 top-0.5 -ml-[16px] w-8 h-8 rounded-full flex items-center justify-center text-[14px] shadow-sm border border-white z-10 ${act.color}`}>
                  <span className="material-symbols-outlined text-[14px]">{act.icon}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-sans font-medium text-[#374151] leading-relaxed">{act.desc}</p>
                    <span className="text-[11px] text-[#6B7280] font-sans font-normal block">{toBengaliDigits(act.time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes Input Area (Auto-saves on blur) */}
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex justify-between items-center text-[11px] font-sans font-semibold text-[#6B7280] pb-1">
              <span>নোট লিখুন (Auto-saves on blur)</span>
              {savedIndicator && (
                <span className="text-emerald-600 font-bold animate-pulse">✓ সেভ হয়েছে</span>
              )}
            </div>
            <textarea
              placeholder="✏️ নোট লিখুন..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleNoteBlur}
              className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] focus:ring-1 focus:ring-[#2563EB] focus:outline-none min-h-[60px]"
            />
          </div>
        </section>

      </main>

      {/* STICKY BOTTOM ACTION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4 flex flex-col items-center gap-2 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => addToast('success', 'ডিল সফলভাবে তৈরি করা হয়েছে')}
          className="w-full max-w-md h-12 bg-[#2563EB] text-white rounded-xl font-bold flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all text-xs shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          ডিলে পরিণত করুন
        </button>
        <button 
          onClick={() => setShowLostBottomSheet(true)}
          className="w-full text-center text-red-600 hover:underline text-[12px] font-bold py-1"
        >
          Lost হিসেবে মার্ক করুন
        </button>
      </div>

      {/* LOST REASON BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {showLostBottomSheet && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
            <div className="absolute inset-0" onClick={() => setShowLostBottomSheet(false)} />
            
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-6 shadow-2xl relative z-10 text-[#111827] text-left"
            >
              <div className="border-b pb-3">
                <h3 className="text-[16px] font-sans font-semibold text-red-600 font-outfit">🚨 Lost হওয়ার কারণ নির্বাচন করুন</h3>
                <p className="text-[12px] text-[#6B7280] font-sans font-normal mt-1">লিডটি হারিয়ে যাওয়ার কারণ জানানো বাধ্যতামূলক।</p>
              </div>

              <form onSubmit={handleLostConfirm} className="space-y-4">
                <div className="space-y-2">
                  {[
                    'দামের পার্থক্য',
                    'অন্য জায়গা থেকে কিনেছেন',
                    'মত পরিবর্তন করেছেন',
                    'বাজেট সমস্যা',
                    'সাড়া দেননি',
                    'অন্যান্য'
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-2.5 text-[14px] font-sans font-semibold text-[#374151] cursor-pointer">
                      <input
                        type="radio"
                        name="lostReason"
                        value={reason}
                        checked={selectedLostReason === reason}
                        onChange={() => setSelectedLostReason(reason)}
                        className="w-4 h-4 text-red-600"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {selectedLostReason === 'অন্যান্য' && (
                  <input
                    type="text"
                    required
                    placeholder="অন্যান্য কারণ লিখুন..."
                    value={customLostReason}
                    onChange={(e) => setCustomLostReason(e.target.value)}
                    className="w-full h-11 bg-white border border-[#E5E7EB] rounded-lg px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                )}

                <button
                  type="submit"
                  disabled={!selectedLostReason || (selectedLostReason === 'অন্যান্য' && !customLostReason)}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold transition-all text-xs shadow-md"
                >
                  লিড বন্ধ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOLLOW-UP SCHEDULER MODAL */}
      <AnimatePresence>
        {showFollowUpModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
            <div className="absolute inset-0" onClick={() => setShowFollowUpModal(false)} />
            
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-6 shadow-2xl relative z-10 text-[#111827] text-left"
            >
              <div className="border-b pb-3">
                <h3 className="text-[16px] font-sans font-semibold text-[#111827] font-outfit">📅 Follow-up সেট করুন</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[12px] font-sans font-semibold text-[#6B7280]">তারিখ</span>
                    <input 
                      type="date" 
                      value={followUpDate} 
                      onChange={e => setFollowUpDate(e.target.value)} 
                      className="w-full h-11 border rounded-lg px-2 text-[14px] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[12px] font-sans font-semibold text-[#6B7280]">সময়</span>
                    <input 
                      type="time" 
                      value={followUpTime} 
                      onChange={e => setFollowUpTime(e.target.value)} 
                      className="w-full h-11 border rounded-lg px-2 text-[14px] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[12px] font-sans font-semibold text-[#6B7280]">চ্যানেল (Channel)</span>
                  <div className="flex gap-2">
                    {['WhatsApp', 'Call', 'SMS'].map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setFollowUpChannel(ch)}
                        className={`flex-1 h-11 rounded-lg border font-bold text-xs transition-all ${
                          followUpChannel === ch
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                        }`}
                      >
                        {ch === 'WhatsApp' ? '💬 WhatsApp' : ch === 'Call' ? '📞 Call' : '💬 SMS'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFollowUpInfo(`শনিবার, ১৮ জুলাই, বিকেল ৩:০০ মিনিট (${followUpChannel} দ্বারা)`);
                    setFollowUpCountdown('২২ ঘণ্টা ৩২ মিনিট বাকি');
                    setShowFollowUpModal(false);
                    addToast('success', 'ফলো-আপ শিডিউল করা হয়েছে');
                  }}
                  className="w-full h-11 bg-[#2563EB] text-white rounded-lg font-bold text-xs shadow-md mt-2 min-h-[44px]"
                >
                  সেভ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
