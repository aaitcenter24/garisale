'use client';

import React, { useState, useMemo } from 'react';
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
  stockNo: string;
  title: string;
  price: number;
  status: 'Available' | 'In Recon' | 'Reserved' | 'Sold' | 'Acquired';
  daysOnLot: number;
  syncStatus: 'Synced' | 'Syncing' | 'Sync Error';
  imvRating: 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced' | 'unrated';
  photo: string;
}

const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', stockNo: 'SK-202601-0001', title: 'Toyota Axio 2019', price: 1450000, status: 'Available', daysOnLot: 15, syncStatus: 'Synced', imvRating: 'great_deal', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '2', stockNo: 'SK-202601-0002', title: 'Honda Fit 2018', price: 1280000, status: 'In Recon', daysOnLot: 5, syncStatus: 'Syncing', imvRating: 'good_deal', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '3', stockNo: 'SK-202601-0003', title: 'Toyota Premio 2017', price: 2150000, status: 'Reserved', daysOnLot: 52, syncStatus: 'Synced', imvRating: 'fair_price', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '4', stockNo: 'SK-202601-0004', title: 'Nissan X-Trail 2019', price: 2900000, status: 'Sold', daysOnLot: 95, syncStatus: 'Synced', imvRating: 'great_deal', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' },
  { id: '5', stockNo: 'SK-202601-0005', title: 'Toyota Corolla 2018', price: 1620000, status: 'Available', daysOnLot: 12, syncStatus: 'Sync Error', imvRating: 'fair_price', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1' }
];

