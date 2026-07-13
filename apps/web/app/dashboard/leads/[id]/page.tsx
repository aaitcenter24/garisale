'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'রফিক হাসান', phone: '01711223344', carInterest: 'Toyota Axio 2019', stage: 'New', score: 85, priority: 'hot', timeInStage: '৩ ঘণ্টা আগে', hoursUncontacted: 3, source: 'Marketplace' },
  { id: '2', name: 'জামিল আহমেদ', phone: '01822334455', carInterest: 'Honda Fit 2018', stage: 'Contacted', score: 62, priority: 'warm', timeInStage: '৫ ঘণ্টা আগে', hoursUncontacted: 5, source: 'Walk-in' },
  { id: '3', name: 'করিম উল্লাহ', phone: '01933445566', carInterest: 'Toyota Premio 2017', stage: 'Qualified', score: 45, priority: 'cold', timeInStage: '১ দিন আগে', hoursUncontacted: 24, source: 'Facebook Page' },
  { id: '4', name: 'সাদিয়া রহমান', phone: '01544556677', carInterest: 'Nissan X-Trail 2019', stage: 'Test Drive', score: 92, priority: 'hot', timeInStage: '২ ঘণ্টা আগে', hoursUncontacted: 2, source: 'Marketplace' },
  { id: '5', name: 'আবুল কালাম', phone: '01655667788', carInterest: 'Toyota Axio 2019', stage: 'Negotiation', score: 78, priority: 'hot', timeInStage: '১ ঘণ্টা আগে', hoursUncontacted: 1, source: 'Website API' }
];

