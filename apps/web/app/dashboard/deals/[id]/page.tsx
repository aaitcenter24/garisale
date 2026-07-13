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

interface Payment {
  id: string;
  type: string;
  amount: number;
  method: string;
  date: string;
}

export default function DealSheetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const dealId = params.id;

  const [dealStatus, setDealStatus] = useState<'Draft' | 'Pending' | 'Approved' | 'Delivered'>('Pending');
  const [salePrice, setSalePrice] = useState<number>(1400000);
  const [discount, setDiscount] = useState<number>(50000);
  const discountThresholdPct = 5; // 5% discount threshold

  const originalPrice = 1450000;
  const acquisitionCost = 1100000;
  const reconCost = 80000;

  const [dealType, setDealType] = useState<'Cash' | 'Finance' | 'Exchange' | 'ExchangeCash'>('Finance');
  const [userRole, setUserRole] = useState<'Owner' | 'Manager' | 'Salesperson'>('Owner');

  // Finance states
  const [lenderName, setLenderName] = useState('Mutual Trust Bank');
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(9.5);
  const [loanTerm, setLoanTerm] = useState<number>(60);

  // Trade-in states
  const [tradeInDesc, setTradeInDesc] = useState('Toyota Corolla 2012');
  const [tradeInValue, setTradeInValue] = useState<number>(450000);

  const monthlyInstalment = useMemo(() => {
    if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) return 0;
    const r = (interestRate / 12) / 100;
    return (loanAmount * r * Math.pow(1 + r, loanTerm)) / (Math.pow(1 + r, loanTerm) - 1);
  }, [loanAmount, interestRate, loanTerm]);

  const grossProfit = useMemo(() => {
    return salePrice - acquisitionCost - reconCost;
  }, [salePrice]);

  // Payments log state
  const [payments, setPayments] = useState<Payment[]>([
    { id: '1', type: 'Booking Money', amount: 50000, method: 'bKash Tokenized', date: '2026-07-10' },
    { id: '2', type: 'Partial Payment', amount: 800000, method: 'Bank Wire', date: '2026-07-12' }
  ]);

  const [paymentType, setPaymentType] = useState('Partial Payment');
  const [paymentAmount, setPaymentAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Discount percentage calculation
  const discountPct = useMemo(() => {
    return (discount / originalPrice) * 100;
  }, [discount]);

  // Balance due calculation
  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const balanceDue = useMemo(() => {
    return salePrice - totalPaid;
  }, [salePrice, totalPaid]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    const newPayment: Payment = {
      id: String(payments.length + 1),
      type: paymentType,
      amount: paymentAmount,
      method: paymentMethod,
      date: new Date().toISOString().split('T')[0]
    };

    setPayments([...payments, newPayment]);
    setShowAddPaymentModal(false);
    setPaymentAmount(100000);
  };

  const handleGeneratePdf = () => {
    setPdfGenerating(true);
    setPdfUrl(null);
    setTimeout(() => {
      setPdfGenerating(false);
      setPdfUrl(`https://api.garisale.com/api/v1/deals/${dealId}/bill-of-sale.pdf`);
    }, 2000);
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
        <span className="font-extrabold text-sm text-[#111827] font-outfit">ডিল শিট (Deal Sheet)</span>
        <div className="w-10" />
      </header>

      {/* Main Deal Sheet Container */}
      <main className="max-w-lg mx-auto w-full p-6 space-y-6">
        
        {/* Deal Status Stepper Bar */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">ডিল স্ট্যাটাস</span>
          <div className="flex items-center justify-between text-xs font-bold px-2 pt-1">
            {[
              { id: 'Draft', label: 'Draft' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Approved', label: 'Approved' },
              { id: 'Delivered', label: 'Delivered' }
            ].map((step, idx) => {
              const steps = ['Draft', 'Pending', 'Approved', 'Delivered'];
              const currentIdx = steps.indexOf(dealStatus);
              const isActive = steps.indexOf(step.id) <= currentIdx;
              return (
                <div key={idx} className="flex items-center gap-1">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    isActive ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isActive && '✓'}
                  </div>
                  <span className={isActive ? 'text-[#2563EB]' : 'text-gray-400'}>{step.label}</span>
                </div>
              );
            })}
          </div>
            {/* Role Switcher for Testing (Section 2.10 RBAC) */}
            <div className="flex bg-gray-50 border p-2 rounded-xl text-[10px] font-bold justify-between items-center">
              <span className="text-[#6B7280]">Role-Based Access:</span>
              <div className="flex gap-2">
                {(['Owner', 'Manager', 'Salesperson'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRole(r)}
                    className={`px-2 py-0.5 rounded transition-all ${userRole === r ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </section>

        {/* Vehicle Section */}
        <section className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex gap-4 items-center">
          <div className="w-20 h-15 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1" alt="Axio" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[8px] font-bold text-[#6B7280] font-mono">STOCK NO: SK-2026-0001</span>
            <h4 className="font-bold text-xs text-[#111827] truncate">Toyota Axio 2019</h4>
            <p className="text-xs text-[#16A34A] font-bold mt-0.5">BDT {toBengaliDigits(originalPrice.toLocaleString())}</p>
            <span className="inline-block bg-[#DCFCE7] text-[#16A34A] text-[9px] font-bold px-2 py-0.5 rounded mt-1">
              Great Deal (IMV)
            </span>
          </div>
        </section>

        {/* Deal Type selector (💵 Cash, 🏦 Finance, 🔄 Exchange, 🔄+ Exchange+Cash) */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
          <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">ডিল টাইপ নির্বাচন করুন</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {[
              { id: 'Cash', label: '💵 Cash' },
              { id: 'Finance', label: '🏦 Finance' },
              { id: 'Exchange', label: '🔄 Exchange' },
              { id: 'ExchangeCash', label: '🔄+ Exchange+Cash' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setDealType(type.id as any)}
                className={`py-2 px-3 border rounded-xl transition-all text-center ${
                  dealType === type.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>

        {/* Deal Terms Card */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#111827] border-b pb-2">ডিল মেয়াদী চুক্তিসমূহ (Deal Terms)</h3>
          
          {/* Discount warning banner */}
          {discountPct > discountThresholdPct && (
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-xs font-bold text-orange-700 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>⚠️ ছাড় সীমা অতিক্রম করেছে ({toBengaliDigits(discountPct.toFixed(1))}% / সর্বোচ্চ ৫%)</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase">বিক্রয় মূল্য (Sale Price)</span>
              <span className="font-extrabold text-[#111827] text-sm">{formatBDT(salePrice)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase">ডিসকাউন্ট</span>
              <span className="font-bold text-red-600 text-sm">{formatBDT(discount)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase">ডিল টাইপ</span>
              <span className="font-bold text-[#111827] text-sm">{dealType}</span>
            </div>
          </div>
        </section>

        {/* Finance Section (show only if Finance selected) */}
        {(dealType === 'Finance') && (
          <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider border-b pb-2">🏦 ফাইন্যান্স সংক্রান্ত তথ্য</h3>
            
            <div className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[#6B7280] block text-[9px] uppercase">ব্যাংক / ঋণদানকারী সংস্থা</span>
                <input 
                  type="text" 
                  value={lenderName} 
                  onChange={e => setLenderName(e.target.value)} 
                  className="w-full h-10 border rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[#6B7280] block text-[9px] uppercase">ঋণের পরিমাণ (BDT)</span>
                  <input 
                    type="number" 
                    value={loanAmount} 
                    onChange={e => setLoanAmount(Number(e.target.value))} 
                    className="w-full h-10 border rounded-lg px-3 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[#6B7280] block text-[9px] uppercase">সুদের হার (%)</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={interestRate} 
                    onChange={e => setInterestRate(Number(e.target.value))} 
                    className="w-full h-10 border rounded-lg px-3 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[#6B7280] block text-[9px] uppercase">কিস্তির মেয়াদ (মাস)</span>
                  <input 
                    type="number" 
                    value={loanTerm} 
                    onChange={e => setLoanTerm(Number(e.target.value))} 
                    className="w-full h-10 border rounded-lg px-3 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[#6B7280] block text-[9px] uppercase">মাসিক কিস্তি (EMI)</span>
                  <span className="font-extrabold text-[#2563EB] text-sm block h-10 flex items-center">
                    {formatBDT(Math.round(monthlyInstalment))} / মাস
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trade-in section (show only if Exchange selected) */}
        {(dealType === 'Exchange' || dealType === 'ExchangeCash') && (
          <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-xs text-[#6B7280] uppercase tracking-wider border-b pb-2">🔄 এক্সচেঞ্জ সংক্রান্ত তথ্য</h3>
            
            <div className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[#6B7280] block text-[9px] uppercase">বিনিময়কৃত গাড়ির বিবরণ</span>
                <input 
                  type="text" 
                  value={tradeInDesc} 
                  onChange={e => setTradeInDesc(e.target.value)} 
                  className="w-full h-10 border rounded-lg px-3 text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[#6B7280] block text-[9px] uppercase">বিনিময় মূল্য (Trade-in Value BDT)</span>
                <input 
                  type="number" 
                  value={tradeInValue} 
                  onChange={e => setTradeInValue(Number(e.target.value))} 
                  className="w-full h-10 border rounded-lg px-3 text-xs"
                />
              </div>
            </div>
          </section>
        )}

        {/* Payment Log */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-sm text-[#111827]">পেমেন্ট লগ (Payment Log)</h3>
            <button 
              onClick={() => setShowAddPaymentModal(true)}
              className="bg-[#2563EB] text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all"
            >
              + পেমেন্ট রেকর্ড
            </button>
          </div>

          {/* Log Table */}
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-xs border-b pb-2">
                <div>
                  <span className="block font-bold text-[#111827]">{p.type}</span>
                  <span className="text-[10px] text-[#6B7280]">{p.method} · {toBengaliDigits(p.date)}</span>
                </div>
                <span className="font-bold text-[#111827]">{formatBDT(p.amount)}</span>
              </div>
            ))}
          </div>

          {/* Balance Due Display */}
          <div className="flex justify-between items-center pt-2 text-xs font-bold border-t border-gray-100">
            <span>অবশিষ্ট পাওনা (Balance Due)</span>
            <span className={`text-sm ${balanceDue <= 0 ? 'text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded'}`}>
              {balanceDue <= 0 ? 'Paid ✓' : formatBDT(balanceDue)}
            </span>
          </div>

          {/* Gross Profit row (Owner only, hidden for others) */}
          <div className="flex justify-between items-center pt-2.5 text-xs font-bold border-t border-dashed border-gray-200">
            <span>মোট গ্রস প্রফিট (Gross Profit)</span>
            {userRole === 'Owner' ? (
              <span className="text-emerald-600 font-extrabold text-sm">{formatBDT(grossProfit)}</span>
            ) : (
              <span className="text-gray-400 font-bold">—</span>
            )}
          </div>
        </section>

        {/* Bill of Sale PDF Generator */}
        <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm text-center space-y-4">
          <div className="flex justify-between items-center border-b pb-2 text-left">
            <h3 className="font-bold text-sm text-[#111827]">বিক্রয় রসিদ (Bill of Sale)</h3>
            <span className="text-[9px] text-[#6B7280] font-bold">PDF INVOICE</span>
          </div>
          <button 
            onClick={handleGeneratePdf}
            disabled={pdfGenerating}
            className="w-full h-11 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-xs"
          >
            {pdfGenerating ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                PDF তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px] text-red-600">picture_as_pdf</span>
                PDF তৈরি করুন (Bill of Sale)
              </>
            )}
          </button>
          
          {pdfUrl && (
            <Link 
              href={pdfUrl}
              target="_blank"
              className="text-xs text-[#2563EB] font-bold hover:underline block animate-in fade-in duration-200"
            >
              📥 রসিদটি ডাউনলোড করুন (Download link)
            </Link>
          )}
        </section>

        {/* Approval Section */}
        {dealStatus === 'Pending' && (
          <section className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
            <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">ডিল অনুমোদন (Manager+)</span>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDealStatus('Approved')}
                className="h-11 bg-[#16A34A] text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-xs"
              >
                অনুমোদন করুন
              </button>
              <button 
                onClick={() => setDealStatus('Draft')}
                className="h-11 bg-white border border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 active:scale-95 transition-all text-xs"
              >
                প্রত্যাখ্যান করুন
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Record Payment Dialog Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-outfit">পেমেন্ট রেকর্ড করুন</h3>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">পেমেন্ট টাইপ</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827]"
                >
                  <option value="Partial Payment">Partial Payment</option>
                  <option value="Booking Money">Booking Money</option>
                  <option value="Down Payment">Down Payment</option>
                  <option value="Full Payment">Full Payment</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">টাকার পরিমাণ (BDT)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">পেমেন্ট মেথড</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg px-2 text-xs text-[#111827]"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash Tokenized">bKash Tokenized</option>
                  <option value="Bank Wire">Bank Wire</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-[#2563EB] text-white rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md mt-2"
              >
                পেমেন্ট সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