export default function InventoryListPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Available' | 'In Recon' | 'Reserved' | 'Sold'>('All');

  // Stats calculation
  const stats = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.status === 'Available').length;
    const recon = vehicles.filter(v => v.status === 'In Recon').length;
    return { total, available, recon };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (activeFilter === 'All') return vehicles;
    return vehicles.filter(v => v.status === activeFilter);
  }, [vehicles, activeFilter]);

  const getStatusBadgeConfig = (status: Vehicle['status']) => {
    switch (status) {
      case 'Available':
        return { text: '#16A34A', bg: '#DCFCE7', label: 'Available ✅' };
      case 'In Recon':
        return { text: '#D97706', bg: '#FEF3C7', label: 'In Recon 🔧' };
      case 'Reserved':
        return { text: '#2563EB', bg: '#DBEAFE', label: 'Reserved 🔒' };
      case 'Sold':
        return { text: '#6B7280', bg: '#F3F4F6', label: 'Sold ✓' };
      case 'Acquired':
        return { text: '#7C3AED', bg: '#F5F3FF', label: 'Acquired ⚡' };
    }
  };

  const getIMVBadgeConfig = (rating: Vehicle['imvRating']) => {
    switch (rating) {
      case 'great_deal':
        return { text: '#16A34A', bg: '#DCFCE7', label: 'Great Deal' };
      case 'good_deal':
        return { text: '#0D9488', bg: '#CCFBF1', label: 'Good Deal' };
      case 'fair_price':
        return { text: '#D97706', bg: '#FEF3C7', label: 'Fair Price' };
      case 'overpriced':
        return { text: '#DC2626', bg: '#FEE2E2', label: 'Overpriced' };
      default:
        return { text: '#9CA3AF', bg: '#F3F4F6', label: 'Unrated' };
    }
  };

  const handleSyncRetry = (id: string) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, syncStatus: 'Syncing' } : v));
    setTimeout(() => {
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, syncStatus: 'Synced' } : v));
    }, 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই গাড়িটি ডিলিট করতে চান?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20 md:pb-0">
      
      {/* Impersonation Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>আপনি বর্তমানে Dhaka Premium Motors হিসেবে দেখছেন। সব অ্যাকশন লগ করা হচ্ছে।</span>
        </div>
        <Link href="/dashboard" className="bg-slate-950 text-white px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
          ড্যাশবোর্ড
        </Link>
      </div>

      <div className="flex-1 flex relative">
        {/* DESKTOP SIDEBAR (width 240px, fixed, white) */}
        <aside className="w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen">
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
                const isActive = item.id === 'inventory';
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

        {/* MAIN INVENTORY WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header/Top Bar */}
          <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
            <div>
              <h1 className="font-extrabold text-base text-[#111827] font-outfit">আমার ইনভেন্টরি</h1>
              <p className="text-[10px] text-[#6B7280] font-bold">
                {toBengaliDigits(stats.total)} গাড়ি · {toBengaliDigits(stats.available)} available · {toBengaliDigits(stats.recon)} in recon
              </p>
            </div>
            
            <Link 
              href="/dashboard/inventory/add"
              className="bg-[#2563EB] text-white px-4 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              + গাড়ি যোগ করুন
            </Link>
          </header>

          {/* Filter tabs */}
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide text-xs font-bold shrink-0">
            {[
              { id: 'All', label: 'All' },
              { id: 'Available', label: 'Available ✅' },
              { id: 'In Recon', label: 'In Recon 🔧' },
              { id: 'Reserved', label: 'Reserved 🔒' },
              { id: 'Sold', label: 'Sold ✓' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-4 py-2 rounded-full border transition-all shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main workspace container */}
          <main className="p-6 flex-1 bg-[#F9FAFB] overflow-y-auto">
            
            {/* MOBILE LAYOUT: Card Stack (< 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredVehicles.map((car) => {
                const statusConfig = getStatusBadgeConfig(car.status);
                const imvConfig = getIMVBadgeConfig(car.imvRating);
                
                // Aging warnings borders
                let borderClass = 'border-l-4 border-l-transparent';
                if (car.daysOnLot >= 90) {
                  borderClass = 'border-l-4 border-l-red-500';
                } else if (car.daysOnLot >= 45) {
                  borderClass = 'border-l-4 border-l-orange-500';
                }

                return (
                  <div 
                    key={car.id} 
                    className={`bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex gap-3 items-center ${borderClass}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <img src={car.photo} alt={car.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-[#6B7280] font-mono">{car.stockNo}</span>
                        {car.daysOnLot >= 90 && (
                          <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded">
                            ⚠️ জরুরি
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-[#111827] truncate">{car.title}</h4>
                      <p className="text-xs text-[#16A34A] font-bold">BDT {toBengaliDigits(car.price.toLocaleString())}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[8px] font-bold">
                        <span 
                          style={{ color: statusConfig.text, backgroundColor: statusConfig.bg }}
                          className="px-2 py-0.5 rounded-full"
                        >
                          {statusConfig.label}
                        </span>
                        <span className="bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded-full">
                          {toBengaliDigits(car.daysOnLot)} দিন শোরুমে
                        </span>
                        <span 
                          style={{ color: imvConfig.text, backgroundColor: imvConfig.bg }}
                          className="px-2 py-0.5 rounded-full"
                        >
                          {imvConfig.label}
                        </span>
                      </div>

                      {/* Sync & Edit Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[10px] font-bold">
                        {car.syncStatus === 'Synced' && <span className="text-[#6B7280]">✅ Synced</span>}
                        {car.syncStatus === 'Syncing' && <span className="text-[#2563EB] animate-pulse">🔄 Syncing...</span>}
                        {car.syncStatus === 'Sync Error' && (
                          <span className="text-red-600">
                            ⚠️ Sync error ·{' '}
                            <button onClick={() => handleSyncRetry(car.id)} className="underline hover:text-red-700">
                              Retry
                            </button>
                          </span>
                        )}
                        <Link href={`/dashboard/inventory/edit/${car.id}`} className="text-[#2563EB] hover:underline">
                          সম্পাদনা করুন
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP LAYOUT: Data Table (>= 768px) */}
            <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-4 w-10 text-center">☐</th>
                    <th className="p-4">Photo</th>
                    <th className="p-4">Stock No.</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Days on Lot</th>
                    <th className="p-4">Sync</th>
                    <th className="p-4">IMV Rating</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredVehicles.map((car) => {
                    const statusConfig = getStatusBadgeConfig(car.status);
                    const imvConfig = getIMVBadgeConfig(car.imvRating);
                    
                    // Aging warnings indicator
                    let rowBorderClass = '';
                    if (car.daysOnLot >= 90) {
                      rowBorderClass = 'border-l-4 border-l-red-500';
                    } else if (car.daysOnLot >= 45) {
                      rowBorderClass = 'border-l-4 border-l-orange-500';
                    }

                    return (
                      <tr key={car.id} className={`hover:bg-gray-50/50 transition-colors ${rowBorderClass}`}>
                        <td className="p-4 text-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary w-4 h-4" />
                        </td>
                        <td className="p-4">
                          <div className="w-12 h-9 bg-gray-100 rounded overflow-hidden border border-gray-200">
                            <img src={car.photo} alt={car.title} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[#6B7280]">{car.stockNo}</td>
                        <td className="p-4 font-bold text-[#111827]">{car.title}</td>
                        <td className="p-4 text-right font-bold text-[#16A34A]">
                          BDT {toBengaliDigits(car.price.toLocaleString())}
                        </td>
                        <td className="p-4 text-center">
                          <span 
                            style={{ color: statusConfig.text, backgroundColor: statusConfig.bg }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-[#111827]">
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{toBengaliDigits(car.daysOnLot)} দিন</span>
                            {car.daysOnLot >= 90 && (
                              <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                ⚠️ জরুরি
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {car.syncStatus === 'Synced' && <span className="text-[#6B7280]">Synced</span>}
                          {car.syncStatus === 'Syncing' && <span className="text-[#2563EB] animate-pulse">Syncing...</span>}
                          {car.syncStatus === 'Sync Error' && (
                            <div className="flex items-center gap-1">
                              <span className="text-red-600">Sync error</span>
                              <button onClick={() => handleSyncRetry(car.id)} className="text-[#2563EB] underline hover:text-blue-700">
                                Retry
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span 
                            style={{ color: imvConfig.text, backgroundColor: imvConfig.bg }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-opacity-40"
                          >
                            {imvConfig.label}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <Link href={`/dashboard/inventory/edit/${car.id}`} className="text-primary hover:text-blue-700 font-bold" title="Edit">
                              ✏️ Edit
                            </Link>
                            <Link href="/search" className="text-emerald-600 hover:text-emerald-700 font-bold" title="View">
                              👁️ View
                            </Link>
                            <button onClick={() => handleSyncRetry(car.id)} className="text-indigo-600 hover:text-indigo-700 font-bold" title="Sync">
                              🔄 Sync
                            </button>
                            <button onClick={() => handleDelete(car.id)} className="text-red-600 hover:text-red-700 font-bold" title="Delete">
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { id: 'inventory', label: 'Inventory', icon: 'directions_car', path: '/dashboard/inventory' },
          { id: 'leads', label: 'Leads', icon: 'groups', path: '/dashboard/leads' },
          { id: 'deals', label: 'Deals', icon: 'handshake', path: '/dashboard/deals' },
          { id: 'more', label: 'More', icon: 'menu', path: '/dashboard' }
        ].map((tab) => {
          const isActive = tab.id === 'inventory';
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
