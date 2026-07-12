'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PriceTrendsChart from '../../../../components/PriceTrendsChart';

interface TrendDataPoint {
  date: string;
  avg_price: number;
  median_price: number;
  listing_count: number;
}

interface PriceTrendsDashboardProps {
  make: string;
  model: string;
  trendData: TrendDataPoint[];
  activeListings: any[];
}

function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '৳ ').replace('Rs', '৳ ');
}

export default function PriceTrendsDashboard({ make, model, trendData, activeListings }: PriceTrendsDashboardProps) {
  const [selectedMonths, setSelectedMonths] = useState<3 | 6 | 12>(6);
  const [calcYear, setCalcYear] = useState('2019');
  const [calcMileage, setCalcMileage] = useState('45000');
  const [estimatedValuation, setEstimatedValuation] = useState<number | null>(null);

  // Filter trend points based on selected months
  const filteredTrendData = useMemo(() => {
    return trendData.slice(-selectedMonths);
  }, [trendData, selectedMonths]);

  // Calculate statistics based on current selection
  const currentPoint = filteredTrendData[filteredTrendData.length - 1];
  const initialPoint = filteredTrendData[0];
  const avgPrice = currentPoint?.avg_price || 0;
  
  const pctChange = useMemo(() => {
    if (!initialPoint || !currentPoint) return 0;
    return ((currentPoint.avg_price - initialPoint.avg_price) / initialPoint.avg_price) * 100;
  }, [initialPoint, currentPoint]);

  // Max and Min range
  const priceRange = useMemo(() => {
    const prices = filteredTrendData.map(d => d.avg_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  }, [filteredTrendData]);

  // Market signal logic
  const marketAnalysis = useMemo(() => {
    if (pctChange < -1.5) {
      return {
        signal: 'Buy',
        badgeColor: 'text-green-600 bg-green-50 border-green-200',
        barColor: 'bg-green-600',
        desc: 'গড় বাজার মূল্য গত কয়েক মাসে হ্রাস পেয়েছে। ক্রেতাদের জন্য গাড়ি কেনার এখনই সেরা সুযোগ!',
        details: 'নতুন আমদানি শুল্ক কমার কারণে জাপানি গাড়ির বুকিং মূল্য হ্রাস পেয়েছে। ক্রেতারা অপেক্ষাকৃত কম বাজেটে ভালো কন্ডিশনের গাড়ি সংগ্রহ করতে পারবেন।'
      };
    } else if (pctChange > 1.5) {
      return {
        signal: 'Sell',
        badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
        barColor: 'bg-blue-600',
        desc: 'বাজার গড় মূল্য ঊর্ধ্বমুখী রয়েছে। বিক্রেতাদের গাড়ি বিক্রি করে সর্বোচ্চ রিটার্ন পাওয়ার ভালো সময়।',
        details: 'ডলারের মূল্যবৃদ্ধির কারণে নতুন আমদানিকৃত গাড়ির খরচ বেশি হচ্ছে, যার ফলে বাজারে ব্যবহৃত এবং রিকন্ডিশন গাড়ির গড় চাহিদা ও মূল্য বাড়ছে।'
      };
    } else {
      return {
        signal: 'Hold',
        badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500',
        desc: 'বাজার মূল্য বর্তমানে অত্যন্ত স্থিতিশীল রয়েছে। গাড়ি কেনা বা বেচার জন্য এটি অত্যন্ত সাধারণ সময়।',
        details: 'বাজারে সরবরাহ এবং চাহিদা সমান্তরালে রয়েছে। মূল্য পরিবর্তনের গতি ধীর হওয়ায় দীর্ঘমেয়াদী পরিকল্পনায় গাড়ি কেনা বা বিক্রি করা নিরাপদ।'
      };
    }
  }, [pctChange]);

  // Quick Fair Price Calculator logic
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const yearDiff = 2026 - Number(calcYear);
    const mileage = Number(calcMileage) || 0;
    
    // Base valuation calculation formula
    let multiplier = 1 - (yearDiff * 0.05); // 5% depreciation per year
    if (mileage > 50000) {
      multiplier -= ((mileage - 50000) / 10000) * 0.015; // 1.5% depreciation per 10k km above 50k
    }
    
    const estimated = Math.round(avgPrice * Math.max(0.5, multiplier));
    setEstimatedValuation(estimated);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="block text-[10px] md:text-xs font-bold text-textSecondary uppercase tracking-wider">গড় বাজার মূল্য</span>
          <span className="block text-xl md:text-2xl font-bold text-textPrimary font-outfit">{formatBDT(avgPrice)}</span>
          <span className="block text-[10px] text-textSecondary font-semibold">বিগত ৩০ দিনের আপডেট</span>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="block text-[10px] md:text-xs font-bold text-textSecondary uppercase tracking-wider">বাজার ওঠানামা</span>
          <div className="flex items-center gap-1">
            <span className={`material-symbols-outlined text-lg font-bold ${pctChange < 0 ? 'text-green-600' : 'text-blue-600'}`}>
              {pctChange < 0 ? 'trending_down' : 'trending_up'}
            </span>
            <span className={`text-xl md:text-2xl font-bold font-outfit ${pctChange < 0 ? 'text-green-600' : 'text-blue-600'}`}>
              {pctChange > 0 ? `+${pctChange.toFixed(1)}%` : `${pctChange.toFixed(1)}%`}
            </span>
          </div>
          <span className="block text-[10px] text-textSecondary font-semibold">সিলেকশন রেঞ্জ অনুযায়ী</span>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="block text-[10px] md:text-xs font-bold text-textSecondary uppercase tracking-wider">সর্বোচ্চ ও সর্বনিম্ন রেঞ্জ</span>
          <span className="block text-sm md:text-base font-bold text-textPrimary font-outfit">
            {formatBDT(priceRange.min)} - {formatBDT(priceRange.max)}
          </span>
          <span className="block text-[10px] text-textSecondary font-semibold">বিগত ৬ মাসের গড় সীমা</span>
        </div>

        <div className={`p-4 md:p-6 rounded-2xl border shadow-sm space-y-1 ${marketAnalysis.badgeColor} col-span-2 lg:col-span-1`}>
          <span className="block text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-85">মার্কেট সিগন্যাল (Signal)</span>
          <div className="flex items-center gap-2">
            <span className="block text-xl md:text-2xl font-extrabold font-outfit uppercase tracking-widest">{marketAnalysis.signal}</span>
            <span className="material-symbols-outlined text-xl">recommend</span>
          </div>
          <span className="block text-[10px] opacity-85 font-semibold">Maestro AI মার্কেট পরামর্শ</span>
        </div>
      </div>

      {/* 2-Column Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (66%) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-textPrimary">ঐতিহাসিক মূল্য সূচক চার্ট</h3>
                <p className="text-xs text-textSecondary">সিলেক্টেড রেঞ্জের জন্য গাড়ির দামের গাণিতিক গড় ও ট্রেন্ড লাইন।</p>
              </div>
              
              {/* Tab Selector */}
              <div className="flex gap-1 bg-gray-150 p-1 rounded-xl text-xs font-bold self-end sm:self-center">
                {[
                  { label: '৩ মাস', value: 3 },
                  { label: '৬ মাস', value: 6 },
                  { label: '১ বছর', value: 12 },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedMonths(tab.value as any)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedMonths === tab.value 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Embedded Recharts Area Line */}
            <PriceTrendsChart data={filteredTrendData} />

            {/* AI Summary Banner */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${marketAnalysis.badgeColor}`}>
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">analytics</span>
              <div className="space-y-1">
                <p className="font-bold">{marketAnalysis.desc}</p>
                <p className="opacity-90">{marketAnalysis.details}</p>
              </div>
            </div>
          </div>

          {/* MoM table (Mobile Collapsible) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-textPrimary">মাসিক গড় ও মিডিয়ান মূল্য তালিকা</h3>
            <div className="overflow-x-auto border border-gray-250 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-textSecondary font-bold">
                    <th className="p-3.5">রেকর্ডকৃত মাস</th>
                    <th className="p-3.5">গড় মূল্য</th>
                    <th className="p-3.5">মিডিয়ান মূল্য</th>
                    <th className="p-3.5 text-right">বিজ্ঞাপন সংখ্যা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredTrendData.map((pt, idx) => {
                    const d = new Date(pt.date);
                    const label = d.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
                    return (
                      <tr key={idx} className="hover:bg-gray-50 font-semibold text-textPrimary transition-colors">
                        <td className="p-3.5">{label}</td>
                        <td className="p-3.5">{formatBDT(pt.avg_price)}</td>
                        <td className="p-3.5">{formatBDT(pt.median_price)}</td>
                        <td className="p-3.5 text-right text-textSecondary">{pt.listing_count}টি</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Sidebar (33%) */}
        <div className="space-y-6">
          
          {/* Interactive Valuation Calculator (Requested: Smart & Informative) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-textPrimary">
              <span className="material-symbols-outlined text-primary">calculate</span>
              <h3 className="font-bold text-base">IMV ফেয়ার ভ্যালু ক্যালকুলেটর</h3>
            </div>
            
            <p className="text-xs text-textSecondary leading-relaxed">
              আপনার গাড়ির উৎপাদন বছর এবং মাইলেজ ইনপুট করে বর্তমান বাজার দর অনুযায়ী আনুমানিক মূল্য যাচাই করুন।
            </p>

            <form onSubmit={handleCalculate} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary">ম্যানুফ্যাকচার বছর</label>
                <select
                  value={calcYear}
                  onChange={(e) => setCalcYear(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white"
                >
                  {['2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary">গাড়ির মাইলেজ (KM)</label>
                <input
                  type="text"
                  placeholder="যেমন: ৪৫০০০"
                  value={calcMileage}
                  onChange={(e) => setCalcMileage(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-primary focus:border-primary bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:brightness-110 text-white py-2.5 rounded-lg font-bold transition-all text-xs shadow-md active:scale-95"
              >
                মূল্য অনুমান করুন
              </button>
            </form>

            {estimatedValuation && (
              <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl text-center space-y-1 animate-in fade-in duration-300">
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">আনুমানিক বাজার মূল্য</span>
                <span className="text-xl font-bold text-primary block font-outfit">
                  {formatBDT(estimatedValuation)}
                </span>
                <span className="text-[9px] text-textSecondary block">
                  *এই মূল্যটি গাড়ির বাস্তব কন্ডিশন ও অন্যান্য ফিচারের ওপর নির্ভর করে পরিবর্তনশীল।
                </span>
              </div>
            )}
          </div>

          {/* Quick Informative Market Analytics */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-textPrimary">গাড়ির বাজার রেটিং</h3>
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between border-b pb-2">
                <span className="text-textSecondary">জনপ্রিয়তা সূচক</span>
                <span className="text-primary font-bold">খুব ভালো (High)</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-textSecondary">গড় অবমূল্যায়ন হার</span>
                <span className="text-textPrimary">প্রতি বছর ৫%-৭%</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-textSecondary">লিকুইডিটি স্কোর</span>
                <span className="text-textPrimary">৯.২ / ১০ (সহজেই বিক্রয়যোগ্য)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
