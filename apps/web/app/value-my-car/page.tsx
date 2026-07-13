'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Helper to convert Bengali digits to English digits
function convertBengaliToEnglishDigits(str: string): string {
  const bnToEng: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.split('').map(char => bnToEng[char] || char).join('');
}

function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

export default function ValueMyCarPage() {
  // Input fields
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Axio');
  const [year, setYear] = useState('2018');
  const [mileage, setMileage] = useState('50000');
  const [condition, setCondition] = useState('Good');
  const [fuelType, setFuelType] = useState('Octane/Hybrid');

  // Valuation result state
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valuationData, setValuationData] = useState<{
    low: number;
    average: number;
    high: number;
  } | null>(null);

  const handleCalculateValuation = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanYear = Number(convertBengaliToEnglishDigits(year));
    const cleanMileage = Number(convertBengaliToEnglishDigits(mileage));

    if (isNaN(cleanYear) || cleanYear < 1980 || cleanYear > 2026) {
      setErrorMsg('অনুগ্রহ করে সঠিক বছর প্রদান করুন (যেমন: 2018)');
      setLoading(false);
      return;
    }

    if (isNaN(cleanMileage) || cleanMileage <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক মাইলেজ প্রদান করুন');
      setLoading(false);
      return;
    }

    // Simulate database lookup/calculation
    setTimeout(() => {
      // Base value logic
      let baseVal = 1800000;
      if (make === 'Toyota') baseVal = 1900000;
      if (make === 'Honda') baseVal = 1600000;
      if (make === 'Nissan') baseVal = 2100000;

      // Depreciate by age
      const age = 2026 - cleanYear;
      baseVal -= age * 80000;

      // Depreciate by mileage
      baseVal -= (cleanMileage / 10000) * 30000;

      // Condition multiplier
      if (condition === 'Excellent') baseVal += 150000;
      if (condition === 'Fair') baseVal -= 200000;

      // Limit bounds
      const avg = Math.max(500000, baseVal);
      const low = Math.floor(avg * 0.92);
      const high = Math.floor(avg * 1.08);

      setValuationData({ low, average: avg, high });
      setLoading(false);
      setShowResult(true);
    }, 1200);
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      
      {/* Navbar/Header */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-base font-outfit text-white">
            G
          </div>
          <span className="font-extrabold text-sm text-[#111827] font-outfit">GariSale</span>
        </Link>
        <Link href="/sell" className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm">
          গাড়ি বিক্রি করুন
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 space-y-10">
        
        {/* Intro */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="bg-blue-50 text-[#2563EB] text-[9px] font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
            IMV Valuation Engine
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827]">আপনার গাড়ির সঠিক দাম কত?</h1>
          <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">
            গাড়িসেল-এর ইন্টেলিজেন্ট মার্কেট ভ্যালু (IMV) অ্যালগরিদম ব্যবহার করে মাত্র ১ মিনিটে আপনার গাড়ির বর্তমান বাজার মূল্য জানুন।
          </p>
        </div>

        {/* Two Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Panel: Inputs Form */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-[#111827] border-b pb-2 uppercase tracking-wider">গাড়ির বিবরণ দিন</h2>
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCalculateValuation} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ব্র্যান্ড (Make)</label>
                  <select 
                    value={make} 
                    onChange={e => setMake(e.target.value)}
                    className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 text-xs font-bold text-[#111827] focus:outline-none"
                  >
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="Nissan">Nissan</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মডেল (Model)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="যেমন: Axio" 
                    value={model} 
                    onChange={e => setModel(e.target.value)} 
                    className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 text-xs font-bold text-[#111827] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ম্যানুফ্যাকচারিং বছর</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="যেমন: 2018" 
                    value={year} 
                    onChange={e => setYear(convertBengaliToEnglishDigits(e.target.value))} 
                    className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 text-xs font-bold text-[#111827] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মাইলেজ (কি.মি.)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="যেমন: ৫০,০০০" 
                    value={mileage} 
                    onChange={e => setMileage(convertBengaliToEnglishDigits(e.target.value))} 
                    className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 text-xs font-bold text-[#111827] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">গাড়ির কন্ডিশন</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Excellent', 'Good', 'Fair'].map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCondition(cond)}
                      className={`h-11 border rounded-xl text-xs font-bold transition-all ${
                        condition === cond 
                          ? 'border-[#2563EB] bg-blue-50/20 text-[#2563EB]' 
                          : 'border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-500'
                      }`}
                    >
                      {cond === 'Excellent' ? 'চমৎকার ✨' : cond === 'Good' ? 'ভালো 👍' : 'মোটামুটি ⚠️'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">জ্বালানির ধরন (Fuel Type)</label>
                <select 
                  value={fuelType} 
                  onChange={e => setFuelType(e.target.value)}
                  className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 text-xs font-bold text-[#111827] focus:outline-none"
                >
                  <option value="Octane/Hybrid">Octane / Hybrid</option>
                  <option value="Petrol">Petrol</option>
                  <option value="CNG/LPG">CNG / LPG</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>হিসাব করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">calculate</span>
                    <span>বাজার মূল্য হিসাব করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Panel: Results Preview */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm min-h-[380px] flex flex-col justify-between">
            {!showResult ? (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">search_insights</span>
                </div>
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">ফলাফল এখানে দেখাবে</h3>
                <p className="text-[11px] text-[#6B7280] max-w-[240px] leading-relaxed">
                  বামের ফর্মে সঠিক তথ্য দিয়ে সাবমিট করার পর রিয়েল-টাইম হিসাবকৃত মূল্যের চার্ট এবং সীমানা এখানে দেখা যাবে।
                </p>
              </div>
            ) : (
              // High Fidelity Valuation Result
              <div className="space-y-6 animate-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase tracking-wider">
                    Calculated Successfully
                  </span>
                  <h3 className="font-extrabold text-sm text-[#111827] pt-1.5">{make} {model} ({toBengaliDigits(year)})</h3>
                  <span className="text-[10px] text-gray-500 font-semibold block">মাইলেজ: {toBengaliDigits(Number(mileage).toLocaleString())} কি.মি. · কন্ডিশন: {condition}</span>
                </div>

                {/* Fair Market Value Box */}
                <div className="bg-gray-50 border p-4.5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">আনুমানিক গড় বাজার মূল্য (Estimated Average)</span>
                  <span className="text-xl md:text-2xl font-extrabold text-[#2563EB] font-sans block">
                    BDT {toBengaliDigits(valuationData!.average.toLocaleString())}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold block">সীমা: BDT {toBengaliDigits(valuationData!.low.toLocaleString())} – BDT {toBengaliDigits(valuationData!.high.toLocaleString())}</span>
                </div>

                {/* Price range progress indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-[#6B7280] uppercase">
                    <span>কম দাম (Low)</span>
                    <span>গড় দাম (Average)</span>
                    <span>বেশি দাম (High)</span>
                  </div>
                  <div className="relative h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="w-[33%] bg-emerald-300" />
                    <div className="w-[34%] bg-[#2563EB] relative">
                      {/* Marker pin */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white" />
                    </div>
                    <div className="w-[33%] bg-amber-300" />
                  </div>
                  <span className="text-[9px] text-[#6B7280] leading-relaxed block text-center font-medium">
                    * আপনার গাড়িটি বাজারে বিক্রি করার জন্য এটি আদর্শ দাম।
                  </span>
                </div>

                {/* CTAs */}
                <div className="space-y-2 pt-4 border-t">
                  <Link 
                    href="/sell"
                    className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    নিজে বিজ্ঞাপন দিন (Create Listing)
                  </Link>
                  <Link
                    href="/dealers"
                    className="w-full h-11 border border-gray-300 hover:bg-gray-50 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">store</span>
                    ডিলারের কাছে সরাসরি বিক্রি করুন
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
