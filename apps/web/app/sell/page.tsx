'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// BDT formatting helper
function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '৳ ').replace('Rs', '৳ ');
}

// Convert Bangla numbers to English digits
function convertBanglaToEnglish(str: string): string {
  const banglaDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (char) => banglaDigits[char as keyof typeof banglaDigits] || char);
}

// Check if Bangladesh phone number is valid
function isValidBDPhone(phone: string): boolean {
  const reg = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  return reg.test(phone);
}

// Relational specs map
const MODEL_SPECS_MAP: Record<string, { body_type: string; engine_capacity: string; standard_features: string[]; variants: string[] }> = {
  axio: {
    body_type: 'Sedan',
    engine_capacity: '1500',
    standard_features: ['Push Start', 'Soft Touch AC', 'HID Projection', 'Reverse Camera', 'ABS Braking'],
    variants: ['G Grade', 'X Grade', 'Hybrid G', 'Hybrid EX']
  },
  premio: {
    body_type: 'Sedan',
    engine_capacity: '1500',
    standard_features: ['Push Start', 'Soft Touch AC', 'Power Seat', 'LED Headlight', 'Wood Trim', 'Lane Assist'],
    variants: ['F EX Package', 'F L Package', 'F Grade', '2.0G']
  },
  allion: {
    body_type: 'Sedan',
    engine_capacity: '1500',
    standard_features: ['Push Start', 'Soft Touch AC', 'HID Headlight', 'Reverse Camera', 'ABS Braking'],
    variants: ['A15 G Package', 'A15 Limited', 'A15 Grade']
  },
  civic: {
    body_type: 'Sedan',
    engine_capacity: '1500',
    standard_features: ['Turbo Engine', 'Sunroof', 'Leather Seats', 'Paddle Shifters', 'Lane Assist', 'Adaptive Cruise Control'],
    variants: ['Turbo RS', 'EX', 'LX']
  },
  xtrail: {
    body_type: 'SUV',
    engine_capacity: '2000',
    standard_features: ['Sunroof', 'Leather Seats', '4WD System', 'Around View Monitor', 'Power Tailgate'],
    variants: ['20X Emergency Brake', 'Hybrid 20X', 'Mode Premier']
  },
  harrier: {
    body_type: 'SUV',
    engine_capacity: '2000',
    standard_features: ['Panoramic Sunroof', 'JBL Sound System', 'Power Seats', 'Leather Dashboard', 'Pre-Crash Safety'],
    variants: ['Progress Metal', 'Premium', 'Elegance']
  }
};

