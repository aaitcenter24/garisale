import React from 'react';
import Link from 'next/link';

export const revalidate = 60; // ISR revalidate every 60 seconds

// Types based on OpenAPI schema
interface VehiclePhoto {
  id: string;
  url: string;
  is_primary: boolean;
}

interface MarketplaceListing {
  id: string;
  slug: string;
  title: string;
  asking_price: number;
  original_price?: number;
  price_drop_flag: boolean;
  deal_rating: 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced' | 'unrated';
  year: number;
  make: string;
  model: string;
  transmission: string;
  mileage_km: number;
  district: string;
  photo_count: number;
  photos: VehiclePhoto[];
  created_at: string;
}

// Fetch featured/latest listings from API
async function getLatestListings(): Promise<MarketplaceListing[]> {
  const apiUrl = 'https://api.garisale.com/api/v1/public/marketplace/search';
  try {
    const res = await fetch(`${apiUrl}?limit=8`, {
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching listings for homepage:', error);
    // Return empty array to fallback gracefully
    return [];
  }
}

// BDT formatting function following BD standards
function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', 'BDT').replace('Rs', 'BDT');
}

// Helper to determine deal rating styles based on Section 2.7
function getDealRatingConfig(rating: MarketplaceListing['deal_rating']) {
  switch (rating) {
    case 'great_deal':
      return { text: '#16A34A', bg: '#DCFCE7', label: 'Great Deal', border: 'border-green-200' };
    case 'good_deal':
      return { text: '#0D9488', bg: '#CCFBF1', label: 'Good Deal', border: 'border-teal-200' };
    case 'fair_price':
      return { text: '#D97706', bg: '#FEF3C7', label: 'Fair Price', border: 'border-amber-200' };
    case 'overpriced':
      return { text: '#DC2626', bg: '#FEE2E2', label: 'Overpriced', border: 'border-red-200' };
    default:
      return { text: '#9CA3AF', bg: '#F3F4F6', label: 'No Rating', border: 'border-gray-200' };
  }
}

export default async function Homepage() {
  const listings = await getLatestListings();

  // Categories list based on Stitch design
  const categories = [
    { name: 'Sedan', icon: 'directions_car', slug: 'sedan' },
    { name: 'SUV', icon: 'airport_shuttle', slug: 'suv' },
    { name: 'Microbus', icon: 'airport_shuttle', slug: 'microbus' },
    { name: 'Pickup', icon: 'local_shipping', slug: 'pickup' },
    { name: 'Hatchback', icon: 'time_to_leave', slug: 'hatchback' },
    { name: 'Crossover', icon: 'minor_crash', slug: 'crossover' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Utility Bar */}
      <div className="bg-[#2A313D] text-white py-2 hidden md:block">
        <div className="max-w-container-max mx-auto px-gutter flex justify-between items-center text-xs font-semibold">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">call</span>
              01611-613952
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              Dhaka, Bangladesh
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hover:text-primary-dark transition-colors">Dealer Portal</Link>
            <span className="text-gray-500">|</span>
            <Link href="/sell" className="hover:text-primary-dark transition-colors">Sell My Car</Link>
            <span className="text-gray-500">|</span>
            <span className="material-symbols-outlined cursor-pointer text-[16px]">language</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-surface sticky top-0 z-50 border-b border-gray-200 shadow-sm h-20 flex items-center">
        <nav className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto">
          {/* Brand Logo */}
          <Link href="/" className="text-2xl font-bold text-textPrimary flex items-center gap-2 font-outfit">
            <span className="text-primary">Garisale</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-stack-lg text-sm font-semibold text-textSecondary">
            <Link href="/" className="text-primary border-b-2 border-primary font-bold py-2">Home</Link>
            <Link href="/search" className="hover:text-primary transition-colors py-2">গাড়ি খুঁজুন</Link>
            <Link href="/value-my-car" className="hover:text-primary transition-colors py-2">মূল্য যাচাই (IMV)</Link>
            <Link href="/sell" className="hover:text-primary transition-colors py-2">গাড়ি বিক্রি করুন</Link>
            <Link href="/trends/toyota/allion" className="hover:text-primary transition-colors py-2">দামের ট্রেন্ডস</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/login" 
              className="hidden md:flex items-center gap-2 text-textSecondary hover:bg-gray-100 p-2 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
            <Link 
              href="/sell"
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              গাড়ি লিস্টিং করুন
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section with Search Bento */}
      <section className="relative h-[550px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.6), rgba(17, 24, 39, 0.7)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1')` 
            }}
          ></div>
        </div>
        <div className="relative z-10 w-full max-w-container-max px-gutter text-center text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-outfit mb-4">
            বাংলাদেশে গাড়ির সেরা মার্কেটপ্লেস
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Garisale-এর মাধ্যমে সঠিক দামে যাচাইকৃত গাড়ি ও ডিলার খুঁজে নিন এক ক্লিকেই।
          </p>

          {/* Search Bento Box */}
          <div className="bg-white text-textPrimary p-6 rounded-2xl shadow-2xl max-w-4xl mx-auto text-left border border-gray-200">
            {/* Condition Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button className="pb-3 border-b-2 border-primary text-primary font-bold px-4 text-sm">All Condition</button>
              <button className="pb-3 text-textSecondary hover:text-primary px-4 transition-colors text-sm">New</button>
              <button className="pb-3 text-textSecondary hover:text-primary px-4 transition-colors text-sm">Used</button>
            </div>
            
            {/* Dropdowns Form */}
            <form action="/search" method="GET" className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary ml-1">Make</label>
                <select name="make" className="w-full h-12 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary px-3 text-sm bg-white">
                  <option value="">Select Make</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Nissan">Nissan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary ml-1">Model</label>
                <select name="model" className="w-full h-12 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary px-3 text-sm bg-white">
                  <option value="">Select Model</option>
                  <option value="Allion">Allion</option>
                  <option value="Axio">Axio</option>
                  <option value="Premio">Premio</option>
                  <option value="Civic">Civic</option>
                  <option value="X-Trail">X-Trail</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary ml-1">Year</label>
                <select name="year" className="w-full h-12 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary px-3 text-sm bg-white">
                  <option value="">Any Year</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary ml-1">Max Price</label>
                <select name="price_max" className="w-full h-12 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary px-3 text-sm bg-white">
                  <option value="">Max Price</option>
                  <option value="1500000">BDT ১৫ লক্ষ</option>
                  <option value="2500000">BDT ২৫ লক্ষ</option>
                  <option value="3500000">BDT ৩৫ লক্ষ</option>
                  <option value="5000000">BDT ৫০ লক্ষ</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-textSecondary ml-1">District</label>
                <select name="district" className="w-full h-12 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary px-3 text-sm bg-white">
                  <option value="">All Locations</option>
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Sylhet">Sylhet</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full h-12 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all active:scale-95 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                গাড়ি খুঁজুন
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="py-stack-lg bg-surface border-b border-gray-200">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-gutter">
            {categories.map((cat, idx) => (
              <Link 
                key={idx} 
                href={`/search?body_type=${cat.name}`} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-xl transition-all flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl">{cat.icon}</span>
                </div>
                <h3 className="font-semibold text-textPrimary text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold font-outfit text-textPrimary pl-4 border-l-4 border-primary">
                সেরা ডিল ও ফিচার্ড গাড়ি
              </h2>
              <p className="text-textSecondary text-sm mt-1">
                Garisale-এর বুদ্ধিমত্তা দ্বারা যাচাইকৃত সেরা ও সাশ্রয়ী মূল্যের গাড়িগুলো।
              </p>
            </div>
            <Link 
              href="/search" 
              className="text-primary font-bold hover:underline flex items-center gap-1 text-sm shrink-0"
            >
              সব গাড়ি দেখুন
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {listings.length === 0 ? (
            // Empty/Fallback state displaying mock items if database is empty
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {/* Fallback Card 1 */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-card hover:shadow-xl transition-all hover:-translate-y-1 group">
                <div className="relative aspect-[16/9] bg-gray-200">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1"
                    alt="Toyota Axio"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-deal-greatBg text-deal-great text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Great Deal
                  </span>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">image</span> 6
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-textSecondary">
                    <span>Dhaka · 2 hours ago</span>
                  </div>
                  <h3 className="font-bold text-textPrimary text-base leading-tight line-clamp-1">Toyota Axio 2019</h3>
                  <div className="text-deal-great font-bold text-lg">BDT ১৫,৫০,০০০</div>
                  <div className="flex items-center gap-2 text-xs text-textSecondary border-t pt-3">
                    <span className="bg-gray-100 px-2 py-1 rounded">Used</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">Automatic</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">68k km</span>
                  </div>
                  <button className="w-full border border-deal-great text-deal-great font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-deal-great hover:text-white transition-all text-sm">
                    <span className="material-symbols-outlined text-[18px]">chat</span> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Live API Data Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {listings.map((listing) => {
                const config = getDealRatingConfig(listing.deal_rating);
                const primaryPhoto = listing.photos?.find(p => p.is_primary) || listing.photos?.[0];
                return (
                  <div key={listing.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-card hover:shadow-xl transition-all hover:-translate-y-1 group">
                    <div className="relative aspect-[16/9] bg-gray-100">
                      <img 
                        src={primaryPhoto?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1'} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <span 
                        style={{ color: config.text, backgroundColor: config.bg }}
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm border border-opacity-40"
                      >
                        {config.label}
                      </span>
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">image</span> {listing.photo_count}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-textSecondary">
                        <span>{listing.district}</span>
                      </div>
                      <Link href={`/cars/${listing.slug}`} className="hover:text-primary transition-colors">
                        <h3 className="font-bold text-textPrimary text-base leading-tight line-clamp-1">{listing.title}</h3>
                      </Link>
                      <div className="text-deal-great font-bold text-lg">{formatBDT(listing.asking_price)}</div>
                      <div className="flex items-center gap-2 text-xs text-textSecondary border-t pt-3">
                        <span className="bg-gray-100 px-2 py-1 rounded">Used</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{listing.transmission}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{Math.round(listing.mileage_km / 1000)}k km</span>
                      </div>
                      <Link 
                        href={`https://wa.me/8801700000000?text=I%20am%20interested%20in%20your%20listing%20${encodeURIComponent(listing.title)}`}
                        target="_blank"
                        className="w-full border border-deal-great text-deal-great font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-deal-great hover:text-white transition-all text-sm mt-2 block text-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span> WhatsApp
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Garisale Work Section */}
      <section className="py-16 bg-surface border-t border-gray-200">
        <div className="max-w-container-max mx-auto px-gutter text-center">
          <h2 className="text-3xl font-bold font-outfit text-textPrimary mb-12">
            গ্যারিসেল কেন ব্যবহার করবেন?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <span className="material-symbols-outlined text-5xl text-primary mb-4">verified_user</span>
              <h3 className="text-xl font-bold mb-2">যাচাইকৃত ডিলার ও গাড়ি</h3>
              <p className="text-textSecondary text-sm">
                মার্কেটপ্লেসের প্রতিটি ডিলার ও গাড়ি আমাদের ফিল্ড টিম দ্বারা সরাসরি যাচাইকৃত।
              </p>
            </div>
            <div className="p-6">
              <span className="material-symbols-outlined text-5xl text-primary mb-4">trending_up</span>
              <h3 className="text-xl font-bold mb-2">সঠিক বাজার মূল্য (IMV)</h3>
              <p className="text-textSecondary text-sm">
                Maestro AI দ্বারা গণনাকৃত লাইভ বাজার মূল্যের তুলনামূলক রেটিং দেখে গাড়ি কিনুন নিরাপদে।
              </p>
            </div>
            <div className="p-6">
              <span className="material-symbols-outlined text-5xl text-primary mb-4">support_agent</span>
              <h3 className="text-xl font-bold mb-2">২৪/৭ কাস্টমার সাপোর্ট</h3>
              <p className="text-textSecondary text-sm">
                গাড়ি কেনা বা বেচার যেকোনো ধাপে আমাদের টিম আপনাকে সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সাপোর্ট দিবে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold mb-4 font-outfit">Garisale</h4>
            <p className="text-xs leading-relaxed">
              বাংলাদেশে গাড়ি কেনা এবং বেচার জন্য সবচেয়ে নিরাপদ ও আধুনিক ইন্টেলিজেন্ট মার্কেটপ্লেস।
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">লিঙ্কসমূহ</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search" className="hover:text-white transition-colors">গাড়ি খুঁজুন</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">গাড়ি বিক্রি করুন</Link></li>
              <li><Link href="/value-my-car" className="hover:text-white transition-colors">মূল্য যাচাই</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">অফিসিয়াল পলিসি</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#" className="hover:text-white transition-colors">প্রাইভেসি পলিসি</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">শর্তাবলী ও নিয়মাবলী</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">যোগাযোগ</h4>
            <p className="text-xs">
              ইমেল: support@garisale.com<br />
              ফোন: 01611-613952
            </p>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-gutter border-t border-gray-800 mt-8 pt-8 text-center text-xs">
          <p>© ২০২৬ Garisale. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
}
