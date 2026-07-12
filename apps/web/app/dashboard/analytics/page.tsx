'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

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

// Demo data for Recharts area line graph (Sales trend last 30 days)
const SALES_TREND_DATA = [
  { day: 'Day 1', sales: 1 },
  { day: 'Day 5', sales: 3 },
  { day: 'Day 10', sales: 2 },
  { day: 'Day 15', sales: 5 },
  { day: 'Day 20', sales: 4 },
  { day: 'Day 25', sales: 7 },
  { day: 'Day 30', sales: 8 }
];

// Lead Source donut chart data
const LEAD_SOURCE_DATA = [
  { name: 'Marketplace', value: 45, color: '#2563EB' },
  { name: 'Facebook', value: 25, color: '#1877F2' },
  { name: 'Walk-in', value: 20, color: '#16A34A' },
  { name: 'Website', value: 10, color: '#7C3AED' }
];

// Lead Funnel data (horizontal bar chart, 8 stages)
const LEAD_FUNNEL_DATA = [
  { stage: 'New', count: 120 },
  { stage: 'Contacted', count: 90 },
  { stage: 'Qualified', count: 70 },
  { stage: 'Test Drive', count: 50 },
  { stage: 'Quote Sent', count: 35 },
  { stage: 'Negotiation', count: 20 },
  { stage: 'Closed', count: 12 },
  { stage: 'Lost', count: 8 }
];

interface Insight {
  id: string;
  type: 'PRICING' | 'DEMAND' | 'CONVERSION' | 'EXPENSE';
  title: string;
  desc: string;
  priority: number;
}

const MOCK_INSIGHTS: Insight[] = [
  { id: '1', type: 'DEMAND', title: 'Toyota Axio-র চাহিদা বৃদ্ধি', desc: 'গত সপ্তাহে ঢাকায় Axio গাড়ির সার্চ ভলিউম ১৫% বেড়েছে। আপনার স্টক রেডি রাখুন।', priority: 9 },
  { id: '2', type: 'PRICING', title: 'Honda Fit পুনঃমূল্যায়ন পরামর্শ', desc: 'বাজার গড় মূল্যের চেয়ে আপনার দাম ৩% বেশি। বিক্রির গতি বাড়াতে দাম সামঞ্জস্য করতে পারেন।', priority: 8 },
  { id: '3', type: 'CONVERSION', title: 'নতুন লিড রেসপন্স রেট বৃদ্ধি', desc: 'হোয়াটসঅ্যাপ মেসেজ রেসপন্স সময় ১৫ মিনিটে নামিয়ে আনলে কনভার্সন ২০% বৃদ্ধি পাবে।', priority: 7 },
  { id: '4', type: 'EXPENSE', title: 'শোরুম রি-কনস্ট্রাকশন খরচ সতর্কতা', desc: 'গত মাসে গাড়ির গড় রিকনস্ট্রাকশন ব্যয় BDT ১৫,০০০ বেশি হয়েছে। ভেন্ডর কস্টিং চেক করুন।', priority: 6 },
  { id: '5', type: 'DEMAND', title: 'SUV ক্যাটাগরির ক্রেতা ট্রাফিক', desc: 'চট্টগ্রাম বিভাগ থেকে SUV/X-Trail গাড়ির ক্যোয়ারী এ মাসে ২৫% বেশি এসেছে।', priority: 5 }
];

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');

  // Owner flag for showing financial sections (Section 2.10 RBAC)
  const isOwner = true; 

  useEffect(() => {
    setMounted(true);
  }, []);

  const getBadgeColor = (type: Insight['type']) => {
    switch (type) {
      case 'PRICING': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'DEMAND': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'CONVERSION': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'EXPENSE': return 'bg-red-50 text-red-600 border-red-200';
    }
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
        <span className="font-extrabold text-sm text-[#111827] font-outfit">অ্যানালিটিক্স ও রিপোর্টস</span>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto w-full p-6 space-y-6">
        
        {/* Period Selector Tabs */}
        <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs font-bold shrink-0">
          {[
            { id: 'today', label: 'আজ' },
            { id: 'week', label: 'সপ্তাহ' },
            { id: 'month', label: 'মাস' },
            { id: 'custom', label: 'কাস্টম' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePeriod(tab.id as any)}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activePeriod === tab.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI Cards Row (Owner sees financial) */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">বিক্রিত গাড়ি</span>
            <span className="text-2xl font-extrabold font-outfit text-[#111827] block mt-1">
              {toBengaliDigits(12)} টি
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">আয় (BDT Revenue)</span>
            <span className="text-xl font-extrabold font-outfit text-[#16A34A] block mt-1 truncate">
              {isOwner ? `BDT ${toBengaliDigits('১.৭২')}Cr` : '—'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">নতুন লিড</span>
            <span className="text-2xl font-extrabold font-outfit text-[#111827] block mt-1">
              {toBengaliDigits(120)} টি
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">রূপান্তর হার (CR)</span>
            <span className="text-2xl font-extrabold font-outfit text-indigo-600 block mt-1">
              {toBengaliDigits(10)}%
            </span>
          </div>
        </section>

        {/* Charts block (Safe Recharts hydration wrapper check) */}
        {mounted ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Chart 1: Sales Trend (Area Chart) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">বিক্রয় ট্রেন্ড (Sales Trend 30 Days)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Lead Funnel (Horizontal Bar) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">লিড ফানেল (Lead Funnel - 8 Stages)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={LEAD_FUNNEL_DATA} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 9 }} width={70} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Lead Source (Donut) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">লিড সোর্সিং বন্টন (Lead Source Splitting)</h3>
              <div className="flex items-center justify-between gap-4">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={LEAD_SOURCE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {LEAD_SOURCE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Donut Legend */}
                <div className="flex-1 space-y-2 text-xs font-semibold">
                  {LEAD_SOURCE_DATA.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#6B7280]">{item.name}</span>
                      </div>
                      <span className="text-[#111827]">{toBengaliDigits(item.value)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Recharts Hydration Skeleton loader placeholder */
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white border border-[#E5E7EB] rounded-2xl animate-pulse flex items-center justify-center text-xs text-[#6B7280] font-bold">
                লোডিং গ্রাফ...
              </div>
            ))}
          </div>
        )}

        {/* Maestro Insights section */}
        <section className="space-y-4">
          <h3 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider pl-2.5 border-l-2 border-[#2563EB]">
            Maestro AI Insights
          </h3>
          <div className="space-y-3">
            {MOCK_INSIGHTS.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                    <h4 className="font-bold text-xs text-[#111827]">{item.title}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border border-opacity-40 uppercase ${getBadgeColor(item.type)}`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] leading-relaxed font-semibold">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
