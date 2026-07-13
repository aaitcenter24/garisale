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

// BDT formatting helper
function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '৳ ').replace('Rs', '৳ ');
}

export default function AddVehicleWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [variant, setVariant] = useState('');
  const [condition, setCondition] = useState('Reconditioned');
  const [bodyType, setBodyType] = useState('Sedan');
  const [fuelType, setFuelType] = useState('Hybrid');
  const [transmission, setTransmission] = useState('Automatic');
  const [engineCc, setEngineCc] = useState('1500');
  const [color, setColor] = useState('Silver');
  const [mileage, setMileage] = useState('');
  const [acqSource, setAcqSource] = useState('Auction');
  const [acqDate, setAcqDate] = useState('2026-07-13');

  // Step 2: Pricing
  const [askingPrice, setAskingPrice] = useState<number>(1450000);
  const [acquisitionCost, setAcquisitionCost] = useState<number>(1100000);
  const reconTotal = 80000; // Static recon tasks total cost

  // Step 3: Photos
  const [photos, setPhotos] = useState<string[]>([
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1'
  ]);
  const [primaryPhotoIdx, setPrimaryPhotoIdx] = useState(0);

  // Step 4: Publish options
  const [publishMarketplace, setPublishMarketplace] = useState(true);
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['ABS', 'Leather Seats']);

  const [vinScanning, setVinScanning] = useState(false);
  const [vinScanSuccess, setVinScanSuccess] = useState(false);

  // Simulate VIN scan and auto-fill
  const handleVinScan = () => {
    setVinScanning(true);
    setVinScanSuccess(false);
    setTimeout(() => {
      setVinScanning(false);
      setVinScanSuccess(true);
      setMake('Toyota');
      setModel('Axio');
      setYear('2019');
      setVariant('X Grade');
      setCondition('Reconditioned');
      setBodyType('Sedan');
      setFuelType('Hybrid');
      setTransmission('Automatic');
      setEngineCc('1500');
      setColor('Pearl White');
      setMileage('45000');
    }, 2000);
  };

  // Dynamic profit calculation
  const estProfit = useMemo(() => {
    return askingPrice - acquisitionCost - reconTotal;
  }, [askingPrice, acquisitionCost]);

  // Dynamic IMV Rating bar position & badge based on asking price
  const imvRating = useMemo(() => {
    if (askingPrice < 1350000) return { label: 'Great Deal', color: 'text-green-600 bg-green-50 border-green-200', sliderVal: 20 };
    if (askingPrice < 1500000) return { label: 'Good Deal', color: 'text-teal-600 bg-teal-50 border-teal-200', sliderVal: 50 };
    if (askingPrice < 1650000) return { label: 'Fair Price', color: 'text-amber-600 bg-amber-50 border-amber-200', sliderVal: 80 };
    return { label: 'Overpriced', color: 'text-red-600 bg-red-50 border-red-200', sliderVal: 95 };
  }, [askingPrice]);

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const handleUploadPhotoSimulation = () => {
    setPhotos([...photos, 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1']);
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    if (primaryPhotoIdx >= photos.length - 1) {
      setPrimaryPhotoIdx(0);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublishSubmit = () => {
    alert('গাড়িটি সফলভাবে ইনভেন্টরিতে যুক্ত ও গ্লোবাল মার্কেটপ্লেসে পাবলিশ করা হয়েছে!');
    router.push('/dashboard/inventory');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16">
      
      {/* Top Bar Header */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-[#6B7280] hover:text-[#111827]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          পেছনে
        </button>
        <span className="font-extrabold text-sm text-[#111827] font-outfit">গাড়ি যুক্ত করুন</span>
        <div className="w-10" />
      </header>

      {/* STEP INDICATOR (Top, 4 steps) */}
      <div className="bg-white border-b border-gray-100 py-4 shadow-sm shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between px-6 text-xs font-bold">
          {[
            { step: 1, label: '১ গাড়ির তথ্য' },
            { step: 2, label: '২ মূল্য ও খরচ' },
            { step: 3, label: '৩ ছবি' },
            { step: 4, label: '৪ প্রকাশ' }
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center gap-1 flex-1">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep >= item.step ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-[#6B7280]'
                }`}
              >
                {toBengaliDigits(item.step)}
              </div>
              <span className={currentStep === item.step ? 'text-[#2563EB]' : 'text-[#6B7280]'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <main className="max-w-lg mx-auto w-full p-6 space-y-6">
        
        {/* STEP 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* VIN Scan Section */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm text-center space-y-3">
              <button 
                onClick={handleVinScan}
                disabled={vinScanning}
                className="w-20 h-20 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] rounded-full mx-auto flex items-center justify-center transition-all shadow-sm"
              >
                {vinScanning ? (
                  <span className="material-symbols-outlined text-[32px] animate-spin">sync</span>
                ) : vinScanSuccess ? (
                  <span className="material-symbols-outlined text-[32px] text-green-600 animate-bounce">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-[32px]">photo_camera</span>
                )}
              </button>
              <div>
                <h3 className="font-bold text-xs text-[#111827]">VIN স্ক্যান করুন</h3>
                <button onClick={handleVinScan} className="text-[10px] text-[#2563EB] hover:underline font-bold mt-1 block mx-auto">
                  অথবা ম্যানুয়ালি লিখুন
                </button>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#111827] border-b pb-2">সাধারণ তথ্যাবলী</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মেক (Make)</label>
                  <input 
                    type="text" 
                    value={make} 
                    onChange={e => setMake(e.target.value)} 
                    placeholder="যেমন: Toyota"
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মডেল (Model)</label>
                  <input 
                    type="text" 
                    value={model} 
                    onChange={e => setModel(e.target.value)} 
                    placeholder="যেমন: Axio"
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">তৈরির বছর</label>
                  <input 
                    type="text" 
                    value={year} 
                    onChange={e => setYear(e.target.value)} 
                    placeholder="যেমন: 2019"
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ভেরিয়েন্ট (Variant)</label>
                  <input 
                    type="text" 
                    value={variant} 
                    onChange={e => setVariant(e.target.value)} 
                    placeholder="যেমন: X Grade"
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">অবস্থা (Condition)</label>
                  <select 
                    value={condition} 
                    onChange={e => setCondition(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="Reconditioned">Reconditioned</option>
                    <option value="Used">Used</option>
                    <option value="New">New</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">বডি টাইপ (Body Type)</label>
                  <input 
                    type="text" 
                    value={bodyType} 
                    onChange={e => setBodyType(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">জ্বালানি (Fuel Type)</label>
                  <input 
                    type="text" 
                    value={fuelType} 
                    onChange={e => setFuelType(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ট্রান্সমিশন</label>
                  <select 
                    value={transmission} 
                    onChange={e => setTransmission(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ইঞ্জিন ক্ষমতা (CC)</label>
                  <input 
                    type="text" 
                    value={engineCc} 
                    onChange={e => setEngineCc(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মাইলেজ (km)</label>
                  <input 
                    type="text" 
                    value={mileage} 
                    onChange={e => setMileage(e.target.value)} 
                    placeholder="যেমন: ৪৫০০০"
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">অ্যাকুইজিশন সোর্স</label>
                  <select 
                    value={acqSource} 
                    onChange={e => setAcqSource(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="Auction">নিলাম</option>
                    <option value="Local Trade-in">ট্রেড-ইন</option>
                    <option value="Direct Purchase">সরাসরি ক্রয়</option>
                    <option value="Import">আমদানি</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">অ্যাকুইজিশন ডেট</label>
                  <input 
                    type="date" 
                    value={acqDate} 
                    onChange={e => setAcqDate(e.target.value)}
                    className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none" 
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: Pricing & Profit Calculator */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Pricing Input Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#111827] border-b pb-2">মূল্য নির্ধারণ</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">বিক্রয় মূল্য (Asking Price BDT)</label>
                <input 
                  type="number" 
                  value={askingPrice} 
                  onChange={e => setAskingPrice(Number(e.target.value))}
                  className="w-full h-12 bg-gray-50 border border-[#E5E7EB] rounded-xl px-4 text-base font-extrabold text-[#111827] focus:ring-2 focus:ring-[#2563EB] focus:outline-none" 
                />
                <span className="text-xs text-[#2563EB] font-bold block pt-1">
                  {formatBDT(askingPrice)}
                </span>
              </div>
            </div>

            {/* Live Profit Calculator */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider">লাইভ প্রফিট ক্যালকুলেটর</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B7280]">১. বিক্রয় মূল্য (Asking Price)</span>
                  <span className="font-bold text-[#111827]">{formatBDT(askingPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B7280]">২. ক্রয় মূল্য (Acquisition Cost BDT)</span>
                  <input 
                    type="number" 
                    value={acquisitionCost}
                    onChange={e => setAcquisitionCost(Number(e.target.value))}
                    className="w-36 h-9 border border-[#E5E7EB] rounded-lg px-2 text-right text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-bold"
                  />
                </div>
                <div className="flex justify-between items-center text-xs border-b pb-3">
                  <span className="text-[#6B7280]">৩. রিকনস্ট্রাকশন খরচ (Recon Total)</span>
                  <span className="font-bold text-[#111827]">{formatBDT(reconTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-[#111827]">আনুমানিক লাভ (Est. Profit)</span>
                  <span className={`text-base font-extrabold font-outfit ${estProfit >= 0 ? 'text-[#16A34A]' : 'text-red-600'}`}>
                    {formatBDT(estProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Live IMV Widget */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-[#6B7280]">IMV বাজার মূল্য রেটিং</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-opacity-40 ${imvRating.color}`}>
                  {imvRating.label}
                </span>
              </div>
              <div className="relative pt-4">
                <div className="h-2 w-full rounded-full bg-gray-200 flex overflow-hidden">
                  <div className="w-[30%] bg-green-500" />
                  <div className="w-[40%] bg-amber-500" />
                  <div className="w-[30%] bg-red-500" />
                </div>
                <div 
                  style={{ left: `${imvRating.sliderVal}%` }}
                  className="absolute top-2.5 -ml-1 w-2.5 h-5 bg-[#2563EB] border-2 border-white rounded-full shadow-md transition-all duration-300"
                />
              </div>
              <div className="flex justify-between text-[8px] font-bold text-[#6B7280] uppercase">
                <span>Low Price</span>
                <span>Average</span>
                <span>High Price</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Photos Upload */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Drop Zone */}
            <div 
              onClick={handleUploadPhotoSimulation}
              className="bg-white p-8 rounded-2xl border-2 border-dashed border-[#2563EB]/40 hover:border-[#2563EB] cursor-pointer text-center space-y-3 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[36px] text-[#2563EB]">cloud_upload</span>
              <div>
                <p className="font-bold text-xs text-[#111827]">ছবি টেনে আনুন বা ক্লিক করুন</p>
                <span className="text-[10px] text-[#6B7280] block mt-1">📸 ক্যামেরা দিয়ে তুলুন (মোবাইল)</span>
              </div>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
                  <span>আপলোডকৃত ছবিসমূহ ({toBengaliDigits(photos.length)}টি)</span>
                  <span className={photos.length >= 4 ? 'text-green-600' : 'text-orange-500'}>
                    {toBengaliDigits(photos.length)}/৪ ন্যূনতম ছবি আপলোড করা হয়েছে
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {photos.map((url, idx) => {
                    const isPrimary = idx === primaryPhotoIdx;
                    return (
                      <div key={idx} className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={url} alt="Upload Thumbnail" className="w-full h-full object-cover" />
                        
                        {/* Primary Badge toggle */}
                        <button 
                          onClick={() => setPrimaryPhotoIdx(idx)}
                          className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            isPrimary ? 'bg-amber-500 text-white shadow-sm' : 'bg-black/60 text-gray-300 hover:bg-black/80'
                          }`}
                        >
                          {isPrimary ? '★ Primary' : 'Set Primary'}
                        </button>

                        {/* Remove button */}
                        <button 
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600/80 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Publish options */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Summary preview card */}
            <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex gap-4 items-center">
              <div className="w-20 h-15 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                <img src={photos[primaryPhotoIdx] || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1'} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#111827] truncate">{make} {model} {year}</h4>
                <p className="text-xs text-[#16A34A] font-bold">{formatBDT(askingPrice)}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold border border-opacity-40 mt-1 ${imvRating.color}`}>
                  {imvRating.label}
                </span>
              </div>
            </div>

            {/* Description card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#111827]">Marketplace-এ প্রকাশ করুন</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={publishMarketplace} 
                    onChange={e => setPublishMarketplace(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">গাড়ির বিবরণ (Description)</label>
                <textarea 
                  placeholder="যেমন: ফ্রেশ কন্ডিশন, কোনো এক্সিডেন্ট হিস্ট্রি নেই..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none min-h-[100px]"
                />
              </div>

              {/* Feature Chips multi-select */}
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">গাড়ির বৈশিষ্ট্য</label>
                <div className="flex flex-wrap gap-2">
                  {['Air Conditioning', 'Airbags', 'Alloy Wheels', 'Reverse Camera', 'Push Start', 'Leather Seats', 'Sunroof', 'CNG Converted'].map((feat) => {
                    const isSelected = selectedFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => handleFeatureToggle(feat)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                          isSelected 
                            ? 'bg-blue-50 text-[#2563EB] border-[#2563EB]' 
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                        }`}
                      >
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Step Wizard Buttons */}
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200 shrink-0">
          {currentStep > 1 ? (
            <button 
              onClick={handlePrevStep}
              className="px-6 h-11 bg-white border border-[#E5E7EB] text-[#111827] rounded-lg font-bold hover:bg-gray-50 active:scale-95 transition-all text-xs shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              পেছনে
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button 
              onClick={handleNextStep}
              className="px-6 h-11 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md flex items-center gap-1 ml-auto"
            >
              সামনে যান
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button 
              onClick={handlePublishSubmit}
              disabled={photos.length < 4}
              className={`px-6 h-11 text-white rounded-lg font-bold transition-all text-xs shadow-md flex items-center gap-1 ml-auto ${
                photos.length < 4 ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-[#16A34A] hover:brightness-110 active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">publish</span>
              সেভ ও প্রকাশ করুন
            </button>
          )}
        </div>

      </main>
    </div>
  );
}
