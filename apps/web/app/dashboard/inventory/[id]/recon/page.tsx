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
  category: 'Mechanical 🔧' | 'Dent & Paint 🎨' | 'Wash & Polish ✨' | 'Documentation 📄';
  name: string;
  cost: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  eta: string;
  assignee: string;
}

export default function ReconWorkflowPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const vehicleId = params.id;

  const [tasks, setTasks] = useState<ReconTask[]>([
    { id: '1', category: 'Dent & Paint 🎨', name: 'ফ্রন্ট বাম বাম্পার পেইন্টিং', cost: 12000, status: 'Completed', eta: '2026-07-11', assignee: 'Karim Paint Shop' },
    { id: '2', category: 'Mechanical 🔧', name: 'ইঞ্জিন অয়েল ও ফিল্টার পরিবর্তন', cost: 8000, status: 'In Progress', eta: '2026-07-13', assignee: 'Dhaka Auto Care' },
    { id: '3', category: 'Wash & Polish ✨', name: 'ইন্টেরিয়র ডিটেইলিং ও পলিশ', cost: 5000, status: 'Pending', eta: '2026-07-14', assignee: 'Clean & Shine BD' },
    { id: '4', category: 'Documentation 📄', name: 'বিআরটিএ ট্যাক্স টোকেন নবায়ন', cost: 25000, status: 'Pending', eta: '2026-07-20', assignee: 'BRTA Agent Faruk' }
  ]);

  // Inline add task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState<number>(5000);
  const [newCategory, setNewCategory] = useState<ReconTask['category']>('Mechanical 🔧');
  const [newAssignee, setNewAssignee] = useState('');
  const [newEta, setNewEta] = useState('2026-07-15');

  // Total recon cost sum
  const totalCost = useMemo(() => {
    return tasks.reduce((sum, t) => sum + t.cost, 0);
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newTask: ReconTask = {
      id: String(tasks.length + 1),
      category: newCategory,
      name: newName,
      cost: newCost,
      status: 'Pending',
      eta: newEta,
      assignee: newAssignee || 'Unassigned'
    };

    setTasks([...tasks, newTask]);
    setShowAddForm(false);
    setNewName('');
  };

  const handleStatusChange = (id: string, newStatus: ReconTask['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
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
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-gray-100 text-[#6B7280] text-[8px] font-bold px-2 py-0.5 rounded-full border">
                      {task.category}
                    </span>
                    <h4 className="font-bold text-xs text-[#111827] mt-1.5">{task.name}</h4>
                    <span className="text-[10px] text-[#6B7280] block mt-0.5">দায়িত্বে: {task.assignee} · ETA: {toBengaliDigits(task.eta)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-[#111827] block">{formatBDT(task.cost)}</span>
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task.id, e.target.value as any)}
                      className={`text-[9px] font-bold rounded px-1.5 py-0.5 border mt-1.5 focus:outline-none ${
                        task.status === 'Completed'
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : task.status === 'In Progress'
                          ? 'bg-blue-50 text-[#2563EB] border-blue-200 animate-pulse'
                          : 'bg-yellow-50 text-amber-600 border-amber-200'
                      }`}
                    >
                      <option value="Pending">Pending 🔒</option>
                      <option value="In Progress">In Progress 🔄</option>
                      <option value="Completed">Completed ✓</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Complete Recon Button */}
        <section className="pt-4 shrink-0">
          <button 
            onClick={handleCompleteRecon}
            className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Recon সম্পন্ন করুন (Mark Available)
          </button>
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
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827]"
                >
                  <option value="Mechanical 🔧">Mechanical 🔧</option>
                  <option value="Dent & Paint 🎨">Dent & Paint 🎨</option>
                  <option value="Wash & Polish ✨">Wash & Polish ✨</option>
                  <option value="Documentation 📄">Documentation 📄</option>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">খরচ (BDT)</label>
                  <input
                    type="number"
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
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
                <input
                  type="text"
                  placeholder="যেমন: ঢাকা পেইন্টিং শপ"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none"
                />
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