const STAGES: Lead['stage'][] = ['New', 'Contacted', 'Qualified', 'Test Drive', 'Quote Sent', 'Negotiation', 'Closed', 'Lost'];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const leadId = params.id;
  
  // Find lead or use default fallback
  const initialLead = useMemo(() => {
    return MOCK_LEADS.find(l => l.id === leadId) || MOCK_LEADS[0];
  }, [leadId]);

  const [lead, setLead] = useState<Lead>(initialLead);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<string[]>([
    'ক্রেতা বাজেট নিয়ে আলোচনার করতে আগ্রহী।',
    'গাড়িটির টেস্ট ড্রাইভের জন্য রবিবার আসতে চেয়েছেন।'
  ]);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Follow-up & Lost modal states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('2026-07-18');
  const [followUpTime, setFollowUpTime] = useState('15:00');
  const [followUpChannel, setFollowUpChannel] = useState('WhatsApp');
  const [followUpInfo, setFollowUpInfo] = useState<string | null>(null);

  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostReason, setLostReason] = useState('দামে মেলেনি (Price)');

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes([noteText, ...notes]);
    setNoteText('');
  };

  const handleNextStage = () => {
    const currentIndex = STAGES.indexOf(lead.stage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      setLead({ ...lead, stage: nextStage, timeInStage: '১ মিনিট আগে' });
    }
  };

  const initials = lead.name.split(' ').map(n => n[0]).join('');

  // 2-Tap WhatsApp link generation
  const whatsappMsg = `হ্যালো ${lead.name}! আমি ঢাকা প্রিমিয়াম মটরস থেকে তানভীর বলছি। আপনার পছন্দের ${lead.carInterest} সম্পর্কে বিস্তারিত আলোচনার জন্য এই চ্যাটে যুক্ত হতে পারেন।`;
  const whatsappUrl = `https://wa.me/${lead.phone}?text=${encodeURIComponent(whatsappMsg)}`;

  // Stepper active counts
  const stageIndex = STAGES.indexOf(lead.stage);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-10">
      
      {/* Top Bar Navigation */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-[#6B7280] hover:text-[#111827]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          পেছনে
        </button>
        <span className="font-extrabold text-sm text-[#111827] font-outfit">লিড বিবরণ</span>
        <button className="text-[#6B7280] hover:text-[#111827]">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </header>

      {/* Main CRM Details Workspace Container */}
      <main className="max-w-md mx-auto w-full p-4 space-y-6">
        
        {/* HERO SECTION (White Card, Buyer info) */}
        <section className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200 mx-auto flex items-center justify-center font-bold text-lg shadow-sm">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111827] font-outfit">{lead.name}</h2>
            <Link 
              href={`tel:${lead.phone}`}
              className="text-xs text-[#2563EB] font-semibold hover:underline block mt-1"
            >
              📞 {lead.phone}
            </Link>
          </div>
          <div className="flex justify-center gap-2 text-[10px] font-bold text-[#6B7280] flex-wrap">
            <span className="bg-gray-100 px-2.5 py-1 rounded-full">{lead.source}</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded-full">{lead.timeInStage}</span>
            <span className="bg-blue-50 text-[#2563EB] px-2.5 py-1 rounded-full">বাজেট: BDT ১০L – ১৫L</span>
          </div>
        </section>

        {/* ACTION BUTTONS (THE CRITICAL 2-TAP UX) */}
        <section className="space-y-3">
          {/* Row 1: Green WhatsApp reply CTA */}
          <Link 
            href={whatsappUrl}
            target="_blank"
            className="w-full h-14 bg-[#16A34A] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            💬 WhatsApp-এ Reply করুন
          </Link>

          {/* Row 2: Secondary call and followups */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Link 
                href={`tel:${lead.phone}`}
                className="h-12 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-xs shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-[#6B7280]">call</span>
                📞 Call করুন
              </Link>
              <button 
                onClick={() => setShowFollowUpModal(true)}
                className="h-12 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-xs shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-[#6B7280]">calendar_month</span>
                📅 Follow-up সেট করুন
              </button>
            </div>
            {followUpInfo && (
              <div className="bg-[#EFF6FF] border border-blue-100 p-2.5 rounded-lg text-[10px] font-bold text-[#2563EB] text-center animate-in slide-in-from-top-1">
                {followUpInfo}
              </div>
            )}
          </div>
        </section>

        {/* VEHICLE OF INTEREST CARD */}
        <section className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">আগ্রহের গাড়ি</span>
          <div className="flex gap-3">
            <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1" 
                alt={lead.carInterest}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs text-[#111827] truncate">{lead.carInterest}</h4>
              <p className="text-[11px] text-[#16A34A] font-bold mt-0.5">BDT ১৪,৫০,০০০</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[10px] font-bold">
            <span className="text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">Great Deal (IMV)</span>
            <Link href="/search" className="text-[#2563EB] hover:underline flex items-center gap-0.5">
              View Listing <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* PIPELINE STAGE STEPPER */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">পাইপলাইন ধাপ</span>
            <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
              {lead.stage}
            </span>
          </div>

          {/* Stepper Dot visual */}
          <div className="flex items-center justify-between px-2 pt-2">
            {STAGES.map((st, idx) => (
              <React.Fragment key={st}>
                <div 
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx <= stageIndex ? 'bg-[#2563EB]' : 'bg-gray-200'
                  }`}
                  title={st}
                />
                {idx < STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 transition-all ${
                    idx < stageIndex ? 'bg-[#2563EB]' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <button 
            onClick={handleNextStage}
            className="w-full h-10 bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mt-2"
          >
            পরবর্তী ধাপে যান <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </section>

        {/* LEAD SCORE DISPLAY */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">লিড স্কোর</span>
              <span className="block text-2xl font-extrabold font-outfit text-red-600 mt-1">
                {toBengaliDigits(lead.score)}/২০০
              </span>
            </div>
            {lead.score >= 70 && (
              <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                🔥 Hot Lead
              </span>
            )}
          </div>

          <button 
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            className="text-[10px] font-bold text-[#2563EB] hover:underline flex items-center gap-0.5"
          >
            {showScoreBreakdown ? 'বিস্তারিত বন্ধ করুন' : 'বিস্তারিত দেখুন'} 
            <span className="material-symbols-outlined text-xs">
              {showScoreBreakdown ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showScoreBreakdown && (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2 text-[10px] text-[#6B7280] font-semibold animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center">
                <span>+30 Enquiry submitted</span>
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span>+20 Phone revealed</span>
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span>+15 Vehicle viewed 3x</span>
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="flex justify-between items-center border-t pt-1.5 font-bold">
                <span>Score: {lead.score}/200</span>
                <span className="text-[#2563EB]">Active</span>
              </div>
            </div>
          )}
        </section>

        {/* ACTIVITY TIMELINE & NOTES */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">অ্যাক্টিভিটি টাইমলাইন</span>

          {/* Timeline points */}
          <div className="relative border-l border-gray-100 ml-3 space-y-5 py-2">
            {[
              { time: '২ ঘণ্টা আগে', action: '📱 WhatsApp message sent' },
              { time: '৫ ঘণ্টা আগে', action: '📞 Call logged by Salesperson' },
              { time: '৬ ঘণ্টা আগে', action: '➕ Lead registered from Marketplace' }
            ].map((item, idx) => (
              <div key={idx} className="relative pl-6 text-xs">
                <div className="absolute left-0 top-1 -ml-4.5 w-3 h-3 rounded-full bg-gray-200 border-2 border-white shadow-sm" />
                <span className="block font-bold text-[#111827]">{item.action}</span>
                <span className="text-[9px] text-[#6B7280] block mt-0.5">{item.time}</span>
              </div>
            ))}
          </div>

          {/* Notes display */}
          {notes.length > 0 && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <span className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">নোটসমূহ</span>
              <div className="space-y-2">
                {notes.map((note, idx) => (
                  <div key={idx} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[11px] text-[#111827] font-semibold leading-relaxed">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add note area */}
          <div className="space-y-2 pt-2">
            <textarea
              placeholder="একটি নোট যোগ করুন (যেমন: ক্রেতা দাম কমাতে চেয়েছেন...)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleAddNote}
              className="w-full p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none min-h-[60px]"
            />
            <button 
              onClick={handleAddNote}
              className="bg-gray-100 hover:bg-gray-200 text-[#111827] px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            >
              + নোট যোগ করুন
            </button>
          </div>
        </section>

        {/* BOTTOM SECTION CTA */}
        <section className="space-y-3 pt-4 border-t border-gray-200">
          <button className="w-full h-13 bg-[#2563EB] text-white rounded-xl font-bold flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all text-xs shadow-md">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            ডিলে পরিণত করুন
          </button>
          <button 
            onClick={() => setShowLostReasonModal(true)}
            className="block w-full text-center text-[10px] font-bold text-red-600 hover:underline"
          >
            Lost হিসেবে মার্ক করুন
          </button>
        </section>

      </main>

      {/* Follow-up Scheduler Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit">📅 Follow-up সেট করুন</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase">তারিখ</span>
                  <input 
                    type="date" 
                    value={followUpDate} 
                    onChange={e => setFollowUpDate(e.target.value)} 
                    className="w-full h-10 border rounded px-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase">সময়</span>
                  <input 
                    type="time" 
                    value={followUpTime} 
                    onChange={e => setFollowUpTime(e.target.value)} 
                    className="w-full h-10 border rounded px-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">চ্যানেল (Channel)</span>
                <select 
                  value={followUpChannel} 
                  onChange={e => setFollowUpChannel(e.target.value)}
                  className="w-full h-10 border rounded px-2 text-xs focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Call">Call</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setFollowUpInfo(`📅 Follow-up সেট: শনিবার বিকেল ৩টা (${followUpChannel} দ্বারা)`);
                  setShowFollowUpModal(false);
                }}
                className="w-full h-10 bg-[#2563EB] text-white rounded-xl font-bold text-xs shadow-md"
              >
                নিশ্চিত করুন (Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Lost Reason Modal */}
      {showLostReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit text-red-600">🚨 Lost হওয়ার কারণ নির্বাচন করুন</h3>
              <p className="text-[10px] text-[#6B7280] font-bold mt-1">লিডটি হারিয়ে যাওয়ার কারণ জানানো বাধ্যতামূলক।</p>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setLead({ ...lead, stage: 'Lost' });
                setShowLostReasonModal(false);
                alert(`লিডটিকে '${lostReason}' কারণে Lost হিসেবে চিহ্নিত করা হয়েছে।`);
              }}
              className="space-y-4"
            >
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

      </main>
    </div>
  );
}
