'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper to convert Bengali digits to English digits
function convertBengaliToEnglishDigits(str: string): string {
  const bnToEng: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.split('').map(char => bnToEng[char] || char).join('');
}

export default function DealerLoginPage() {
  const router = useRouter();

  // Navigation tab: 'otp' or 'password'
  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');

  // Form Fields
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // OTP State Flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // 2FA / TOTP Registration State Flow
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [setupTotpCode, setSetupTotpCode] = useState('');
  const [is2faEnabled, setIs2faEnabled] = useState(false);

  // Status Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Resend Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedPhone = convertBengaliToEnglishDigits(phone);
    if (!sanitizedPhone.match(/^01[3-9]\d{8}$/)) {
      setErrorMsg('সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }
    setErrorMsg(null);
    setOtpSent(true);
    setOtpTimer(60);
    setSuccessMsg('আপনার মোবাইলে ৪ ডিজিটের ওটিপি কোড পাঠানো হয়েছে!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedOtp = convertBengaliToEnglishDigits(otpCode);
    if (sanitizedOtp === '1234' || sanitizedOtp.length === 4) {
      setSuccessMsg('ওটিপি সফলভাবে যাচাই করা হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setErrorMsg('ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন (ডিফল্ট: 1234)');
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('ইমেল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }
    // If 2FA is registered, check TOTP
    if (is2faEnabled && !totpCode) {
      setErrorMsg('দয়া করে গুগল অথেন্টিকেটর অ্যাপের ৬ ডিজিটের কোডটি দিন।');
      return;
    }
    
    setErrorMsg(null);
    setSuccessMsg('লগইন সফল হয়েছে! ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে...');
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  const handleVerify2faSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedCode = convertBengaliToEnglishDigits(setupTotpCode);
    if (setupTotpCode.length === 6) {
      setIs2faEnabled(true);
      setShow2faSetup(false);
      setSetupTotpCode('');
      setSuccessMsg('অভিনন্দন! আপনার গুগল ২-ফ্যাক্টর অথেন্টিকেশন (2FA) চালু হয়েছে।');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('ভুল অথেন্টিকেটর কোড! ৬ ডিজিটের সঠিক কোডটি দিন।');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-14 h-14 bg-[#2563EB] rounded-2xl flex items-center justify-center font-bold text-2xl font-outfit text-white shadow-md mx-auto">
          G
        </div>
        <h2 className="text-2xl font-extrabold text-[#111827] font-outfit">গাড়িসেল ডিলার লগইন</h2>
        <p className="text-xs text-[#6B7280] font-bold">Garisale Dealer OS - শোরুম অটোমেশন ও ডিল ওনারশিপ</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5E7EB] shadow-lg p-6 space-y-6">
        
        {/* Alerts Banner */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-green-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Mode Tabs */}
        {!show2faSetup && (
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => { setActiveTab('otp'); setErrorMsg(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'otp' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              মোবাইল ওটিপি (OTP)
            </button>
            <button
              onClick={() => { setActiveTab('password'); setErrorMsg(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'password' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              পাসওয়ার্ড লগইন
            </button>
          </div>
        )}

        {/* Tab 1: OTP Login Flow */}
        {activeTab === 'otp' && !show2faSetup && (
          <div className="space-y-4">
            {!otpSent ? (
              // Phase A: Send OTP Form
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">আপনার মোবাইল নম্বর</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 017XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(convertBengaliToEnglishDigits(e.target.value))}
                    className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md"
                >
                  ওটিপি পাঠান (Send OTP)
                </button>
              </form>
            ) : (
              // Phase B: Verify OTP Form
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">মোবাইলে প্রেরিত ওটিপি কোড</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="৪ ডিজিট কোড (ডিফল্ট: 1234)"
                    value={otpCode}
                    onChange={e => setOtpCode(convertBengaliToEnglishDigits(e.target.value))}
                    className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 text-xs font-semibold text-center tracking-widest focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md"
                >
                  যাচাই করুন ও প্রবেশ করুন
                </button>

                <div className="flex justify-between items-center text-[10px] font-bold pt-2">
                  <span className="text-gray-500">কোড পাননি?</span>
                  {otpTimer > 0 ? (
                    <span className="text-gray-400">{otpTimer} সেকেন্ড অপেক্ষা করুন</span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      className="text-[#2563EB] hover:underline"
                    >
                      আবার ওটিপি পাঠান
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Password Login Flow */}
        {activeTab === 'password' && !show2faSetup && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">শোরুম ইমেইল বা আইডি</label>
              <input
                type="text"
                required
                placeholder="যেমন: dealer@garisale.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Render 2FA Field only if enabled */}
            {is2faEnabled && (
              <div className="space-y-1.5 bg-blue-50/30 p-3 rounded-xl border border-blue-100 animate-in slide-in-from-top-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] block">গুগল অথেন্টিকেটর কোড (2FA)</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="৬ ডিজিটের ওটিপি কোড"
                  value={totpCode}
                  onChange={e => setTotpCode(convertBengaliToEnglishDigits(e.target.value))}
                  className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-4 text-xs font-semibold text-center tracking-widest focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md"
            >
              প্রবেশ করুন
            </button>
            
            {/* Quick Link to enable/test 2FA Setup */}
            {!is2faEnabled && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setShow2faSetup(true); setErrorMsg(null); }}
                  className="text-[10px] text-[#2563EB] font-bold hover:underline"
                >
                  🔒 গুগল ২-ফ্যাক্টর অথেন্টিকেশন (2FA) চালু করুন
                </button>
              </div>
            )}
          </form>
        )}

        {/* Tab 3: Initial TOTP / 2FA Setup Step */}
        {show2faSetup && (
          <form onSubmit={handleVerify2faSetup} className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-extrabold text-[#111827]">২-ফ্যাক্টর অথেন্টিকেশন (2FA) সেটআপ</span>
              <button 
                type="button" 
                onClick={() => setShow2faSetup(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-[10px] text-[#6B7280] font-semibold leading-relaxed">
              আপনার একাউন্টের বাড়তি নিরাপত্তার জন্য Google Authenticator বা Microsoft Authenticator অ্যাপ দিয়ে নিচের QR কোডটি স্ক্যান করুন।
            </p>

            {/* Simulated QR Code */}
            <div className="bg-gray-50 border p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 max-w-[200px] mx-auto">
              <div className="w-32 h-32 bg-white border p-2 flex items-center justify-center relative">
                {/* Visual mock QR square pattern */}
                <div className="absolute inset-2 border-2 border-black flex flex-wrap justify-between p-1">
                  <div className="w-5 h-5 bg-black" />
                  <div className="w-5 h-5 bg-black" />
                  <div className="w-full flex justify-between">
                    <div className="w-3 h-3 bg-black mt-2" />
                    <div className="w-3 h-3 bg-black mt-2" />
                  </div>
                  <div className="w-5 h-5 bg-black" />
                  <div className="w-3 h-3 bg-gray-400" />
                </div>
              </div>
              <span className="text-[8px] font-mono text-gray-500 select-all font-bold">Secret: GARI7249174928</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">অথেন্টিকেটর অ্যাপের কোডটি দিন</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="যেমন: ১২৩৪৫৬"
                value={setupTotpCode}
                onChange={e => setSetupTotpCode(convertBengaliToEnglishDigits(e.target.value))}
                className="w-full h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 text-xs font-semibold text-center tracking-widest focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md"
            >
              কোড নিশ্চিত করুন ও সচল করুন
            </button>
          </form>
        )}

      </div>

      {/* Back to Home link */}
      <div className="text-center mt-6">
        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-[#2563EB] hover:underline flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          গাড়িসেল হোমপেজে ফিরে যান
        </Link>
      </div>

    </div>
  );
}
