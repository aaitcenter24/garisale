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

interface ReconTask {
  id: string;
  category: 'Engine' | 'Body' | 'Paint' | 'Interior' | 'Electricals' | 'Tyres' | 'AC' | 'Brakes';
  name: string;
  estCost: number;
  actualCost: number | null;
  status: 'OK' | 'Needs Work' | 'Critical';
  eta: string;
  assignee: string;
}

export default function ReconWorkflowPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const vehicleId = params.id;

  const [tasks, setTasks] = useState<ReconTask[]>([
    { id: '1', category: 'Engine', name: 'Engine Oil & Filter change', estCost: 8000, actualCost: 8000, status: 'OK', assignee: 'Arif (Engine Specialist)', eta: '2026-07-12' },
    { id: '2', category: 'Body', name: 'Left fender denting repair', estCost: 5000, actualCost: null, status: 'Needs Work', assignee: 'Salam (Body Builder)', eta: '2026-07-14' },
    { id: '3', category: 'Paint', name: 'Bumper scratch painting', estCost: 12000, actualCost: null, status: 'Critical', assignee: 'Karim Paint Shop', eta: '2026-07-15' },
    { id: '4', category: 'Interior', name: 'Leather seat cleaning & polishing', estCost: 4000, actualCost: 4000, status: 'OK', assignee: 'Clean BD', eta: '2026-07-12' },
    { id: '5', category: 'Electricals', name: 'Fuse check & bulb replacement', estCost: 1500, actualCost: 1500, status: 'OK', assignee: 'Faruk Electrician', eta: '2026-07-12' },
    { id: '6', category: 'Tyres', name: 'Front wheel alignment check', estCost: 2000, actualCost: null, status: 'Needs Work', assignee: 'Dhaka Tyre Hub', eta: '2026-07-16' },
    { id: '7', category: 'AC', name: 'AC gas recharge', estCost: 3500, actualCost: null, status: 'Needs Work', assignee: 'AC Masters', eta: '2026-07-16' },
    { id: '8', category: 'Brakes', name: 'Front brake pad replacement', estCost: 6000, actualCost: null, status: 'Critical', assignee: 'Rahman Brake Service', eta: '2026-07-15' }
  ]);

  // Inline add task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEstCost, setNewEstCost] = useState<number>(5000);
  const [newCategory, setNewCategory] = useState<ReconTask['category']>('Engine');
  const [newAssignee, setNewAssignee] = useState('Unassigned');
  const [newEta, setNewEta] = useState('2026-07-15');

  // Expense notification state (FIX: When task completed -> auto-create vehicle_expense)
  const [expenseNotification, setExpenseNotification] = useState<string | null>(null);

  // Total recon cost sum
  const totalCost = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.actualCost !== null ? t.actualCost : t.estCost), 0);
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newTask: ReconTask = {
      id: String(tasks.length + 1),
      category: newCategory,
      name: newName,
      estCost: newEstCost,
      actualCost: null,
      status: 'Needs Work',
      eta: newEta,
      assignee: newAssignee || 'Unassigned'
    };

    setTasks([...tasks, newTask]);
    setShowAddForm(false);
    setNewName('');
  };

  const handleStatusChange = (id: string, newStatus: ReconTask['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextActualCost = newStatus === 'OK' ? (t.actualCost || t.estCost) : null;
        if (newStatus === 'OK') {
          setExpenseNotification(`✅ BDT ${toBengaliDigits(nextActualCost?.toLocaleString() || '0')} vehicle expense auto-added`);
          setTimeout(() => setExpenseNotification(null), 4000);
        }
        return { ...t, status: newStatus, actualCost: nextActualCost };
      }
      return t;
    }));
  };

  const handleAssigneeChange = (id: string, assignee: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, assignee } : t));
  };

  const handleActualCostChange = (id: string, actualCost: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, actualCost } : t));
  };

  const handleCompleteRecon = () => {
    alert('অভিনন্দন! রিকনস্ট্রাকশন কিউ সম্পন্ন হয়েছে। গাড়িটির স্ট্যাটাস স্বয়ংক্রিয়ভাবে "Available" করা হয়েছে এবং মার্কেটপ্লেসে সিঙ্ক ট্রিগার করা হয়েছে।');
    router.push('/dashboard/inventory');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-16">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-[#6B7280] hover:text-[#111827]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          পেছনে
        </button>
        <span className="font-extrabold text-sm text-[#111827] font-outfit">Recon Workflow</span>
        <div className="w-10" />
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto w-full p-6 space-y-6">
        
        {/* Header Vehicle and Cost Summary Card */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <span className="block text-[8px] font-bold text-[#6B7280] font-mono">RECONSTRUCTION MANAGEMENT</span>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-sm text-[#111827]">Toyota Axio 2019</h2>
              <span className="text-[10px] text-[#6B7280] font-bold block">STOCK NO: SK-2026-0001</span>
            </div>
            <div className="text-right">
              <span className="block text-[8px] font-bold text-[#6B7280] uppercase">মোট রিকন খরচ</span>
              <span className="text-base font-extrabold text-red-600 font-outfit">
                {formatBDT(totalCost)}
              </span>
            </div>
          </div>
        </section>

        {/* Tasks List */}
        <section className="space-y-4">
          <div className="flex justify-between items-center pl-2">
            <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">রিকনস্ট্রাকশন টাস্ক লিস্ট</h3>
            <button 
              onClick={() => setShowAddForm(true)}
              className="text-[#2563EB] text-xs font-bold hover:underline flex items-center gap-0.5"
            >
              + নতুন টাস্ক যোগ করুন
            </button>
          </div>

          <div className="space-y-3">
            {/* Auto-create expense notification banner */}
            {expenseNotification && (
              <div className="bg-emerald-50 border border-emerald-200 text-green-700 p-3 rounded-xl text-xs font-bold text-center animate-in slide-in-from-top-1">
                {expenseNotification}
              </div>
            )}

            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <span className="bg-blue-50 text-[#2563EB] text-[8px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                      {task.category}
                    </span>
                    <h4 className="font-bold text-xs text-[#111827] mt-1.5">{task.name}</h4>
                    <span className="text-[9px] text-[#6B7280] block mt-0.5">ETA: {toBengaliDigits(task.eta)}</span>
                  </div>
                  
                  <div className="text-right text-xs shrink-0 font-semibold space-y-1">
                    <span className="text-gray-500 block text-[9px]">Est: {formatBDT(task.estCost)}</span>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-gray-400 text-[9px]">Actual (BDT):</span>
                      <input 
                        type="number" 
                        value={task.actualCost || ''} 
                        placeholder="Actual BDT"
                        onChange={e => handleActualCostChange(task.id, Number(e.target.value))}
                        className="w-20 border rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-gray-150 flex-wrap gap-2">
                  {/* Assignee Dropdown */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-500 font-bold">Assigned to:</span>
                    <select 
                      value={task.assignee} 
                      onChange={e => handleAssigneeChange(task.id, e.target.value)}
                      className="text-[10px] border rounded p-1 focus:outline-none bg-white font-semibold text-[#111827]"
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Arif (Engine Specialist)">Arif (Engine Specialist)</option>
                      <option value="Salam (Body Builder)">Salam (Body Builder)</option>
                      <option value="Karim Paint Shop">Karim Paint Shop</option>
                      <option value="Clean BD">Clean BD</option>
                      <option value="Faruk Electrician">Faruk Electrician</option>
                      <option value="Dhaka Tyre Hub">Dhaka Tyre Hub</option>
                      <option value="AC Masters">AC Masters</option>
                      <option value="Rahman Brake Service">Rahman Brake Service</option>
                    </select>
                  </div>

                  {/* 3-State Status Radios */}
                  <div className="flex gap-2.5 items-center">
                    {(['OK', 'Needs Work', 'Critical'] as const).map(st => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-gray-700">
                        <input 
                          type="radio" 
                          name={`status-${task.id}`} 
                          checked={task.status === st} 
                          onChange={() => handleStatusChange(task.id, st)}
                          className="accent-[#2563EB]"
                        />
                        <span>
                          {st === 'OK' ? 'OK ✅' : st === 'Needs Work' ? 'Needs Work ⚠️' : 'Critical 🔴'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Complete Recon Button & Banner */}
        <section className="pt-4 space-y-3 shrink-0">
          {tasks.every(t => t.status === 'OK') ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center space-y-2.5 animate-in zoom-in-95">
              <p className="text-xs font-bold text-green-700">🎉 সব কাজ সম্পন্ন! গাড়ি 'Available' করতে প্রস্তুত</p>
              <button 
                onClick={handleCompleteRecon}
                className="w-full h-12 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Available হিসেবে মার্ক করুন
              </button>
            </div>
          ) : (
            <button 
              onClick={handleCompleteRecon}
              className="w-full h-12 bg-[#2563EB]/45 text-white rounded-xl font-bold cursor-not-allowed text-xs flex items-center justify-center gap-1.5 shadow-sm"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
              টাস্ক পেন্ডিং আছে (Recon সম্পন্ন করুন)
            </button>
          )}
        </section>

      </main>

      {/* Add Task Inline Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit">টাস্ক যোগ করুন</h3>
              <button onClick={() => setShowAddForm(false)} className="text-[#6B7280] hover:text-[#111827]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ক্যাটাগরি</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827] focus:outline-none font-bold"
                >
                  {['Engine', 'Body', 'Paint', 'Interior', 'Electricals', 'Tyres', 'AC', 'Brakes'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">কাজ / টাস্কের নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ফ্রন্ট রাইট বাম্পার রিপ্লেসমেন্ট"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">খরচ (Est BDT)</label>
                  <input
                    type="number"
                    required
                    value={newEstCost}
                    onChange={(e) => setNewEstCost(Number(e.target.value))}
                    className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">সম্ভাব্য শেষ দিন</label>
                  <input
                    type="date"
                    required
                    value={newEta}
                    onChange={(e) => setNewEta(e.target.value)}
                    className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">কন্ট্রাক্টর / টেকনিশিয়ান</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827] focus:outline-none bg-white font-bold"
                >
                  <option value="Unassigned">Unassigned</option>
                  <option value="Arif (Engine Specialist)">Arif (Engine Specialist)</option>
                  <option value="Salam (Body Builder)">Salam (Body Builder)</option>
                  <option value="Karim Paint Shop">Karim Paint Shop</option>
                  <option value="Clean BD">Clean BD</option>
                  <option value="Faruk Electrician">Faruk Electrician</option>
                  <option value="Dhaka Tyre Hub">Dhaka Tyre Hub</option>
                  <option value="AC Masters">AC Masters</option>
                  <option value="Rahman Brake Service">Rahman Brake Service</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2"
              >
                টাস্ক সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
