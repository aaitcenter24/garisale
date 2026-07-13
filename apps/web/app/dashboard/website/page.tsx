'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper to convert numbers to Bengali digits
function toBengaliDigits(num: number | string): string {
  const engToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).split('').map(char => engToBn[char] || char).join('');
}

interface CarListing {
  id: string;
  title: string;
  price: number;
  image: string;
  year: number;
  mileage: number;
  condition: string;
}

const MOCK_INVENTORY: CarListing[] = [
  { id: '1', title: 'Toyota Axio Hybrid 2019', price: 1450000, year: 2019, mileage: 45000, condition: 'Reconditioned', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '2', title: 'Honda Fit F-Package 2018', price: 1280000, year: 2018, mileage: 52000, condition: 'Used', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '3', title: 'Toyota Premio F 2017', price: 2350000, year: 2017, mileage: 38000, condition: 'Reconditioned', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '4', title: 'Nissan X-Trail Hybrid 2019', price: 2950000, year: 2019, mileage: 41000, condition: 'Used', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' }
];

export default function ShowroomWebsiteBuilder() {
  const router = useRouter();

  // Builder Core States
  const [selectedTheme, setSelectedTheme] = useState<'pro' | 'classic' | 'speed'>('pro');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('ঢাকা অটো হাউস');
  const [tagline, setTagline] = useState('বিশ্বস্ত গাড়ির বাজার');
  const [aboutUs, setAboutUs] = useState('আমাদের শোরুম বিগত ১০ বছর ধরে বিশ্বস্ততা এবং সুনামের সাথে রিকন্ডিশন ও ব্যবহৃত জাপানি গাড়ি আমদানি ও বিক্রয় করে আসছে।');
  
  // Customization presets
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [fontStyle, setFontStyle] = useState<'modern' | 'classic' | 'simple'>('modern');
  const [customColorActive, setCustomColorActive] = useState(false);

  // Contacts
  const [phone, setPhone] = useState('01711223344');
  const [whatsapp, setWhatsapp] = useState('01711223344');
  const [email, setEmail] = useState('info@dhakaautohouse.com');
  const [address, setAddress] = useState('ধোলাইখাল, ঢাকা');

  // Business Hours state
  const [hoursPreset, setHoursPreset] = useState<'preset1' | 'preset2' | 'custom'>('preset1');
  const [customHours, setCustomHours] = useState([
    { day: 'শনিবার', checked: true, open: '09:00 AM', close: '06:00 PM' },
    { day: 'রবিবার', checked: true, open: '09:00 AM', close: '06:00 PM' },
    { day: 'সোমবার', checked: true, open: '09:00 AM', close: '06:00 PM' },
    { day: 'মঙ্গলবার', checked: true, open: '09:00 AM', close: '06:00 PM' },
    { day: 'বুধবার', checked: true, open: '09:00 AM', close: '06:00 PM' },
    { day: 'বৃহস্পতিবার', checked: true, open: '09:00 AM', close: '06:00 PM' },
    { day: 'শুক্রবার', checked: false, open: '09:00 AM', close: '06:00 PM' }
  ]);

  // Collapsible Social media
  const [showSocials, setShowSocials] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState('https://facebook.com/dhakaautohouse');
  const [instagramHandle, setInstagramHandle] = useState('dhakaautohouse');
  const [youtubeUrl, setYoutubeUrl] = useState('https://youtube.com/c/dhakaautohouse');

  // Hero Section
  const [heroHeadline, setHeroHeadline] = useState('আমাদের শোরুমের বিশেষ গাড়ি সমূহ দেখুন');
  const [heroSubtitle, setHeroSubtitle] = useState('সেরা দামে এবং মানসম্মত রিকন্ডিশন গাড়ি আপনার হাতের মুঠোয়');
  const [heroBgType, setHeroBgType] = useState<'default' | 'upload' | 'color'>('default');
  const [heroCustomBgUrl, setHeroCustomBgUrl] = useState<string | null>(null);
  const [heroCtaText, setHeroCtaText] = useState('আমাদের গাড়ি দেখুন');

  // Page Content Settings
  const [featuredSectionTitle, setFeaturedSectionTitle] = useState('আমাদের বিশেষ গাড়িসমূহ');
  const [showAboutSection, setShowAboutSection] = useState(true);

  // SEO Settings
  const [showAdvancedSeo, setShowAdvancedSeo] = useState(false);
  const [seoPageTitle, setSeoPageTitle] = useState('ঢাকা অটো হাউস | গাড়ি কিনুন সেরা মূল্যে');
  const [seoMetaDesc, setSeoMetaDesc] = useState('ঢাকা অটো হাউস-এ স্বাগতম। বিশ্বস্ত জাপানি রিকন্ডিশন এবং ব্যবহৃত গাড়ির বিশাল সংগ্রহ।');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('G-84729472-1');
  const [facebookPixelId, setFacebookPixelId] = useState('FP-928472-2');

  // Plan Details (Starter Plan per DEALER-01 settings)
  const isStarterPlan = true; 

  // Builder UI Actions
  const [isPublished, setIsPublished] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);

  // Analytics Report State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | '7days' | '30days'>('7days');

  // Track any change to prompt "changes exist" indicator
  useEffect(() => {
    setHasChanges(true);
  }, [
    selectedTheme, logoUrl, businessName, tagline, aboutUs, brandColor, fontStyle,
    phone, whatsapp, email, address, hoursPreset, customHours, facebookUrl,
    instagramHandle, youtubeUrl, heroHeadline, heroSubtitle, heroBgType,
    heroCustomBgUrl, heroCtaText, featuredSectionTitle, showAboutSection,
    seoPageTitle, seoMetaDesc, googleAnalyticsId, facebookPixelId
  ]);

  // Initial load clears the immediate change trigger
  useEffect(() => {
    setHasChanges(false);
  }, []);

  const handleLogoUploadSimulate = () => {
    // Simulated upload
    setLogoUrl('https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1');
  };

  const handleCustomBgUploadSimulate = () => {
    setHeroCustomBgUrl('https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1');
    setHeroBgType('upload');
  };

  const handlePublish = () => {
    setIsPublished(true);
    setHasChanges(false);
    setShowSuccessModal(true);
  };

  const handleSaveDraft = () => {
    setHasChanges(false);
    alert('ড্রাফট সফলভাবে সংরক্ষণ করা হয়েছে।');
  };

  // Preset Colors Swatches
  const colorSwatchesRow1 = ['#2563EB', '#DC2626', '#16A34A', '#D97706'];
  const colorSwatchesRow2 = ['#7C3AED', '#0891B2', '#DB2777', '#374151'];

  // Font typography styles matching style choice
  const getFontFamilyClass = () => {
    if (fontStyle === 'modern') return 'font-sans';
    if (fontStyle === 'classic') return 'font-serif';
    return 'font-mono';
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16 md:pb-0">
      
      {/* Impersonation Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>আপনি বর্তমানে Dhaka Premium Motors হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।</span>
        </div>
        <Link href="/dashboard" className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
          ড্যাশবোর্ড
        </Link>
      </div>

      <div className="flex-1 flex relative overflow-hidden h-[calc(100vh-2.5rem)]">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 h-full">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[10px] text-[#6B7280] font-bold truncate">Dhaka Premium Motors</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: '🏠 ড্যাশবোর্ড', path: '/dashboard' },
                { id: 'inventory', label: '🚗 ইনভেন্টরি', path: '/dashboard/inventory' },
                { id: 'leads', label: '👥 লিড (CRM)', path: '/dashboard/leads' },
                { id: 'deals', label: '🤝 ডিল', path: '/dashboard/deals' },
                { id: 'analytics', label: '📊 Analytics', path: '/dashboard/analytics' },
                { id: 'automation', label: '🤖 Automation Hub', path: '/dashboard/automation' },
                { id: 'website', label: '🌐 Website', path: '/dashboard/website' },
                { id: 'settings', label: '⚙️ Settings', path: '/dashboard/settings' }
              ].map((item) => {
                const isActive = item.id === 'website';
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-[#2563EB] text-white shadow-sm' 
                        : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111827] bg-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-[#111827] flex items-center justify-center font-bold text-xs">
                TR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#111827] truncate leading-tight">তানভীর রহমান</p>
                <span className="text-[8px] font-semibold text-[#6B7280] block">Owner</span>
              </div>
            </div>
          </div>
        </aside>

        {/* TWO-PANEL WORKSPACE */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
          
          {/* LEFT PANEL: CONFIGURATION CONTROLS */}
          <div className="w-full md:w-[480px] bg-white border-r border-[#E5E7EB] flex flex-col h-full relative">
            
            <header className="p-6 border-b border-gray-100 shrink-0">
              <h1 className="font-extrabold text-base text-[#111827] font-outfit">ওয়েবসাইট বিল্ডার (DEALER-10)</h1>
              <p className="text-[10px] text-[#6B7280] font-bold">১০-মিনিটে আপনার শোরুম ওয়েবসাইট তৈরি করুন</p>
            </header>

            {/* Config scroll viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              
              {/* SECTION 1: THEME SELECTION */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-sm">palette</span>
                  আপনার পছন্দের থিম বেছে নিন
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Theme 1: Auto Pro */}
                  <div 
                    onClick={() => setSelectedTheme('pro')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all relative space-y-3 hover:shadow-md ${
                      selectedTheme === 'pro' ? 'border-[#2563EB] bg-blue-50/10' : 'border-[#E5E7EB] bg-white'
                    }`}
                  >
                    {selectedTheme === 'pro' && (
                      <span className="absolute top-3 right-3 bg-[#2563EB] text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        ✓ Selected
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#111827]">অটো প্রো (Auto Pro)</span>
                    </div>
                    {/* Thumbnail representation */}
                    <div className="bg-gray-50 border p-2.5 rounded-lg flex flex-col gap-1.5 pointer-events-none">
                      <div className="h-4 bg-[#2563EB] rounded-sm flex items-center justify-between px-2 text-[6px] text-white font-bold">
                        <span>ঢাকা অটো</span>
                        <span>Menu</span>
                      </div>
                      <div className="h-10 bg-white rounded border flex flex-col justify-center items-center text-[8px] text-gray-400">
                        🚗 Auto Pro Clean Design
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Professional', 'Clean', 'Popular'].map(tag => (
                        <span key={tag} className="bg-gray-100 text-[#6B7280] text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#6B7280] leading-relaxed font-semibold">
                      "পেশাদার ও আধুনিক ডিজাইন। সব ধরনের শোরুমের জন্য উপযুক্ত।"
                    </p>
                  </div>

                  {/* Theme 2: Classic Showroom */}
                  <div 
                    onClick={() => setSelectedTheme('classic')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all relative space-y-3 hover:shadow-md ${
                      selectedTheme === 'classic' ? 'border-[#2563EB] bg-blue-50/10' : 'border-[#E5E7EB] bg-white'
                    }`}
                  >
                    {selectedTheme === 'classic' && (
                      <span className="absolute top-3 right-3 bg-[#2563EB] text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        ✓ Selected
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#111827]">ক্লাসিক শোরুম (Classic Showroom)</span>
                    {/* Thumbnail representation */}
                    <div className="bg-gray-50 border p-2.5 rounded-lg flex flex-col gap-1.5 pointer-events-none">
                      <div className="h-4 bg-[#1E293B] rounded-sm flex items-center justify-between px-2 text-[6px] text-white font-bold">
                        <span>CLASSIC</span>
                        <span>Menu</span>
                      </div>
                      <div className="h-10 bg-gray-200 rounded flex flex-col justify-center items-center text-[8px] text-gray-500">
                        🚗 Bold Banner View
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Premium', 'Bold', 'Trustworthy'].map(tag => (
                        <span key={tag} className="bg-gray-100 text-[#6B7280] text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#6B7280] leading-relaxed font-semibold">
                      "শক্তিশালী ও বিশ্বাসযোগ্য ডিজাইন। প্রিমিয়াম গাড়ির ডিলারদের জন্য আদর্শ।"
                    </p>
                  </div>

                  {/* Theme 3: Dhaka Speed */}
                  <div 
                    onClick={() => setSelectedTheme('speed')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all relative space-y-3 hover:shadow-md ${
                      selectedTheme === 'speed' ? 'border-[#2563EB] bg-blue-50/10' : 'border-[#E5E7EB] bg-white'
                    }`}
                  >
                    {selectedTheme === 'speed' && (
                      <span className="absolute top-3 right-3 bg-[#2563EB] text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        ✓ Selected
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#111827]">ঢাকা স্পিড (Dhaka Speed)</span>
                    {/* Thumbnail representation */}
                    <div className="bg-gray-50 border p-2.5 rounded-lg flex flex-col gap-1.5 pointer-events-none">
                      <div className="h-4 bg-white rounded-sm flex items-center justify-between px-2 text-[6px] text-gray-700 font-bold border-b">
                        <span>⚡ Speed</span>
                        <span className="bg-[#16A34A] text-white px-1.5 rounded-full">WA</span>
                      </div>
                      <div className="h-10 bg-white rounded border flex flex-col justify-center items-center text-[8px] text-gray-400">
                        🚗 Compact Cards Stack
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Mobile-First', 'Fast', 'WhatsApp'].map(tag => (
                        <span key={tag} className="bg-gray-100 text-[#6B7280] text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#6B7280] leading-relaxed font-semibold">
                      "মোবাইল ব্যবহারকারীদের জন্য সর্বোত্তম। WhatsApp CTA সবখানে।"
                    </p>
                  </div>

                </div>
              </div>

              {/* SECTION 2: BRAND CUSTOMIZATION */}
              <div className="space-y-6">
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-sm">palette</span>
                  আপনার ব্র্যান্ড সেটআপ করুন
                </h3>

                {/* 2a. Logo Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">শোরুম লোগো</label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={handleLogoUploadSimulate}
                      className="w-24 h-24 rounded-full border-2 border-dashed border-[#E5E7EB] hover:border-[#2563EB] flex flex-col items-center justify-center gap-1.5 bg-gray-50/50 cursor-pointer overflow-hidden shrink-0"
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-gray-400 text-lg">add_a_photo</span>
                          <span className="text-[9px] text-[#6B7280] font-bold text-center px-1">লোগো আপলোড</span>
                        </>
                      )}
                    </button>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#111827] block">PNG বা JPG — সর্বোচ্চ ২ MB</span>
                      {logoUrl ? (
                        <button onClick={() => setLogoUrl(null)} className="text-[9px] font-bold text-red-600 hover:underline">রিমুভ করুন</button>
                      ) : (
                        <p className="text-[9px] text-[#6B7280] font-medium leading-relaxed">
                          আপলোড না থাকলে ব্যবসার নামের প্রথম অক্ষর লোগো হিসেবে স্বয়ংক্রিয়ভাবে ব্যবহার হবে।
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2b. Brand Color swatches */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">আপনার ব্র্যান্ডের রং</label>
                  <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">হেডার, বাটন ও হাইলাইটে ব্যবহার হবে</p>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {colorSwatchesRow1.map(color => (
                        <button 
                          key={color} 
                          onClick={() => { setBrandColor(color); setCustomColorActive(false); }}
                          style={{ backgroundColor: color }} 
                          className="w-10 h-10 rounded-xl relative flex items-center justify-center text-white border transition-all scale-100 hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {brandColor === color && !customColorActive && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {colorSwatchesRow2.map(color => (
                        <button 
                          key={color} 
                          onClick={() => { setBrandColor(color); setCustomColorActive(false); }}
                          style={{ backgroundColor: color }} 
                          className="w-10 h-10 rounded-xl relative flex items-center justify-center text-white border transition-all scale-100 hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {brandColor === color && !customColorActive && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#6B7280]">অন্য রং বেছে নিন:</span>
                    <input 
                      type="color" 
                      value={brandColor} 
                      onChange={e => { setBrandColor(e.target.value); setCustomColorActive(true); }}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* 2c. Font style */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">লেখার ধরন</label>
                  <div className="space-y-2">
                    {[
                      { id: 'modern', label: 'আধুনিক (Outfit + Inter)', preview: 'गাড়িসেল ডিজিটাল' },
                      { id: 'classic', label: 'ক্লাসিক (Playfair + Inter)', preview: 'গাড়িসেল ডিজিটাল' },
                      { id: 'simple', label: 'সহজ (Inter only)', preview: 'গাড়িসেল ডিজিটাল' }
                    ].map(f => (
                      <label key={f.id} className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="fontStyle" 
                            checked={fontStyle === f.id}
                            onChange={() => setFontStyle(f.id as any)}
                            className="accent-[#2563EB]"
                          />
                          <span className="text-xs font-bold text-[#111827]">{f.label}</span>
                        </div>
                        <span className={`text-[10px] text-gray-500 font-bold ${f.id === 'modern' ? 'font-sans' : f.id === 'classic' ? 'font-serif' : 'font-mono'}`}>
                          {f.preview}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECTION 3: SHOWROOM INFORMATION */}
              <div className="space-y-6">
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  শোরুমের তথ্য পূরণ করুন
                </h3>

                {/* 3a. Basic Info */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">ব্যবসার নাম</label>
                    <input 
                      type="text" 
                      value={businessName} 
                      onChange={e => setBusinessName(e.target.value)} 
                      className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-bold text-[#111827]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">ট্যাগলাইন</label>
                    <input 
                      type="text" 
                      value={tagline} 
                      onChange={e => setTagline(e.target.value)} 
                      className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none text-[#111827] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">শোরুম সম্পর্কে লিখুন</label>
                      <span className="text-[9px] font-mono text-[#6B7280]">{aboutUs.length}/২০০</span>
                    </div>
                    <textarea 
                      maxLength={200}
                      value={aboutUs} 
                      onChange={e => setAboutUs(e.target.value)} 
                      className="w-full p-3 border border-[#E5E7EB] rounded-lg text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none min-h-[80px]"
                    />
                  </div>
                </div>

                {/* 3b. Contact Info */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">📞 ফোন নম্বর</label>
                      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">💬 WhatsApp নম্বর</label>
                      <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">📧 ইমেইল (ঐচ্ছিক)</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">📍 ঠিকানা</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full h-10 border border-[#E5E7EB] rounded-lg px-3 text-xs focus:outline-none" />
                  </div>
                </div>

                {/* 3c. Business Hours */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">⏰ ব্যবসার সময়</label>
                  <div className="space-y-2 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={hoursPreset === 'preset1'} onChange={() => setHoursPreset('preset1')} className="accent-[#2563EB]" />
                      <span>শনি–বৃহ: সকাল ৯টা – সন্ধ্যা ৬টা</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={hoursPreset === 'preset2'} onChange={() => setHoursPreset('preset2')} className="accent-[#2563EB]" />
                      <span>শনি–শুক্র: সকাল ৯টা – রাত ৮টা</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={hoursPreset === 'custom'} onChange={() => setHoursPreset('custom')} className="accent-[#2563EB]" />
                      <span>কাস্টম সময় নির্ধারণ করুন</span>
                    </label>
                  </div>

                  {hoursPreset === 'custom' && (
                    <div className="bg-gray-50 p-4 rounded-2xl border space-y-2 animate-in slide-in-from-top-2 duration-200">
                      {customHours.map((h, idx) => (
                        <div key={h.day} className="flex items-center justify-between text-[11px] font-bold">
                          <label className="flex items-center gap-1.5 w-20 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={h.checked} 
                              onChange={(e) => {
                                const next = [...customHours];
                                next[idx].checked = e.target.checked;
                                setCustomHours(next);
                              }}
                              className="rounded accent-[#2563EB]" 
                            />
                            <span>{h.day}</span>
                          </label>
                          {h.checked ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="text" 
                                value={h.open} 
                                onChange={(e) => {
                                  const next = [...customHours];
                                  next[idx].open = e.target.value;
                                  setCustomHours(next);
                                }}
                                className="w-16 border rounded px-1 text-[10px] text-center" 
                              />
                              <span>থেকে</span>
                              <input 
                                type="text" 
                                value={h.close} 
                                onChange={(e) => {
                                  const next = [...customHours];
                                  next[idx].close = e.target.value;
                                  setCustomHours(next);
                                }}
                                className="w-16 border rounded px-1 text-[10px] text-center" 
                              />
                            </div>
                          ) : (
                            <span className="text-red-500 text-[10px]">বন্ধ (Closed)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3d. Social media collapsible */}
                <div className="border-t pt-3">
                  <button 
                    type="button"
                    onClick={() => setShowSocials(!showSocials)}
                    className="text-xs font-bold text-gray-500 hover:text-[#111827] flex items-center gap-1"
                  >
                    <span>সোশ্যাল মিডিয়া প্রোফাইল লিংক</span>
                    <span className="material-symbols-outlined text-[16px]">{showSocials ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {showSocials && (
                    <div className="space-y-3 pt-3 animate-in slide-in-from-top-1 duration-200">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[#6B7280] uppercase">Facebook Page URL</span>
                        <input type="text" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} className="w-full h-9 border rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[#6B7280] uppercase">Instagram Handle</span>
                        <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} className="w-full h-9 border rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[#6B7280] uppercase">YouTube Channel URL</span>
                        <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="w-full h-9 border rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB]" />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* SECTION 4: HOMEPAGE CONTENT */}
              <div className="space-y-6">
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-sm">home</span>
                  হোমপেজ কাস্টমাইজ করুন
                </h3>

                {/* 4a. Hero Section controls */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">প্রথম ব্যানার হেডিং (Hero Headline)</label>
                    <input type="text" value={heroHeadline} onChange={e => setHeroHeadline(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">ব্যানার সাবটাইটেল</label>
                    <input type="text" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                  </div>

                  {/* Banner background picker */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#6B7280] block">ব্যানার ব্যাকগ্রাউন্ড</span>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                      <button 
                        type="button" 
                        onClick={() => setHeroBgType('default')}
                        className={`p-2 border rounded-xl text-center ${heroBgType === 'default' ? 'bg-[#2563EB] text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        ডিফল্ট ছবি
                      </button>
                      <button 
                        type="button" 
                        onClick={handleCustomBgUploadSimulate}
                        className={`p-2 border rounded-xl text-center ${heroBgType === 'upload' ? 'bg-[#2563EB] text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        নিজের ছবি
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setHeroBgType('color')}
                        className={`p-2 border rounded-xl text-center ${heroBgType === 'color' ? 'bg-[#2563EB] text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        ব্র্যান্ড রং
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">CTA বাটন টেক্সট</label>
                    <input type="text" value={heroCtaText} onChange={e => setHeroCtaText(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                  </div>
                </div>

                {/* 4b. Featured Section Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">"বিশেষ গাড়ি" সেকশনের শিরোনাম</label>
                  <input type="text" value={featuredSectionTitle} onChange={e => setFeaturedSectionTitle(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                </div>

                {/* 4c. About section toggle */}
                <div className="flex justify-between items-center p-3 border rounded-xl bg-gray-50/50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#111827] block">"আমাদের সম্পর্কে" সেকশন দেখাবে</span>
                    <span className="text-[9px] text-[#6B7280] block">হোমপেজে ডিলারের বিবরণ সেকশন অন বা অফ রাখুন</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={showAboutSection} 
                      onChange={e => setShowAboutSection(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>

              </div>

              {/* SECTION 5: SEO SETTINGS (Advanced collapsible) */}
              <div className="border-t pt-4">
                <button 
                  onClick={() => setShowAdvancedSeo(!showAdvancedSeo)}
                  className="w-full flex justify-between items-center text-xs font-bold text-gray-500 hover:text-[#111827]"
                >
                  <span>Google-এ খোঁজার সুবিধা (SEO & Integrations)</span>
                  <span className="material-symbols-outlined text-[16px]">{showAdvancedSeo ? 'expand_less' : 'expand_more'}</span>
                </button>

                {showAdvancedSeo && (
                  <div className="space-y-4 pt-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B7280] uppercase">Page Title (গুগল সার্চ হেডার)</label>
                      <input type="text" value={seoPageTitle} onChange={e => setSeoPageTitle(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B7280] uppercase">Meta Description (সার্চ বিবরণ)</label>
                      <textarea value={seoMetaDesc} onChange={e => setSeoMetaDesc(e.target.value)} className="w-full p-3 border rounded-lg text-xs min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#6B7280] uppercase">Google Analytics ID</label>
                        <input type="text" value={googleAnalyticsId} onChange={e => setGoogleAnalyticsId(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#6B7280] uppercase">Facebook Pixel ID</label>
                        <input type="text" value={facebookPixelId} onChange={e => setFacebookPixelId(e.target.value)} className="w-full h-10 border rounded-lg px-3 text-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: DOMAIN */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-sm">dns</span>
                  আপনার ওয়েবসাইটের ঠিকানা
                </h3>

                <div className="bg-gray-50 border p-4 rounded-xl space-y-2">
                  <span className="text-[9px] text-[#6B7280] font-bold uppercase block">ডিফল্ট সাবডোমেন</span>
                  <div className="flex items-center justify-between text-xs font-bold text-[#111827] bg-white p-2.5 rounded-lg border">
                    <span className="truncate">dhaka-auto-house.garisale.com</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { navigator.clipboard.writeText('dhaka-auto-house.garisale.com'); alert('কপি করা হয়েছে!'); }}
                        className="p-1 text-gray-500 hover:text-[#2563EB]"
                        title="কপি করুন"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                      <Link 
                        href="https://dhaka-auto-house.garisale.com" 
                        target="_blank"
                        className="p-1 text-gray-500 hover:text-[#2563EB]"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Custom Domain (Starter Plan Compliance) */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-1 text-xs">
                  <span className="font-extrabold text-blue-800 block">🌐 কাস্টম ডোমেইন (Custom Domain)</span>
                  {isStarterPlan ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-gray-500 block font-semibold">🔒 কাস্টম ডোমেন Business প্ল্যানে পাওয়া যাবে</span>
                      <Link href="/dashboard/settings" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-0.5">
                        প্ল্যান আপগ্রেড করুন →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1.5">
                      <input type="text" placeholder="যেমন: cars.yoursite.com" className="w-full h-9 border rounded px-2.5 bg-white text-xs" />
                      <button className="bg-[#2563EB] text-white px-3 py-1 rounded text-[10px] font-bold">ডোমেন যুক্ত করুন</button>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* STICKY BOTTOM PUBLISH PANEL */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4 flex flex-col gap-2 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500">স্ট্যাটাস:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${hasChanges ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className={hasChanges ? 'text-orange-600' : 'text-green-600'}>
                    {hasChanges ? 'পরিবর্তন আছে (Unsaved)' : 'প্রকাশিত (Live)'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveDraft}
                  className="flex-1 h-11 border border-gray-300 hover:bg-gray-50 text-[#111827] rounded-xl font-bold text-xs transition-all active:scale-95"
                >
                  ড্রাফট সেভ করুন
                </button>
                <button 
                  onClick={handlePublish}
                  className="w-[60%] h-11 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  🚀 প্রকাশ করুন
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: LIVE PREVIEW CONTAINER */}
          <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden h-full relative">
            
            {/* Header Control for devices / preview warning */}
            <div className="bg-white border-b border-[#E5E7EB] h-14 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                <span className="text-[10px] font-bold text-gray-500">
                  ⚠️ এটি প্রিভিউ। প্রকাশের পর সম্পূর্ণরূপে লাইভ হবে।
                </span>
              </div>

              {/* Viewport Toggles */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px] font-bold">
                <button 
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded transition-all flex items-center gap-1 ${previewDevice === 'desktop' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500'}`}
                >
                  🖥️ Desktop
                </button>
                <button 
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded transition-all flex items-center gap-1 ${previewDevice === 'mobile' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500'}`}
                >
                  📱 Mobile
                </button>
              </div>
            </div>

            {/* Simulated Frame view */}
            <div className="flex-1 p-6 flex justify-center items-center overflow-y-auto">
              
              {previewDevice === 'desktop' ? (
                // DESKTOP PREVIEW BROWSER FRAME (scaled at 80%)
                <div className="w-full max-w-4xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden flex flex-col h-[520px] scale-95 origin-center transition-all duration-300">
                  {/* Browser Address Bar Mock */}
                  <div className="h-9 bg-gray-100 border-b flex items-center px-4 gap-2 text-[10px] text-gray-400 font-mono select-none">
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="bg-white border rounded px-3 py-0.5 flex-1 max-w-md ml-4 flex items-center gap-1 text-[9px] text-[#6B7280]">
                      🔒 https://dhaka-auto-house.garisale.com
                    </div>
                  </div>

                  {/* HTML Render */}
                  <div className={`flex-1 overflow-y-auto ${getFontFamilyClass()} text-gray-700`}>
                    
                    {/* Theme header */}
                    <header className={`px-8 h-16 border-b flex justify-between items-center ${selectedTheme === 'classic' ? 'bg-[#1E293B] text-white border-transparent' : 'bg-white border-gray-150'}`}>
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div style={{ backgroundColor: brandColor }} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs">
                            {businessName ? businessName[0] : 'ঢ'}
                          </div>
                        )}
                        <span className="font-extrabold text-sm tracking-tight">{businessName || 'শোরুমের নাম'}</span>
                      </div>
                      
                      <nav className="flex gap-6 text-[10px] font-bold">
                        <span style={{ color: selectedTheme === 'classic' ? '#FFFFFF' : brandColor }}>হোম (Home)</span>
                        <span>স্টক (Inventory)</span>
                        <span>আমাদের সম্পর্কে</span>
                        <span>যোগাযোগ</span>
                      </nav>
                    </header>

                    {/* HERO VIEW */}
                    <div 
                      style={{ 
                        backgroundColor: heroBgType === 'color' ? brandColor : (heroBgType === 'upload' ? 'transparent' : `${brandColor}10`),
                        backgroundImage: (heroBgType === 'upload' && heroCustomBgUrl) ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${heroCustomBgUrl})` : 'none',
                        backgroundSize: 'cover',
                        color: (heroBgType === 'color' || heroBgType === 'upload') ? '#FFFFFF' : '#111827'
                      }}
                      className="p-12 text-center space-y-4 border-b border-gray-150"
                    >
                      <h2 className="text-2xl font-extrabold max-w-lg mx-auto leading-tight">{heroHeadline || 'হেডলাইন'}</h2>
                      <p className={`text-xs max-w-md mx-auto ${heroBgType === 'color' || heroBgType === 'upload' ? 'text-gray-200' : 'text-gray-500'}`}>{heroSubtitle || 'সাবটাইটেল'}</p>
                      <button style={{ backgroundColor: brandColor, color: '#FFFFFF' }} className="px-6 py-2 rounded-xl text-xs font-bold shadow-md hover:brightness-110">
                        {heroCtaText}
                      </button>
                    </div>

                    {/* INVENTORY GRID */}
                    <div className="p-8 space-y-6 bg-gray-50/50">
                      <h3 className="text-xs font-extrabold text-center uppercase tracking-wider">{featuredSectionTitle}</h3>
                      
                      <div className="grid grid-cols-3 gap-6">
                        {MOCK_INVENTORY.slice(0, 3).map((car) => (
                          <div key={car.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-28 bg-gray-100 overflow-hidden relative">
                              <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
                              <span style={{ backgroundColor: brandColor }} className="absolute top-2 left-2 text-[8px] font-bold text-white px-2 py-0.5 rounded-full">
                                {car.condition}
                              </span>
                            </div>
                            <div className="p-4 space-y-2">
                              <h4 className="font-bold text-xs text-[#111827] truncate">{car.title}</h4>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 font-semibold">{toBengaliDigits(car.year)} · {toBengaliDigits(car.mileage)} km</span>
                                <span style={{ color: brandColor }} className="font-extrabold text-xs">BDT {toBengaliDigits(car.price.toLocaleString())}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ABOUT US SECTION */}
                    {showAboutSection && (
                      <div className="p-8 text-center bg-white border-t border-gray-150 space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider">আমাদের সম্পর্কে</h4>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-xl mx-auto font-medium">{aboutUs}</p>
                      </div>
                    )}

                    {/* FOOTER */}
                    <footer className="p-8 bg-gray-900 text-white text-xs border-t border-gray-800 grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <span className="font-extrabold text-sm block">{businessName}</span>
                        <p className="text-gray-400 text-[10px] max-w-xs">{tagline}</p>
                      </div>
                      <div className="space-y-1.5 text-right font-medium text-gray-300">
                        <p>📍 {address}</p>
                        <p>📞 {phone}</p>
                        <p>💬 WhatsApp: {whatsapp}</p>
                        {email && <p>📧 {email}</p>}
                      </div>
                    </footer>

                  </div>
                </div>
              ) : (
                // MOBILE PREVIEW PHONE MOCKUP (scaled at 60%)
                <div className="w-[390px] bg-white border-8 border-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[560px] scale-95 origin-center transition-all duration-300 relative">
                  {/* Phone Notch/Speaker */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-xl z-50 flex items-center justify-center">
                    <span className="w-8 h-1 bg-gray-700 rounded-full" />
                  </div>

                  {/* HTML Render */}
                  <div className={`flex-1 overflow-y-auto ${getFontFamilyClass()} text-gray-700 pt-4`}>
                    
                    {/* Header */}
                    <header className="px-4 h-12 border-b flex justify-between items-center bg-white sticky top-0 z-40">
                      <span className="font-extrabold text-xs" style={{ color: brandColor }}>{businessName}</span>
                      <span className="material-symbols-outlined text-gray-600 text-sm">menu</span>
                    </header>

                    {/* HERO VIEW */}
                    <div 
                      style={{ 
                        backgroundColor: heroBgType === 'color' ? brandColor : (heroBgType === 'upload' ? 'transparent' : `${brandColor}10`),
                        backgroundImage: (heroBgType === 'upload' && heroCustomBgUrl) ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${heroCustomBgUrl})` : 'none',
                        backgroundSize: 'cover',
                        color: (heroBgType === 'color' || heroBgType === 'upload') ? '#FFFFFF' : '#111827'
                      }}
                      className="p-8 text-center space-y-3"
                    >
                      <h2 className="text-base font-extrabold leading-snug">{heroHeadline}</h2>
                      <p className="text-[10px] opacity-90 max-w-xs mx-auto leading-relaxed">{heroSubtitle}</p>
                      <button style={{ backgroundColor: brandColor, color: '#FFFFFF' }} className="px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-md">
                        {heroCtaText}
                      </button>
                    </div>

                    {/* INVENTORY STACK */}
                    <div className="p-4 space-y-4 bg-gray-50">
                      <span className="text-[9px] font-bold text-gray-500 block uppercase tracking-wider">{featuredSectionTitle}</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {MOCK_INVENTORY.slice(0, 2).map((car) => (
                          <div key={car.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                            <div className="h-20 bg-gray-100 overflow-hidden">
                              <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2.5 space-y-1">
                              <h4 className="font-bold text-[9px] text-[#111827] truncate">{car.title}</h4>
                              <span style={{ color: brandColor }} className="font-extrabold text-[10px] block">BDT {toBengaliDigits(car.price.toLocaleString())}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FOOTER */}
                    <footer className="p-6 bg-gray-900 text-white text-[10px] space-y-4">
                      <div className="space-y-1 text-center">
                        <span className="font-extrabold block">{businessName}</span>
                        <p className="text-gray-400 text-[9px]">{tagline}</p>
                      </div>
                      <div className="space-y-1 text-center text-gray-300 font-semibold border-t border-gray-800 pt-3">
                        <p>📍 {address}</p>
                        <p>📞 {phone} · 💬 WA: {whatsapp}</p>
                      </div>
                    </footer>

                  </div>

                  {/* Sticky WhatsApp Floating FAB (Theme 3 Dhaka Speed compliance) */}
                  {(selectedTheme === 'speed' || selectedTheme === 'pro') && (
                    <Link 
                      href={`https://wa.me/${whatsapp}`} 
                      target="_blank"
                      className="absolute bottom-4 right-4 w-11 h-11 bg-[#16A34A] text-white rounded-full flex items-center justify-center shadow-xl hover:brightness-110 z-40 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                    </Link>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* MOBILE COMPACT TOGGLE PREVIEW (Only visible on small devices) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white border-t flex justify-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => {
            setMobilePreviewExpanded(!mobilePreviewExpanded);
            setPreviewDevice('mobile');
          }}
          className="w-full h-11 border border-gray-300 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">{mobilePreviewExpanded ? 'visibility_off' : 'visibility'}</span>
          {mobilePreviewExpanded ? 'প্রিভিউ বন্ধ করুন 👁️' : 'প্রিভিউ দেখুন 👁️'}
        </button>
      </div>

      {/* MOBILE EXPANDED FULL-SCREEN PREVIEW DRAW */}
      {mobilePreviewExpanded && (
        <div className="fixed inset-x-0 bottom-0 top-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end md:hidden animate-in fade-in duration-300">
          <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="h-14 border-b flex justify-between items-center px-5 bg-gray-50 shrink-0">
              <span className="text-xs font-bold text-slate-800">গাড়িসেল ওয়েবসাইট প্রিভিউ 📱</span>
              <button 
                onClick={() => setMobilePreviewExpanded(false)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-slate-800 hover:bg-gray-300"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex justify-center items-center bg-gray-100">
              {/* Scale Down Phone Mockup */}
              <div className="w-[330px] bg-white border-4 border-slate-900 rounded-[28px] shadow-lg overflow-hidden flex flex-col h-[480px]">
                <div className={`flex-1 overflow-y-auto ${getFontFamilyClass()} text-gray-700 text-[10px]`}>
                  {/* Header */}
                  <header className="px-3 h-10 border-b flex justify-between items-center bg-white sticky top-0 z-40">
                    <span className="font-extrabold text-[10px]" style={{ color: brandColor }}>{businessName}</span>
                    <span className="material-symbols-outlined text-gray-600 text-xs">menu</span>
                  </header>

                  {/* HERO */}
                  <div 
                    style={{ backgroundColor: `${brandColor}10`, color: '#111827' }} 
                    className="p-6 text-center space-y-2"
                  >
                    <h2 className="text-xs font-extrabold leading-snug">{heroHeadline}</h2>
                    <p className="text-[9px] text-gray-500 leading-relaxed">{heroSubtitle}</p>
                    <button style={{ backgroundColor: brandColor, color: '#FFFFFF' }} className="px-3 py-1 rounded text-[8px] font-bold">
                      {heroCtaText}
                    </button>
                  </div>

                  {/* INVENTORY */}
                  <div className="p-3 space-y-3 bg-gray-50">
                    <span className="text-[8px] font-bold text-gray-500 block uppercase">{featuredSectionTitle}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {MOCK_INVENTORY.slice(0, 2).map((car) => (
                        <div key={car.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                          <div className="h-16 bg-gray-100 overflow-hidden">
                            <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 space-y-1">
                            <h4 className="font-bold text-[8px] text-[#111827] truncate">{car.title}</h4>
                            <span style={{ color: brandColor }} className="font-extrabold text-[9px] block">BDT {toBengaliDigits(car.price.toLocaleString())}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST-PUBLISH SUCCESS STATE (Confetti Modal) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Visual Confetti burst simulation banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-pink-500 to-green-500" />
            
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[36px] animate-bounce">check_circle</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-[#111827] font-outfit">🎉 আপনার ওয়েবসাইট লাইভ হয়েছে!</h3>
              <p className="text-xs text-[#6B7280]">ডিলারের ওয়েবসাইট সফলভাবে আপডেট করা হয়েছে এবং ডোমেনে প্রকাশ করা হয়েছে।</p>
            </div>

            <div className="bg-gray-50 border p-4 rounded-2xl text-left space-y-2">
              <span className="text-[9px] font-bold text-[#6B7280] uppercase block">লাইভ লিঙ্ক (Live URL)</span>
              <div className="flex justify-between items-center text-xs font-bold text-[#2563EB]">
                <Link href="https://dhaka-auto-house.garisale.com" target="_blank" className="hover:underline truncate">
                  https://dhaka-auto-house.garisale.com
                </Link>
                <button 
                  onClick={() => { navigator.clipboard.writeText('https://dhaka-auto-house.garisale.com'); alert('কপি করা হয়েছে!'); }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Link 
                href={`https://wa.me/?text=${encodeURIComponent(`আমার নতুন শোরুম ওয়েবসাইট দেখুন: https://dhaka-auto-house.garisale.com`)}`}
                target="_blank"
                className="flex-1 h-11 bg-[#16A34A] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                WhatsApp-এ শেয়ার
              </Link>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="h-11 border border-gray-300 text-[#111827] px-6 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VISITOR ANALYTICS SECTION (Visible if published) */}
      {isPublished && (
        <section className="bg-white border-t border-[#E5E7EB] p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600 text-lg">analytics</span>
                  আপনার ওয়েবসাইটের পারফরম্যান্স (Visitor Reports)
                </h3>
                <p className="text-[10px] text-[#6B7280] font-bold mt-0.5">গাড়ি বিক্রয় ওয়েবসাইটের লাইভ ভিজিটর এনালিটিক্স</p>
              </div>

              {/* Period Selector Swappers */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px] font-bold">
                {[
                  { id: 'today', label: 'আজ' },
                  { id: '7days', label: '৭ দিন' },
                  { id: '30days', label: '৩০ দিন' }
                ].map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setAnalyticsPeriod(p.id as any)}
                    className={`px-3 py-1 rounded transition-all ${analyticsPeriod === p.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Analytics KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '👁️ Page Views', value: '১,৮৪২', change: '+১২%' },
                { label: '👥 Unique Visitors', value: '৪৩৫', change: '+৮%' },
                { label: '📩 Enquiries from Site', value: '৩২', change: '+১৫%' },
                { label: '🔗 WhatsApp Taps', value: '১৮', change: '+৫%' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white border p-5 rounded-2xl shadow-sm space-y-1">
                  <span className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">{stat.label}</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xl font-extrabold text-[#111827] font-outfit">{stat.value}</span>
                    <span className="text-[9px] font-bold text-green-600">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Popular listings table */}
            <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
              <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider border-b pb-2">সবচেয়ে জনপ্রিয় গাড়ি (Popular Listings)</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] text-[#6B7280] uppercase font-bold">
                      <th className="py-2.5">ছবি</th>
                      <th className="py-2.5">গাড়ির নাম</th>
                      <th className="py-2.5">ভিউ সংখ্যা</th>
                      <th className="py-2.5">প্রাপ্ত লিড</th>
                      <th className="py-2.5 text-right">সর্বশেষ ভিউ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                    {[
                      { title: 'Toyota Axio Hybrid 2019', price: '14.5L', views: '৭৪২', leads: '১৮', last: '১০ মিনিট আগে', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
                      { title: 'Honda Fit F-Package 2018', price: '12.8L', views: '৫১২', leads: '১২', last: '৪৫ মিনিট আগে', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
                      { title: 'Toyota Premio F 2017', price: '23.5L', views: '৪২০', leads: '৯', last: '২ ঘণ্টা আগে', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' }
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3">
                          <div className="w-10 h-7 bg-gray-100 rounded overflow-hidden border">
                            <img src={item.img} alt="Car" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-3 font-bold text-[#111827]">
                          {item.title}
                          <span className="block text-[8px] text-[#6B7280] font-bold">Price: BDT {item.price}</span>
                        </td>
                        <td className="py-3">{item.views} ভিউ</td>
                        <td className="py-3 text-blue-600 font-extrabold">{item.leads} লিড</td>
                        <td className="py-3 text-right text-gray-500 font-medium">{item.last}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car', path: '/dashboard/inventory' },
          { id: 'leads', label: 'Leads', icon: 'groups', path: '/dashboard/leads' },
          { id: 'deals', label: 'Deals', icon: 'handshake', path: '/dashboard/deals' },
          { id: 'more', label: 'More', icon: 'menu', path: '/dashboard' }
        ].map((tab) => {
          const isActive = tab.id === 'more';
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-[9px] font-bold">{tab.label}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