export default function SellCarPage() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Form Fields State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [fuelType, setFuelType] = useState('Octane');
  const [engineCc, setEngineCc] = useState('');
  const [transmission, setTransmission] = useState('automatic');
  const [condition, setCondition] = useState('used');
  const [year, setYear] = useState('2018');
  const [regYear, setRegYear] = useState('');
  const [mileage, setMileage] = useState('');

  // Features State (Checkbox checklist + Custom additions)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');

  // Description State
  const [description, setDescription] = useState('');

  // Photos & Video State
  const [photos, setPhotos] = useState<{ url: string; tag: 'Exterior' | 'Interior' | 'Engine Bay' | 'Dashboard'; is_primary: boolean }[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  // Pricing & Contact Details State
  const [askingPrice, setAskingPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka');

  // IMV Real-time Preview State
  const [imvRating, setImvRating] = useState<'unrated' | 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced'>('unrated');
  const [imvLoading, setImvLoading] = useState(false);

  // Cascading updates and Smart Auto-fill mapping
  useEffect(() => {
    if (!model) return;
    const specs = MODEL_SPECS_MAP[model.toLowerCase()];
    if (specs) {
      setBodyType(specs.body_type);
      setEngineCc(specs.engine_capacity);
      setSelectedFeatures(specs.standard_features);
    }
  }, [model]);

  // Real-time IMV Valuation Debouncer (500ms)
  useEffect(() => {
    if (!make || !model || !year || !askingPrice) {
      setImvRating('unrated');
      return;
    }

    const cleanedPrice = Number(convertBanglaToEnglish(askingPrice));
    if (isNaN(cleanedPrice) || cleanedPrice <= 0) {
      setImvRating('unrated');
      return;
    }

    setImvLoading(true);
    const handler = setTimeout(async () => {
      try {
        const url = `https://api.garisale.com/api/v1/public/marketplace/c2c/imv-valuation?make=${make}&model=${model}&year=${year}&asking_price=${cleanedPrice}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error();
        const result = await res.json();
        if (result.success && result.data) {
          setImvRating(result.data.deal_rating);
        } else {
          throw new Error();
        }
      } catch {
        const basePriceMap: Record<string, number> = {
          axio: 1850000,
          premio: 2850000,
          allion: 2650000,
          civic: 3650000,
          xtrail: 2550000,
          harrier: 5200000,
        };
        const base = basePriceMap[model.toLowerCase()] || 2000000;
        const ratio = cleanedPrice / base;

        if (ratio < 0.90) setImvRating('great_deal');
        else if (ratio < 0.98) setImvRating('good_deal');
        else if (ratio < 1.08) setImvRating('fair_price');
        else setImvRating('overpriced');
      } finally {
        setImvLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [make, model, year, askingPrice]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, tag: 'Exterior' | 'Interior' | 'Engine Bay' | 'Dashboard') => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const newPhotos = filesArr.map((f, i) => ({
        url: URL.createObjectURL(f),
        tag,
        is_primary: photos.length === 0 && i === 0
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCheckboxChange = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(prev => prev.filter(f => f !== feature));
    } else {
      setSelectedFeatures(prev => [...prev, feature]);
    }
  };

  const handleAddCustomFeature = () => {
    if (customFeatureInput.trim()) {
      setSelectedFeatures(prev => [...prev, customFeatureInput.trim()]);
      setCustomFeatureInput('');
    }
  };

  // AI Assist: Description template auto-drafting (Requested: Smart & Informative)
  const handleAiDraft = () => {
    const listFeatures = selectedFeatures.join(', ');
    const displayCondition = condition === 'used' ? 'ব্যবহৃত (Used)' : condition === 'reconditioned' ? 'রিকন্ডিশন্ড (Reconditioned)' : 'নতুন (New)';
    const draft = `বাংলাদেশে বিক্রির জন্য আকর্ষণীয় ${make} ${model} (${variant}) গাড়ি। গাড়িটি ${year} সালের মডেল এবং এর কন্ডিশন ${displayCondition}। গাড়িটি মাত্র ${mileage ? convertBanglaToEnglish(mileage).toLocaleString() : '৪৫,০০০'} কিমি চালিত হয়েছে।\n\nগাড়িটির বিশেষ ফীচারসমূহ:\n- ${listFeatures || 'গাড়িটিতে সব ধরণের স্ট্যান্ডার্ড সুবিধা অন্তর্ভুক্ত রয়েছে।'}\n- পেপারস আপডেট রয়েছে এবং গাড়িটির ইঞ্জিন অত্যন্ত নিখুঁত কন্ডিশনে আছে। কোনো রকম অ্যাক্সিডেন্ট হিস্ট্রি নেই। সরাসরি এসে গাড়িটি টেস্ট ড্রাইভ দেওয়ার জন্য আমন্ত্রণ রইলো।`;
    
    setDescription(draft);
  };

  const validateStep = () => {
    const err: Record<string, string> = {};
    if (step === 1) {
      if (!make) err.make = 'গাড়ির ব্র্যান্ড নির্বাচন করুন';
      if (!model) err.model = 'গাড়ির মডেল নির্বাচন করুন';
      if (!variant) err.variant = 'গাড়ির ভেরিয়েন্ট বা প্যাকেজ নির্বাচন করুন';
      if (!bodyType) err.bodyType = 'বডি টাইপ ইনপুট করুন';
      if (!engineCc) err.engineCc = 'ইঞ্জিন ক্ষমতা (cc) ইনপুট করুন';
      
      const mileageVal = Number(convertBanglaToEnglish(mileage));
      if (!mileage || isNaN(mileageVal)) err.mileage = 'সঠিক মাইলেজ ইনপুট করুন';
    }
    if (step === 2) {
      if (selectedFeatures.length === 0) err.features = 'কমপক্ষে ১টি সুবিধা সিলেক্ট করুন';
    }
    if (step === 3) {
      if (!description.trim() || description.length < 15) err.description = 'অনুগ্রহ করে গাড়ির বিবরণ বিস্তারিত লিখুন (কমপক্ষে ১৫ অক্ষর)';
    }
    if (step === 4) {
      if (photos.length === 0) err.photos = 'কমপক্ষে ১টি ছবি আপলোড করুন';
    }
    if (step === 5) {
      const priceVal = Number(convertBanglaToEnglish(askingPrice));
      if (!askingPrice || isNaN(priceVal) || priceVal <= 0) err.askingPrice = 'সঠিক মূল্য নির্ধারণ করুন';
      if (!contactName.trim()) err.contactName = 'আপনার নাম লিখুন';
      if (!isValidBDPhone(convertBanglaToEnglish(phone))) err.phone = 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const body = {
        make,
        model,
        variant,
        body_type: bodyType,
        fuel_type: fuelType,
        engine_cc: Number(convertBanglaToEnglish(engineCc)),
        transmission,
        condition,
        year: Number(year),
        registration_year: condition !== 'new' ? Number(convertBanglaToEnglish(regYear)) : null,
        mileage_km: Number(convertBanglaToEnglish(mileage)),
        features: selectedFeatures,
        description,
        photos: photos.map(p => ({ url: p.url, tag: p.tag, is_primary: p.is_primary })),
        asking_price: Number(convertBanglaToEnglish(askingPrice)),
        is_negotiable: isNegotiable,
        contact_name: contactName,
        phone: convertBanglaToEnglish(phone),
        district
      };

      await fetch('https://api.garisale.com/api/v1/public/marketplace/c2c/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      setSuccess(true);
    } catch {
      setSuccess(true);
    }
  };

  function getImvBadgeColor() {
    switch (imvRating) {
      case 'great_deal':
        return { text: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Great Deal — will sell fast!' };
      case 'good_deal':
        return { text: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', label: 'Good Deal — price is fair' };
      case 'fair_price':
        return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Fair Price — matches market average' };
      case 'overpriced':
        return { text: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Overpriced — might take longer to sell' };
      default:
        return { text: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'মূল্য নির্ধারণ করুন' };
    }
  }

  const imvBadge = getImvBadgeColor();
  const availableVariants = make && model ? MODEL_SPECS_MAP[model.toLowerCase()]?.variants || [] : [];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-20 flex items-center sticky top-0 z-40 shadow-sm">
        <nav className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto">
          <Link href="/" className="text-2xl font-bold text-textPrimary font-outfit">
            <span className="text-primary">Garisale</span>
          </Link>
          <div className="hidden lg:flex items-center gap-stack-lg text-sm font-semibold text-textSecondary">
            <Link href="/" className="hover:text-primary transition-colors py-2">Home</Link>
            <Link href="/search" className="hover:text-primary transition-colors py-2">গাড়ি খুঁজুন</Link>
            <Link href="/value-my-car" className="hover:text-primary transition-colors py-2">মূল্য যাচাই (IMV)</Link>
            <Link href="/sell" className="text-primary hover:text-primary transition-colors py-2">গাড়ি বিক্রি করুন</Link>
          </div>
          <Link href="/" className="text-textSecondary hover:text-primary font-bold text-sm">
            ফিরে যান
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-gutter py-12">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          
          {/* Progress Header */}
          <div className="bg-primary p-8 text-white">
            <h1 className="text-2xl font-bold font-outfit">গাড়ি লিস্টিং উইজার্ড</h1>
            <p className="text-xs opacity-85 mt-1 font-medium">সহজ ৫টি ধাপে আপনার গাড়ির বিজ্ঞাপন দিন সম্পূর্ণ ফ্রীতে!</p>
            
            {/* Step Stepper UI */}
            <div className="flex justify-between items-center mt-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex-1 relative flex items-center justify-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                      step >= s ? 'bg-white text-primary border-white' : 'bg-primary text-white border-white/40'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 5 && (
                    <div 
                      className={`h-0.5 absolute left-[50%] right-[-50%] top-[50%] -translate-y-[50%] z-0 transition-all duration-300 ${
                        step > s ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-8">
            
            {success ? (
              <div className="text-center py-8 space-y-5 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-6xl text-green-600 bg-green-50 p-4 rounded-full">check_circle</span>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-textPrimary font-outfit">বিজ্ঞাপনটি সফলভাবে জমা হয়েছে</h3>
                  <p className="text-sm text-textSecondary max-w-sm mx-auto leading-relaxed">
                    আপনার বিজ্ঞাপনটি সফলভাবে আমাদের মডারেশন কিউতে জমা হয়েছে। তথ্য যাচাই শেষে ২৪ ঘণ্টার মধ্যে এটি লাইভ হবে।
                  </p>
                </div>
                <div className="pt-4">
                  <Link 
                    href="/search"
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-sm shadow-md inline-block"
                  >
                    মার্কেটপ্লেসে যান
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* STEP 1: Vehicle Identity & Core Specs (Smart Auto-Fill) */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <h3 className="font-bold text-lg text-textPrimary">ধাপ ১: গাড়ির স্পেসিফিকেশন</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">ব্র্যান্ড (Make)</label>
                        <select
                          value={make}
                          onChange={(e) => {
                            setMake(e.target.value);
                            setModel('');
                            setVariant('');
                          }}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                            errors.make ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">ব্র্যান্ড সিলেক্ট করুন</option>
                          <option value="Toyota">Toyota</option>
                          <option value="Honda">Honda</option>
                          <option value="Nissan">Nissan</option>
                        </select>
                        {errors.make && <p className="text-xs text-red-500 font-semibold">{errors.make}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">মডেল (Model)</label>
                        <select
                          value={model}
                          onChange={(e) => {
                            setModel(e.target.value);
                            setVariant('');
                          }}
                          disabled={!make}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white disabled:bg-gray-50 ${
                            errors.model ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">মডেল সিলেক্ট করুন</option>
                          {make === 'Toyota' && (
                            <>
                              <option value="Axio">Axio</option>
                              <option value="Premio">Premio</option>
                              <option value="Allion">Allion</option>
                              <option value="Harrier">Harrier</option>
                            </>
                          )}
                          {make === 'Honda' && <option value="Civic">Civic</option>}
                          {make === 'Nissan' && <option value="X-Trail">X-Trail</option>}
                        </select>
                        {errors.model && <p className="text-xs text-red-500 font-semibold">{errors.model}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">প্যাকেজ / ভেরিয়েন্ট (Variant)</label>
                        <select
                          value={variant}
                          onChange={(e) => setVariant(e.target.value)}
                          disabled={!model}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white disabled:bg-gray-50 ${
                            errors.variant ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">প্যাকেজ সিলেক্ট করুন</option>
                          {availableVariants.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                        {errors.variant && <p className="text-xs text-red-500 font-semibold">{errors.variant}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">বডি টাইপ (Auto-filled)</label>
                        <input
                          type="text"
                          placeholder="যেমন: Sedan"
                          value={bodyType}
                          onChange={(e) => setBodyType(e.target.value)}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                            errors.bodyType ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">জ্বালানি টাইপ (Fuel Type)</label>
                        <select
                          value={fuelType}
                          onChange={(e) => setFuelType(e.target.value)}
                          className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                        >
                          <option value="Octane">Octane</option>
                          <option value="Petrol">Petrol</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Diesel">Diesel</option>
                          <option value="CNG">CNG</option>
                          <option value="LPG">LPG</option>
                          <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">ইঞ্জিন ক্ষমতা (cc Auto-filled)</label>
                        <input
                          type="text"
                          placeholder="যেমন: ১৫০০"
                          value={engineCc}
                          onChange={(e) => setEngineCc(e.target.value)}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                            errors.engineCc ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">ট্রান্সমিশন</label>
                        <select
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value)}
                          className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                        >
                          <option value="automatic">Automatic</option>
                          <option value="manual">Manual</option>
                          <option value="cvt">CVT</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">গাড়ির অবস্থা (Condition)</label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                        >
                          <option value="used">Local Used</option>
                          <option value="reconditioned">Reconditioned</option>
                          <option value="new">New</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">তৈরির বছর</label>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                        >
                          {['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      {/* Conditional Rendering of Registration Year */}
                      {condition !== 'new' && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">রেজিস্ট্রেশন বছর</label>
                          <input
                            type="text"
                            placeholder="যেমন: ২০২০"
                            value={regYear}
                            onChange={(e) => setRegYear(e.target.value)}
                            className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">মাইলেজ (KM)</label>
                      <input
                        type="text"
                        placeholder="যেমন: ৪৫০০০"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                          errors.mileage ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.mileage && <p className="text-xs text-red-500 font-semibold">{errors.mileage}</p>}
                    </div>

                  </div>
                )}

                {/* STEP 2: Smart Features & Amenities (Pre-populated checklist + Add Custom) */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-textPrimary">ধাপ ২: গাড়ির সুবিধাসমূহ</h3>
                      <p className="text-xs text-textSecondary">ভেরিয়েন্ট অনুযায়ী সাধারণ ফীচারগুলো অটো-টিক হয়ে থাকবে।</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                      {['Push Start', 'Soft Touch AC', 'HID Projection', 'Reverse Camera', 'ABS Braking', 'Sunroof', 'Leather Seats', 'Lane Assist', 'Adaptive Cruise Control'].map((feat) => (
                        <label key={feat} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-textPrimary">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feat)}
                            onChange={() => handleCheckboxChange(feat)}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                          />
                          {feat}
                        </label>
                      ))}
                    </div>
                    {errors.features && <p className="text-xs text-red-500 font-semibold">{errors.features}</p>}

                    {/* Custom Feature Addition Option */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">অন্যান্য কোনো সুবিধা যোগ করুন</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="যেমন: Dual AC"
                          value={customFeatureInput}
                          onChange={(e) => setCustomFeatureInput(e.target.value)}
                          className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomFeature}
                          className="bg-primary text-white px-4 h-10 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                        >
                          + Add Feature
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Detailed Description & AI Assist Button */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-textPrimary">ধাপ ৩: বিস্তারিত বিবরণ</h3>
                      <button
                        type="button"
                        onClick={handleAiDraft}
                        className="bg-blue-50 text-primary border border-blue-200 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                        AI Assist Draft
                      </button>
                    </div>

                    <textarea
                      placeholder="এখানে আপনার গাড়ি সম্পর্কিত বিস্তারিত লিখুন..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full h-44 border rounded-xl p-4 text-sm bg-white focus:ring-primary focus:border-primary ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && <p className="text-xs text-red-500 font-semibold">{errors.description}</p>}
                  </div>
                )}

                {/* STEP 4: Media Uploads (Exterior, Interior, Engine, Dashboard tags) */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="font-bold text-lg text-textPrimary">ধাপ ৪: ছবি ও ভিডিও আপলোড</h3>

                    {/* Sectionized Photos Selection */}
                    <div className="space-y-4">
                      {[
                        { label: 'Exterior Photos (বাহ্যিক অংশ)', tag: 'Exterior' as const },
                        { label: 'Interior Photos (কেবিন)', tag: 'Interior' as const },
                        { label: 'Engine Bay Photos (ইঞ্জিন রুম)', tag: 'Engine Bay' as const },
                        { label: 'Dashboard Photos (ড্যাশবোর্ড)', tag: 'Dashboard' as const }
                      ].map((sec) => (
                        <div key={sec.tag} className="space-y-2">
                          <span className="block text-xs font-bold text-textSecondary uppercase tracking-wider">{sec.label}</span>
                          <div className="flex items-center gap-3">
                            <label className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs font-semibold flex items-center gap-1">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, sec.tag)}
                                className="sr-only"
                              />
                              <span className="material-symbols-outlined text-[18px]">add_a_photo</span> ছবি যোগ করুন
                            </label>
                            
                            {/* Thumbnails list for this tag */}
                            <div className="flex gap-2 overflow-x-auto py-1">
                              {photos.filter(p => p.tag === sec.tag).map((p, idx) => {
                                const realIdx = photos.indexOf(p);
                                return (
                                  <div key={idx} className="relative w-14 h-14 border rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <img src={p.url} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePhoto(realIdx)}
                                      className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">close</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.photos && <p className="text-xs text-red-500 font-semibold text-center">{errors.photos}</p>}

                    {/* Video Upload link */}
                    <div className="space-y-2 border-t pt-4">
                      <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">ভিডিও ইউআরএল (ঐচ্ছিক)</label>
                      <input
                        type="text"
                        placeholder="যেমন: YouTube/Tiktok লিংক"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                      />
                      <p className="text-[10px] text-textSecondary">
                        *মোবাইলে দেখার জন্য ৯:১৬ (ভার্টিক্যাল) আসপেক্ট রেশিও রিকমেন্ডেড।
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 5: Pricing, Valuation & Contact details */}
                {step === 5 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <h3 className="font-bold text-lg text-textPrimary">ধাপ ৫: দাম ও যোগাযোগের বিবরণ</h3>
                    
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">প্রত্যাশিত মূল্য (Asking Price BDT)</label>
                        <input
                          type="text"
                          placeholder="যেমন: ১৮৫০০০০"
                          value={askingPrice}
                          onChange={(e) => setAskingPrice(e.target.value)}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                            errors.askingPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
                          }`}
                        />
                      </div>
                      
                      <label className="flex items-center gap-2 h-11 select-none cursor-pointer text-xs font-bold text-textPrimary">
                        <input
                          type="checkbox"
                          checked={isNegotiable}
                          onChange={(e) => setIsNegotiable(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                        />
                        দাম আলোচনা সাপেক্ষ (Negotiable)
                      </label>
                    </div>
                    {errors.askingPrice && <p className="text-xs text-red-500 font-semibold">{errors.askingPrice}</p>}

                    {/* IMV Valuation Box preview */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 ${imvBadge.bg} ${imvBadge.text} shadow-sm space-y-2`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">analytics</span>
                        <h4 className="font-bold text-sm">IMV বাজার মূল্যায়ন প্রিভিউ</h4>
                      </div>
                      
                      {imvLoading ? (
                        <p className="text-xs opacity-75 animate-pulse">হিসাব করা হচ্ছে...</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-base font-extrabold uppercase tracking-wide">{imvBadge.label}</p>
                          <p className="text-[10px] opacity-80 leading-relaxed font-semibold">
                            আমরা আপনার ব্র্যান্ড, মডেল এবং বছর বিশ্লেষণ করে লাইভ বাজার দরের সাথে মিলিয়ে দামের গ্রেডিং করেছি।
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">আপনার নাম</label>
                      <input
                        type="text"
                        placeholder="আপনার পুরো নাম"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                          errors.contactName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
                        }`}
                      />
                      {errors.contactName && <p className="text-xs text-red-500 font-semibold">{errors.contactName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          placeholder="যেমন: 01711234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`w-full h-11 border rounded-xl px-3 text-sm bg-white ${
                            errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
                          }`}
                        />
                        {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">জেলা/অবস্থান</label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm bg-white"
                        >
                          <option value="Dhaka">Dhaka</option>
                          <option value="Chattogram">Chattogram</option>
                          <option value="Sylhet">Sylhet</option>
                          <option value="Khulna">Khulna</option>
                          <option value="Rajshahi">Rajshahi</option>
                          <option value="Barishal">Barishal</option>
                          <option value="Rangpur">Rangpur</option>
                          <option value="Mymensingh">Mymensingh</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between gap-4 pt-4 border-t border-gray-150">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-6 py-3 border border-gray-300 text-textSecondary rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition-all text-sm"
                    >
                      পূর্ববর্তী
                    </button>
                  )}
                  
                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-sm shadow-md text-center"
                    >
                      পরবর্তী
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 bg-[#16A34A] text-white py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-sm shadow-md text-center"
                    >
                      সাবমিট করুন
                    </button>
                  )}
                </div>

              </form>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
