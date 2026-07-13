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

interface AgingVehicle {
  id: string;
  name: string;
  stockId: string;
  price: number;
  daysOnLot: number;
  status: 'In Recon' | 'Available';
  image: string;
}

interface AgingLead {
  id: string;
  customerName: string;
  phone: string;
  vehicleOfInterest: string;
  pipelineStage: string;
  unresolvedHours: number;
  assignedSalesperson: string;
}

export default function AgingWatchlistPage() {
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');
  
  const user = {
    name: 'তানভীর',
    role: 'Owner',
    dealership: 'Dhaka Premium Motors',
    plan: 'Starter'
  };

  // Mock Aging Vehicles
  const [agingVehicles, setAgingVehicles] = useState<AgingVehicle[]>([
    { id: '1', name: 'Toyota Axio Hybrid 2019', stockId: 'SK-202501-0012', price: 1450000, daysOnLot: 92, status: 'Available', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
    { id: '2', name: 'Honda Fit F-Package 2018', stockId: 'SK-202501-0034', price: 1280000, daysOnLot: 54, status: 'Available', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
    { id: '3', name: 'Toyota Premio F 2017', stockId: 'SK-202501-0056', price: 2350000, daysOnLot: 42, status: 'In Recon', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' }
  ]);

  // Mock SLA Violated Leads
  const [agingLeads, setAgingLeads] = useState<AgingLead[]>([
    { id: '1', customerName: 'কামরুল হাসান', phone: '01812345678', vehicleOfInterest: 'Toyota Axio 2019', pipelineStage: 'New Lead', unresolvedHours: 4, assignedSalesperson: 'সাকিব (Sales)' },
    { id: '2', customerName: 'ইশতিয়াক আহমেদ', phone: '01711223344', vehicleOfInterest: 'Honda Fit 2018', pipelineStage: 'Contacted', unresolvedHours: 18, assignedSalesperson: 'রহমান (Sales)' },
    { id: '3', customerName: 'জাকির হোসেন', phone: '01999887766', vehicleOfInterest: 'Toyota Premio 2017', pipelineStage: 'Qualified', unresolvedHours: 72, assignedSalesperson: 'সাকিব (Sales)' }
  ]);

  const handlePingLead = (phone: string, customer: string) => {
    const message = `হ্যালো ${customer}, গাড়িসেল শোরুম থেকে যোগাযোগ করা হচ্ছে। আপনার কাঙ্ক্ষিত গাড়িটির ব্যাপারে কোনো জিজ্ঞাসা আছে কি?`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16 md:pb-0">
      
      {/* Impersonation Header */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>আপনি বর্তমানে {user.dealership} হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।</span>
        </div>
        <Link href="/dashboard" className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
          ড্যাশবোর্ড
        </Link>
      </div>

      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 h-full sticky top-0">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center font-bold text-lg font-outfit text-white shadow-sm">
                G
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm font-outfit text-[#111827] truncate">GariSale</h2>
                <p className="text-[10px] text-[#6B7280] font-bold truncate">{user.dealership}</p>
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
                const isActive = item.id === 'aging';
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
            <div className="flex items-center justify-between">
              <span className="border border-[#2563EB] text-[#2563EB] bg-blue-50/50 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user.plan} Plan
              </span>
              <span className="text-[10px] font-bold text-gray-400">Language: {lang}</span>
            </div>
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

        {/* WORKSPACE */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="font-extrabold text-base md:text-lg text-[#111827] font-outfit flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">timer_10_alt_1</span>
                Aging Watchlist (বার্ধক্য ইনভেন্টরি ও লিড মনিটর)
              </h1>
              <p className="text-[10px] text-[#6B7280] font-bold mt-0.5">অলস পড়ে থাকা গাড়ি এবং SLA ভায়োলেট হওয়া লিডের বিবরণ</p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border p-5 rounded-2xl shadow-sm space-y-1">
              <span className="block text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">গড় বিক্রয় সময় (Avg. Days on Lot)</span>
              <span className="text-xl font-extrabold text-[#111827] font-sans block">{toBengaliDigits(62)} দিন</span>
            </div>
            <div className="bg-white border p-5 rounded-2xl shadow-sm border-orange-100 space-y-1">
              <span className="block text-[8px] font-bold text-orange-600 uppercase tracking-wider">অলস গাড়ি (Aging Cars 45+ Days)</span>
              <span className="text-xl font-extrabold text-orange-600 font-sans block">{toBengaliDigits(agingVehicles.length)} টি গাড়ি</span>
            </div>
            <div className="bg-white border p-5 rounded-2xl shadow-sm border-red-100 space-y-1">
              <span className="block text-[8px] font-bold text-red-600 uppercase tracking-wider">উদাসীন লিড (SLA Violated Leads)</span>
              <span className="text-xl font-extrabold text-red-600 font-sans block">{toBengaliDigits(agingLeads.length)} জন ক্রেতা</span>
            </div>
          </div>

          {/* Section 1: Stagnant Inventory (45+ & 90+ Days) */}
          <section className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider pl-2">স্টক বার্ধক্য মনিটর (Stagnant Vehicles)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agingVehicles.map(car => {
                const isUrgent = car.daysOnLot >= 90;
                return (
                  <div 
                    key={car.id} 
                    className={`bg-white rounded-3xl border p-4.5 flex gap-4 shadow-sm relative ${
                      isUrgent ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-orange-500'
                    }`}
                  >
                    {/* Car Image mock */}
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                      <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-[#111827] truncate">{car.name}</h4>
                          <span className="text-[9px] text-gray-400 font-semibold">Stock ID: {car.stockId}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isUrgent ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          লটে {toBengaliDigits(car.daysOnLot)} দিন
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-gray-500 font-semibold">BDT {toBengaliDigits(car.price.toLocaleString())}</span>
                        <div className="flex gap-1">
                          {car.status === 'In Recon' ? (
                            <Link 
                              href={`/dashboard/inventory/${car.id}/recon`}
                              className="text-[#2563EB] hover:underline font-bold"
                            >
                              ⚙️ রিকন চেক
                            </Link>
                          ) : (
                            <Link 
                              href="/dashboard/maestro"
                              className="text-[#2563EB] hover:underline font-bold"
                            >
                              💰 মূল্য অপ্টিমাইজেশন
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: SLA Violated Leads (2h / 7d) */}
          <section className="space-y-4">
            <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider pl-2">লিড রেসপন্স মনিটর (SLA Watchlist)</h3>
            
            <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[10px] text-[#6B7280] uppercase font-bold">
                      <th className="p-4">ক্রেতার নাম</th>
                      <th className="p-4">আগ্রহের গাড়ি</th>
                      <th className="p-4">পাইপলাইন ধাপ</th>
                      <th className="p-4">রিসেট কাল (SLA Delay)</th>
                      <th className="p-4">দায়িত্বে</th>
                      <th className="p-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-semibold text-[#111827]">
                    {agingLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <span className="block font-bold">{lead.customerName}</span>
                          <span className="text-[9px] text-gray-500 font-mono">{lead.phone}</span>
                        </td>
                        <td className="p-4 text-gray-600">{lead.vehicleOfInterest}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-[#2563EB] text-[8px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                            {lead.pipelineStage}
                          </span>
                        </td>
                        <td className="p-4 text-red-600 font-extrabold">
                          {toBengaliDigits(lead.unresolvedHours)} ঘণ্টা যাবত নিষ্ক্রিয়
                        </td>
                        <td className="p-4 text-gray-500">{lead.assignedSalesperson}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handlePingLead(lead.phone, lead.customerName)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all inline-flex items-center gap-1 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[10px] font-bold">chat</span>
                            লিড নক করুন (WA)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </main>

      </div>

      {/* MOBILE INSET BOTTOM TABS */}
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
