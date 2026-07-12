'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DealerOSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('owner@dhakamotors.com');
  const [password, setPassword] = useState('password123');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardSubView, setDashboardSubView] = useState<'briefing' | 'activity'>('briefing');
  const [showImpersonation, setShowImpersonation] = useState(true);

  // Demo user config
  const user = {
    name: 'Tanvir Rahman',
    role: 'Owner',
    dealership: 'Dhaka Premium Motors',
    plan: 'Business Pro'
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
  };

  // Translations
  const t = {
    en: {
      loginSubtitle: 'Digital Showroom Management System',
      emailLabel: 'Email Address',
      passLabel: 'Password',
      signInBtn: 'Sign In to Dealer OS',
      impersonateWarning: 'You are viewing as Dhaka Premium Motors. All actions are logged.',
      exitImpersonate: 'Exit Impersonation',
      searchPlaceholder: 'Search inventory, leads, or deals...',
      welcome: 'Good morning, Tanvir 👋',
      snapshotTitle: "Yesterday's Snapshot",
      sales: 'Sales',
      revenue: 'Revenue',
      activeListings: 'Active Listings',
      newLeads: 'New Leads',
      urgentActions: 'Urgent Actions Required',
      leadsUncontacted: '3 leads uncontacted for 2+ hours',
      vehicleAging: 'SK-0034 on lot 60 days. Reduce price?',
      dealsApproval: '2 deals pending your approval',
      actNow: 'Act Now',
      marketTrends: 'Market Trends (Maestro AI)',
      activityFeed: 'Activity Feed',
      morningBriefing: 'Morning Briefing',
      sidebarDashboard: 'Dashboard',
      sidebarInventory: 'Inventory',
      sidebarCrm: 'CRM',
      sidebarDeals: 'Deals',
      sidebarAnalytics: 'Analytics',
      sidebarWebsite: 'Website & Marketing',
      sidebarAutomation: 'Automation Hub',
      sidebarSettings: 'Settings',
      helpSupport: 'WhatsApp Support',
      signOut: 'Sign Out'
    },
    bn: {
      loginSubtitle: 'ডিজিটাল শোরুম ম্যানেজমেন্ট সিস্টেম',
      emailLabel: 'ইমেইল অ্যাড্রেস',
      passLabel: 'পাসওয়ার্ড',
      signInBtn: 'ডিলার ওএস-এ লগইন করুন',
      impersonateWarning: 'আপনি বর্তমানে ঢাকা প্রিমিয়াম মটরস হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।',
      exitImpersonate: 'ইমপার্সনেশন বন্ধ করুন',
      searchPlaceholder: 'ইনভেন্টরি, লিড বা ডিল খুঁজুন...',
      welcome: 'শুভ সকাল, তানভীর 👋',
      snapshotTitle: 'গতকালের স্ন্যাপশট',
      sales: 'বিক্রয় সংখ্যা',
      revenue: 'মোট রাজস্ব',
      activeListings: 'সচল বিজ্ঞাপন',
      newLeads: 'নতুন লিড',
      urgentActions: 'জরুরী পদক্ষেপসমূহ',
      leadsUncontacted: '৩টি লিডের সাথে ২ ঘণ্টার বেশি যোগাযোগ করা হয়নি',
      vehicleAging: 'SK-0034 গাড়িটি ৬০ দিন ধরে অবিক্রিত। মূল্য কমাবেন?',
      dealsApproval: '২টি ডিল আপনার অনুমোদনের অপেক্ষায় রয়েছে',
      actNow: 'পদক্ষেপ নিন',
      marketTrends: 'বাজার ট্রেন্ডস (Maestro AI)',
      activityFeed: 'অ্যাক্টিভিটি ফিড',
      morningBriefing: 'মর্নিং ব্রিফিং',
      sidebarDashboard: 'ড্যাশবোর্ড',
      sidebarInventory: 'ইনভেন্টরি',
      sidebarCrm: 'সিআরএম (CRM)',
      sidebarDeals: 'ডিলসমূহ',
      sidebarAnalytics: 'অ্যানালিটিক্স',
      sidebarWebsite: 'ওয়েবসাইট ও মার্কেটিং',
      sidebarAutomation: 'অটোমেশন হাব',
      sidebarSettings: 'সেটিংস',
      helpSupport: 'হোয়াটসঅ্যাপ সাপোর্ট',
      signOut: 'লগআউট'
    }
  }[language];

  // LOGIN SCREEN (Strictly Light Theme / No Dark Backgrounds)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] p-8 rounded-3xl shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-textPrimary font-outfit">
              Garisale <span className="text-primary">Dealer OS</span>
            </h1>
            <p className="text-xs text-textSecondary font-semibold">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">{t.emailLabel}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-3 text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">{t.passLabel}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-white border border-[#E5E7EB] rounded-xl px-3 text-sm text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-sm shadow-md mt-2"
            >
              {t.signInBtn}
            </button>
          </form>

          {/* Demo Helper info */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <span className="block text-[9px] font-bold text-textSecondary uppercase tracking-wider">Demo Credentials</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-textPrimary font-semibold">
              <button 
                onClick={() => { setEmail('owner@dhakamotors.com'); setPassword('password123'); }}
                className="bg-white border border-gray-300 py-1.5 rounded-lg hover:bg-gray-50 text-left px-2"
              >
                🔑 Owner
              </button>
              <button 
                onClick={() => { setEmail('sales@dhakamotors.com'); setPassword('password123'); }}
                className="bg-white border border-gray-300 py-1.5 rounded-lg hover:bg-gray-50 text-left px-2"
              >
                🔑 Salesperson
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD SCREEN (Correction 2: Pure Light Theme sidebar and layout)
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      
      {/* Impersonation Amber warning bar */}
      {showImpersonation && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>{t.impersonateWarning}</span>
          </div>
          <button 
            onClick={() => setShowImpersonation(false)}
            className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
          >
            {t.exitImpersonate}
          </button>
        </div>
      )}

      <div className="flex-1 flex relative">
        
        {/* Left Sidebar (LIGHT THEME: Background #FFFFFF, Right Border 1px solid #E5E7EB) */}
        <aside 
          className={`bg-white text-textPrimary flex flex-col justify-between shrink-0 transition-all duration-300 relative border-r border-[#E5E7EB] ${
            sidebarCollapsed ? 'w-[70px]' : 'w-[245px]'
          }`}
        >
          {/* Top Brand logo */}
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                  G
                </div>
                <div>
                  <h2 className="font-extrabold text-sm font-outfit truncate w-28 text-textPrimary">Garisale OS</h2>
                  <span className="bg-blue-50 text-primary border border-blue-100 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    {user.plan}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white mx-auto shadow-sm">
                G
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-textSecondary hover:text-textPrimary"
            >
              <span className="material-symbols-outlined text-[20px]">
                {sidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {[
              { id: 'dashboard', label: t.sidebarDashboard, icon: 'dashboard' },
              { id: 'inventory', label: t.sidebarInventory, icon: 'directions_car' },
              { id: 'crm', label: t.sidebarCrm, icon: 'groups' },
              { id: 'deals', label: t.sidebarDeals, icon: 'handshake' },
              { id: 'analytics', label: t.sidebarAnalytics, icon: 'trending_up' },
              { id: 'divider', label: '', icon: '' },
              { id: 'website', label: t.sidebarWebsite, icon: 'language' },
              { id: 'automation', label: t.sidebarAutomation, icon: 'bolt' },
              { id: 'settings', label: t.sidebarSettings, icon: 'settings' }
            ].map((nav) => {
              if (nav.id === 'divider') {
                return <div key={nav.id} className="h-px bg-gray-200 my-4" />;
              }
              const isActive = nav.id === 'dashboard';
              return (
                <button
                  key={nav.id}
                  className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-textSecondary hover:bg-gray-100 hover:text-textPrimary bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{nav.icon}</span>
                  {!sidebarCollapsed && <span>{nav.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom metadata panel */}
          <div className="p-4 border-t border-[#E5E7EB] space-y-4 bg-gray-50/50">
            {/* Language toggle */}
            <div className={`flex bg-gray-200 p-0.5 rounded-lg text-[9px] font-bold ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <button 
                onClick={() => setLanguage('en')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${language === 'en' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${language === 'bn' ? 'bg-white text-textPrimary shadow-sm' : 'text-textSecondary'}`}
              >
                বাংলা
              </button>
            </div>

            {/* Help / WhatsApp Support */}
            {!sidebarCollapsed && (
              <Link 
                href="https://wa.me/8801700000000"
                target="_blank"
                className="flex items-center gap-2 text-[10px] font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                {t.helpSupport}
              </Link>
            )}

            {/* User Profile */}
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gray-200 text-textPrimary flex items-center justify-center font-bold text-xs shrink-0">
                TR
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold truncate leading-tight text-textPrimary">{user.name}</p>
                  <span className="text-[8px] font-semibold text-textSecondary block">{user.role}</span>
                </div>
              )}
            </div>

            {/* Sign out */}
            <button 
              onClick={handleSignOut}
              className={`w-full flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              {!sidebarCollapsed && <span>{t.signOut}</span>}
            </button>
          </div>
        </aside>

        {/* Right Content View */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header Bar */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-8 shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-4 w-96">
              <span className="material-symbols-outlined text-textSecondary text-[20px]">search</span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full text-xs font-medium focus:outline-none bg-transparent"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative text-textSecondary hover:text-textPrimary p-2">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-xs font-bold text-textPrimary">{user.dealership}</span>
            </div>
          </header>

          {/* Main Dashboard Panel */}
          <main className="p-8 space-y-8 flex-1">
            
            {/* Title block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold font-outfit text-textPrimary">{t.welcome}</h1>
                <p className="text-xs text-textSecondary font-semibold mt-0.5">Monday, 15 January 2026</p>
              </div>

              {/* Sub-view switcher */}
              <div className="flex bg-gray-200/60 p-1 rounded-xl text-xs font-bold border border-gray-300">
                <button
                  onClick={() => setDashboardSubView('briefing')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    dashboardSubView === 'briefing' ? 'bg-white text-primary shadow-sm' : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {t.morningBriefing}
                </button>
                <button
                  onClick={() => setDashboardSubView('activity')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    dashboardSubView === 'activity' ? 'bg-white text-primary shadow-sm' : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {t.activityFeed}
                </button>
              </div>
            </div>

            {/* Dashboard contents */}
            {dashboardSubView === 'briefing' ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* Snapshot Cards */}
                <section className="space-y-4">
                  <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider pl-2.5 border-l-2 border-primary">
                    {t.snapshotTitle}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: t.sales, value: '2', sub: 'Yesterday', icon: 'payments', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                      { label: t.revenue, value: 'BDT 28.5L', sub: 'Deal Value', icon: 'analytics', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                      { label: t.activeListings, value: '23', sub: 'In Showroom', icon: 'directions_car', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                      { label: t.newLeads, value: '7', sub: 'Last 24 Hours', icon: 'groups', color: 'text-purple-600 bg-purple-50 border-purple-100' }
                    ].map((card, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between ${card.color}`}>
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">{card.label}</span>
                          <span className="block text-2xl font-bold font-outfit">{card.value}</span>
                          <span className="block text-[9px] opacity-75 font-semibold">{card.sub}</span>
                        </div>
                        <span className="material-symbols-outlined text-3xl opacity-80">{card.icon}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Urgent actions */}
                <section className="space-y-4">
                  <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider pl-2.5 border-l-2 border-primary">
                    {t.urgentActions}
                  </h3>
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm divide-y divide-[#E5E7EB]">
                    {[
                      { msg: t.leadsUncontacted, level: '🔴', count: 3, action: 'View Leads' },
                      { msg: t.vehicleAging, level: '🟠', count: 1, action: 'Reprice' },
                      { msg: t.dealsApproval, level: '🟡', count: 2, action: 'Review' }
                    ].map((act, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-2 text-textPrimary">
                          <span className="text-base">{act.level}</span>
                          <span>{act.msg}</span>
                        </div>
                        <button className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all">
                          {act.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Maestro AI Insights banner */}
                <section className="space-y-4">
                  <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider pl-2.5 border-l-2 border-primary">
                    {t.marketTrends}
                  </h3>
                  <div className="bg-primary text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 z-10">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                        <h4 className="font-extrabold text-base font-outfit uppercase tracking-wider">Maestro AI Insight</h4>
                      </div>
                      <p className="text-xs opacity-90 max-w-xl leading-relaxed">
                        "Toyota Axio-র বাজারমূল্য চলতি মাসে ঢাকায় ৮% বৃদ্ধি পেয়েছে। আপনার স্টকে ৩টি Toyota Axio রয়েছে। ডিল ক্লিয়ার করার জন্য এখনই বিজ্ঞাপন আপডেট করুন।"
                      </p>
                    </div>
                    <button className="bg-white text-primary px-5 py-2.5 rounded-lg text-xs font-bold hover:brightness-95 active:scale-95 transition-all shadow-md shrink-0">
                      বিজ্ঞাপন আপডেট করুন
                    </button>
                  </div>
                </section>

              </div>
            ) : (
              /* Activity Feed */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-300">
                <h3 className="font-bold text-base text-textPrimary border-b pb-3">{t.activityFeed}</h3>
                <div className="relative border-l border-gray-200 ml-4 space-y-6 py-2">
                  {[
                    { time: '10:32 AM', desc: 'New lead: Rafiq Hasan → Toyota Axio (Marketplace)', icon: 'groups', color: 'bg-blue-500' },
                    { time: '09:15 AM', desc: 'Deal SK-0022 approved by Manager', icon: 'handshake', color: 'bg-emerald-500' },
                    { time: '08:44 AM', desc: '2019 Honda Fit price updated: BDT 12.8L', icon: 'sell', color: 'bg-indigo-500' },
                    { time: '08:00 AM', desc: 'Daily summary report delivered to owner', icon: 'analytics', color: 'bg-purple-500' }
                  ].map((act, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div className={`absolute left-0 top-1.5 -ml-3.5 w-7 h-7 rounded-full flex items-center justify-center text-white ${act.color} shadow-sm z-10`}>
                        <span className="material-symbols-outlined text-[14px]">{act.icon}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-textSecondary">{act.time}</span>
                        <p className="text-xs font-semibold text-textPrimary">{act.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
