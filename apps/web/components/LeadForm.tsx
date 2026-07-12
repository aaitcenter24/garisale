'use client';

import React, { useState } from 'react';

interface LeadFormProps {
  listingId: string;
  dealershipId?: string;
  listingTitle: string;
}

// Convert Bangla digits (০-৯) to English digits (0-9)
function convertBanglaToEnglish(str: string): string {
  const banglaDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (char) => banglaDigits[char as keyof typeof banglaDigits] || char);
}

export default function LeadForm({ listingId, dealershipId, listingTitle }: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(`আমি এই গাড়িটি (${listingTitle}) সম্পর্কে জানতে আগ্রহী। অনুগ্রহ করে যোগাযোগ করুন।`);
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertBanglaToEnglish(e.target.value);
    setPhone(converted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setStatus('error');
      setErrorMessage('নাম এবং মোবাইল নম্বর দেওয়া আবশ্যক।');
      return;
    }

    // BD Phone Format Validation (01XXXXXXXXX)
    const cleanPhone = phone.replace(/[-\s]/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setStatus('error');
      setErrorMessage('সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)।');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('https://api.garisale.com/api/v1/public/marketplace/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          message: message.trim(),
          listing_id: listingId,
          dealership_id: dealershipId || null,
        }),
      });

      if (!res.ok) {
        throw new Error('অনুরোধ ব্যর্থ হয়েছে');
      }

      setStatus('success');
      setName('');
      setPhone('');
    } catch (err) {
      console.error('Error submitting lead:', err);
      setStatus('error');
      setErrorMessage('যোগাযোগের অনুরোধ পাঠানো সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  return (
    <section className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-xl font-bold text-textPrimary">ডিলারের সাথে যোগাযোগ করুন</h3>
      <p className="text-xs text-textSecondary">
        নিচের ফর্মটি পূরণ করে আপনার অনুসন্ধানের বিবরণ পাঠান।
      </p>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm font-semibold">
          ধন্যবাদ! আপনার যোগাযোগের অনুরোধটি সফলভাবে পাঠানো হয়েছে। ডিলার প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textSecondary">আপনার নাম</label>
              <input
                type="text"
                placeholder="যেমন: রফিক হোসেন"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === 'submitting'}
                className="w-full h-12 border border-gray-300 rounded-lg px-3 text-sm focus:ring-primary focus:border-primary bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textSecondary">মোবাইল নম্বর</label>
              <input
                type="text"
                placeholder="যেমন: ০১৭১২৩৪৫৬৭৮"
                value={phone}
                onChange={handlePhoneChange}
                disabled={status === 'submitting'}
                className="w-full h-12 border border-gray-300 rounded-lg px-3 text-sm focus:ring-primary focus:border-primary bg-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-textSecondary">বার্তা</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={status === 'submitting'}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary bg-white"
            />
          </div>

          {status === 'error' && (
            <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 p-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-primary hover:brightness-110 active:scale-95 text-white py-3.5 rounded-lg font-bold transition-all text-sm shadow-md"
          >
            {status === 'submitting' ? 'অনুরোধ পাঠানো হচ্ছে...' : 'মেসেজ পাঠান'}
          </button>
        </form>
      )}
    </section>
  );
}
