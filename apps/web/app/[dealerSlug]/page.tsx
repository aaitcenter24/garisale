'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

interface Vehicle {
  id: string;
  name: string;
  year: number;
  mileage: number;
  price: number;
  imvRating: 'Great Deal' | 'Good Deal' | 'Fair Price' | 'Overpriced';
  image: string;
}

export default function DealerMicrositePage({ params }: { params: { dealerSlug: string } }) {
  // Decode dealer slug for display
  const rawSlug = params.dealerSlug || 'dhaka-premium-motors';
  const dealerName = rawSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Customizable state presets from Website Builder
  const [themeColor, setThemeColor] = useState('#2563EB'); // blue-600 default
  const [selectedFont, setSelectedFont] = useState('font-sans');
  const [whatsappNumber, setWhatsappNumber] = useState('01812345678');

  // Specific dealer inventory mock
  const [inventory] = useState<Vehicle[]>([
    { id: '1', name: 'Toyota Axio Hybrid 2019', year: 2019, mileage: 45000, price: 1450000, imvRating: 'Great Deal', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
    { id: '2', name: 'Honda Fit F-Package 2018', year: 2018, mileage: 60000, price: 1280000, imvRating: 'Good Deal', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
    { id: '3', name: 'Toyota Premio F 2017', year: 2017, mileage: 52000, price: 2350000, imvRating: 'Fair Price', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredInventory = inventory.filter(car => 
    car.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-[#F9FAFB] flex flex-col ${selectedFont}`}>
      
      {/* Dynamic Header */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div 
            style={{ backgroundColor: themeColor }}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm"
          >
            {dealerName.charAt(0)}
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#111827] block">{dealerName}</span>
            <span className="text-[9px] text-gray-500 font-bold block">ভেরিফাইড গাড়িসেল পার্টনার</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <a href={`tel:${whatsappNumber}`} className="text-gray-600 hover:text-black hidden sm:inline">
            📞 {toBengaliDigits(whatsappNumber)}
          </a>
          <Link 
            href="/sell" 
            style={{ backgroundColor: themeColor }}
            className="text-white px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            এক্সচেঞ্জ অফার
          </Link>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 md:py-20 px-6 text-center space-y-6 relative overflow-hidden">
        {/* Visual background overlay patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <span className="bg-white/10 text-white text-[9px] font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wider">
            স্বাগতম আমাদের শোরুমে
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {dealerName}-এ আপনার পছন্দের গাড়িটি খুঁজুন
          </h1>
          <p className="text-xs text-slate-300 font-semibold max-w-lg mx-auto leading-relaxed">
            আমরা দিচ্ছি ১০০% আসল মাইলেজ, স্বচ্ছ গাড়ি রিকনস্ট্রাকশন রিপোর্ট এবং মার্কেট সেরা মূল্যের নিশ্চয়তা।
          </p>
        </div>

        {/* Local Search input */}
        <div className="max-w-md mx-auto bg-white p-2 rounded-2xl shadow-lg flex items-center relative z-10">
          <span className="material-symbols-outlined text-gray-400 pl-2">search</span>
          <input
            type="text"
            placeholder="শোরুমের ইনভেন্টরি থেকে খুঁজুন (যেমন: Axio)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 px-2 text-xs font-bold text-[#111827] focus:outline-none"
          />
        </div>
      </section>

      {/* Main Stock Inventory grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 space-y-8">
        
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="font-extrabold text-sm md:text-base text-[#111827] uppercase tracking-wider">চলতি স্টক ইনভেন্টরি</h2>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">শোরুমে সরাসরি টেস্ট ড্রাইভের জন্য প্রস্তুত গাড়িগুলো</p>
          </div>
          <span className="text-[10px] text-[#2563EB] font-bold">{toBengaliDigits(filteredInventory.length)}টি গাড়ি পাওয়া গেছে</span>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map(car => (
            <div key={car.id} className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              
              {/* Image & IMV tag */}
              <div className="h-44 bg-gray-100 relative">
                <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                <span className={`absolute top-3 left-3 text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                  car.imvRating === 'Great Deal'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : car.imvRating === 'Good Deal'
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {car.imvRating === 'Great Deal' ? 'Great Price' : car.imvRating === 'Good Deal' ? 'Good Price' : 'Fair Price'}
                </span>
              </div>

              {/* Info details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-[#111827] leading-tight truncate">{car.name}</h4>
                  <span className="text-[10px] text-gray-500 font-semibold block">
                    বছর: {toBengaliDigits(car.year)} · মাইলেজ: {toBengaliDigits(car.mileage.toLocaleString())} কি.মি.
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">মূল্য</span>
                    <span className="text-xs font-extrabold text-[#2563EB] font-sans">BDT {toBengaliDigits(car.price.toLocaleString())}</span>
                  </div>
                  
                  {/* Redirects to dynamic details path inside subdomain */}
                  <Link 
                    href={`/${rawSlug}/cars/${car.id}`}
                    style={{ borderColor: themeColor, color: themeColor }}
                    className="border px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-all"
                  >
                    বিস্তারিত দেখুন
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* About Dealership info section */}
        <section className="bg-white border rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-sm">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111827]">আমাদের শোরুম সম্পর্কে</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              আমরা দীর্ঘদিন ধরে সততার সাথে জাপানি আমদানিকৃত রিকন্ডিশন ও ব্যবহৃত প্রিমিয়াম গাড়ি সরবরাহ করে আসছি। আমাদের প্রতিটি গাড়িতে পাচ্ছেন শোরুম ভেরিফিকেশন সনদ এবং ১ বছরের মেকানিক্যাল ইঞ্জিন ওয়ারেন্টি।
            </p>
            <div className="space-y-2 text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-gray-400">schedule</span>
                <span>শনি - বৃহস্পতি: সকাল ৯:০০ - সন্ধ্যা ৭:০০ (শুক্রবার বন্ধ)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-gray-400">location_on</span>
                <span>তেজগাঁও শিল্প এলাকা, গুলশান লিংক রোড, ঢাকা</span>
              </div>
            </div>
          </div>
          
          {/* Static Map Image Placeholder */}
          <div className="h-48 bg-slate-100 border rounded-2xl overflow-hidden relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-50/20" />
            <div className="z-10 text-center space-y-1">
              <span className="material-symbols-outlined text-red-600 text-3xl">location_on</span>
              <span className="block text-[10px] font-extrabold text-[#111827]">Dhaka Showroom MAP</span>
              <span className="block text-[8px] text-gray-400">গুগল ম্যাপস ভিউ (Google Maps integration pending)</span>
            </div>
          </div>
        </section>

      </main>

      {/* Floating WhatsApp FAB */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all z-50"
      >
        <span className="material-symbols-outlined text-[24px]">chat</span>
      </a>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-[10px] border-t border-slate-800">
        <p className="font-semibold">&copy; ২০২৬ {dealerName}. অল রাইটস রিজার্ভড। পাওয়ার্ড বাই গাড়িসেল প্ল্যাটফর্ম।</p>
      </footer>

    </div>
  );
}
