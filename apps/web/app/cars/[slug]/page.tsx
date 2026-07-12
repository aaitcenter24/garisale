import React from 'react';
import Link from 'next/link';
import Gallery from '../../../components/Gallery';
import LeadForm from '../../../components/LeadForm';

export const revalidate = 300; // ISR revalidate: 300 seconds

interface VehiclePhoto {
  id: string;
  url: string;
  is_primary: boolean;
}

interface Dealership {
  id: string;
  business_name: string;
  slug: string;
  logo_url?: string;
  rating?: number;
  review_count: number;
  created_at: string;
  phone: string;
  whatsapp_number?: string;
}

interface MarketplaceListing {
  id: string;
  slug: string;
  title: string;
  description?: string;
  asking_price: number;
  original_price?: number;
  price_drop_flag: boolean;
  deal_rating: 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced' | 'unrated';
  deal_score?: number;
  year: number;
  make: string;
  model: string;
  variant?: string;
  body_type?: string;
  engine_cc?: number;
  fuel_type: string;
  transmission: string;
  condition: string;
  mileage_km: number;
  district: string;
  photo_count: number;
  photos: VehiclePhoto[];
  dealership?: Dealership;
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

// High-fidelity mock vehicle fallback for testing/preview when API has no entries yet
const MOCK_LISTING: MarketplaceListing = {
  id: 'mock-vehicle-id-12345',
  slug: '2019-toyota-axio-dhaka-xk7p2',
  title: 'Toyota Axio G Grade 2019 Pearl White',
  description: 'Toyota Axio G Grade 2019 model in pristine condition. Pearl white exterior with clean beige interior. Single hand driven, well maintained, octan & hybrid driven. Dynamic suspension, soft touch AC panel, push start, HID projection headlights, reverse camera, lane assist, collision mitigation system. No accident history, all papers are up-to-date.',
  asking_price: 1850000,
  original_price: 1900000,
  price_drop_flag: true,
  deal_rating: 'great_deal',
  deal_score: -0.09,
  year: 2019,
  make: 'Toyota',
  model: 'Axio',
  variant: 'G Grade',
  body_type: 'Sedan',
  engine_cc: 1500,
  fuel_type: 'hybrid',
  transmission: 'automatic',
  condition: 'used',
  mileage_km: 45000,
  district: 'Dhaka',
  photo_count: 5,
  photos: [
    {
      id: 'photo-1',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpsmL_ZTcyRjRLkXwM2Ia3BddzCQJ6lOLxfAwInwkAvpRWUty6NSK48R38nfzjdP0iKXJ9r-4R9sQPmGz-OvUISaeD-tqFgHJpM7GJ_DjUGXzmlPghJOYfQ7EUe6_BkSloQwWnuI9maBw-UiBscmr5CAzpSrYLbLc2uAHdJjKv4TP23S1hKjwR3a5Q1TeMF0T97WlWIhXDYSRtBau_dNbs_rWlFLqndY8Mkh_lwLy_EF7WhAOaPvIOt-FH4e_H_CSRrkiHzfuzCSoi',
      is_primary: true,
    },
    {
      id: 'photo-2',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPka1MBzclAOMn24NPZ2dgkndFsd6fPCq_blD2TrnM9mnRTxJgDPsTzOqVRJ85doXPILFOTt437RaTOVNb7nnqTgWJq5Z8y8ML6pNs5cUeNiPdyeFnrwu02LXF37oajriFJgxBDIbaafyDOpQI-1CPz33ctzy6TIvKeTa61wjADaRGujY2zIGSM4D1FlRAv6o94FJE6UA1R4slkMKQBbnPl1D3m7VDRFAlLfK7GLkOjLoqFIvV54ML9ki5IE5clpC70NK5RtEBjPoN',
      is_primary: false,
    },
    {
      id: 'photo-3',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxAUxM-k69IU5yfXjeiu14FSrJDyzv84Q2ScouKOQGu6MueVRZO2Y-lQqHtTIwD2GQmAD6nQVSBshANoNumAdjK43yZbtex1BgVEtwoaSh8X_tE8cIxKaDRNNnGunelyNqujF2e6wPKMzJWu6VHxeH6E0Ude9RlSXCxqfd2aJIUbTIMM1a6F0zAqQQeGJzvo6nBS9hXhw3HHCqgm8FbV7U7xyC9-K__6CHVAI3bl-BHybTn_lLWdbGVfJua_mpD1XWZSQxn-29GF8F',
      is_primary: false,
    },
    {
      id: 'photo-4',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKpDWoEYFizlNCPgePCoDlowSr2Tob5a0kDrtFm0E2RZksBwl5aAjuJLD-I_7jETttg84sHdKaxjimqohU77NmFNCf6Va3nm4u2uThbYuh4EcPGzsDaxsc-tkL81lcmUyWpDvETvgWI7JS2aySGVjH8uMFFBXrVq5J7N7C2JFs2Z-zoq8uK2oUSF4kRKQlnXs3K2NIblDbguRTxWw0g-a40y85iLrO-hW3QuDfEX4W47UnwLOad77pHw5YIREPWX4gOm15ds50qCay',
      is_primary: false,
    },
  ],
  dealership: {
    id: 'mock-dealer-id',
    business_name: 'Dhaka Premium Motors',
    slug: 'dhaka-premium-motors',
    logo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6jd0uenEKgpikr-xJyUQUpeW8wpnarwZNAzFFYSG0ckrUZNFeGSqZ9Q_oozanHDtVLvmmhTI9Vk-6K6Dqmifa55SRG65M-usTWvM2Z41s4v7SGXxwQw4qqb2A_f2wsiLDoSJI5YBd9SAwlGy-Fr_86Ttu4g09HGkzzzx3sQyThkXuhW-Ue7CS2dqGoOA-fd4IdSdF8dZX65R9dYH243RziZYf7awl8GcyKrKBdd3Ti0Tzj_34_2g6Q6X3hJPTFKUeORpDYupavcy8',
    rating: 4.8,
    review_count: 36,
    created_at: '2018-06-15T00:00:00Z',
    phone: '01611-613952',
    whatsapp_number: '8801611613952',
  }
};

// Fetch single listing by slug from API
async function getListing(slug: string): Promise<MarketplaceListing | null> {
  const apiUrl = `https://api.garisale.com/api/v1/public/marketplace/listings/${slug}`;
  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      }
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching vehicle detail page:', error);
    return null;
  }
}

// Fetch similar listings from API
async function getSimilarListings(make: string, excludeId: string): Promise<MarketplaceListing[]> {
  const apiUrl = `https://api.garisale.com/api/v1/public/marketplace/search?make=${make}`;
  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const result = await res.json();
    const list = result.success ? result.data : [];
    return list.filter((l: any) => l.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch('https://api.garisale.com/api/v1/public/marketplace/search');
    if (!res.ok) return [];
    const result = await res.json();
    const listings = result.success ? result.data : [];
    return listings.map((l: any) => ({ slug: l.slug }));
  } catch {
    return [];
  }
}

export default async function VehicleDetailPage({ params }: { params: { slug: string } }) {
  // Fetch from API, fall back to high-fidelity mock listing for demo/testing
  let listing = await getListing(params.slug);
  if (!listing) {
    listing = MOCK_LISTING;
  }

  const similarListings = await getSimilarListings(listing.make, listing.id);
  const ratingConfig = getDealRatingConfig(listing.deal_rating);

  // Calculate IMV Slider Position based on deal_score (representing deviation from market average)
  const deviation = Number(listing.deal_score || 0);
  const sliderPosition = Math.max(0, Math.min(100, 50 + (deviation * 333)));

  // Schema.org structured JSON-LD data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    'name': listing.title,
    'description': listing.description || `Details for ${listing.title}`,
    'image': listing.photos?.map(p => p.url) || [],
    'offers': {
      '@type': 'Offer',
      'price': listing.asking_price,
      'priceCurrency': 'BDT',
      'availability': 'https://schema.org/InStock',
    },
    'brand': {
      '@type': 'Brand',
      'name': listing.make,
    },
    'model': listing.model,
    'productionDate': listing.year,
    'vehicleTransmission': listing.transmission,
    'fuelType': listing.fuel_type,
    'mileageFromOdometer': {
      '@type': 'QuantitativeValue',
      'value': listing.mileage_km,
      'unitCode': 'KMT',
    },
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Schema.org Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 h-20 flex items-center sticky top-0 z-40 shadow-sm">
        <nav className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto">
          <Link href="/" className="text-2xl font-bold text-textPrimary font-outfit">
            <span className="text-primary">Garisale</span>
          </Link>
          <div className="hidden lg:flex items-center gap-stack-lg text-sm font-semibold text-textSecondary">
            <Link href="/" className="hover:text-primary transition-colors py-2">Home</Link>
            <Link href="/search" className="hover:text-primary transition-colors py-2">গাড়ি খুঁজুন</Link>
            <Link href="/value-my-car" className="hover:text-primary transition-colors py-2">মূল্য যাচাই (IMV)</Link>
            <Link href="/sell" className="hover:text-primary transition-colors py-2">গাড়ি বিক্রি করুন</Link>
          </div>
          <Link 
            href="/sell"
            className="bg-[#16A34A] text-white px-5 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-sm flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            গাড়ি বিক্রি করুন
          </Link>
        </nav>
      </header>

      {/* Main Grid Container */}
      <main className="max-w-container-max mx-auto px-gutter py-8 space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-textSecondary font-semibold">
          <Link href="/" className="hover:text-primary transition-colors">হোম</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href={`/search?make=${listing.make}`} className="hover:text-primary transition-colors">{listing.make}</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-textPrimary">{listing.model}</span>
        </nav>

        {/* Title and Price Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-outfit text-textPrimary leading-tight">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold text-deal-great font-outfit">
                {formatBDT(listing.asking_price)}
              </span>
              <span className="bg-gray-100 text-textSecondary text-xs px-2.5 py-1 rounded-full font-semibold">
                Negotiable
              </span>
              {listing.deal_rating !== 'unrated' && (
                <div 
                  style={{ color: ratingConfig.text, backgroundColor: ratingConfig.bg }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>{ratingConfig.label}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Row */}
          <div className="flex gap-2">
            <button className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-textSecondary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">favorite</span>
            </button>
            <button className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-textSecondary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (66%) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gallery Wrapper */}
            <Gallery photos={listing.photos} title={listing.title} />

            {/* Quick Key Specs */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-primary text-3xl">speed</span>
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Millage</span>
                <span className="font-bold text-textPrimary text-sm sm:text-base">
                  {listing.mileage_km.toLocaleString()} km
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-primary text-3xl">calendar_today</span>
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Year</span>
                <span className="font-bold text-textPrimary text-sm sm:text-base">{listing.year}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-primary text-3xl">local_gas_station</span>
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Fuel Type</span>
                <span className="font-bold text-textPrimary text-sm sm:text-base capitalize">{listing.fuel_type}</span>
              </div>
            </div>

            {/* Full Specs Table */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-textPrimary">গাড়ির বিস্তারিত বিবরণ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">ব্র্যান্ড</span>
                  <span className="font-semibold text-textPrimary">{listing.make}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">মডেল</span>
                  <span className="font-semibold text-textPrimary">{listing.model}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">ভেরিয়েন্ট</span>
                  <span className="font-semibold text-textPrimary">{listing.variant || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">বডি টাইপ</span>
                  <span className="font-semibold text-textPrimary capitalize">{listing.body_type || 'Sedan'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">ইঞ্জিন ক্ষমতা</span>
                  <span className="font-semibold text-textPrimary">{listing.engine_cc ? `${listing.engine_cc} cc` : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">ট্রান্সমিশন</span>
                  <span className="font-semibold text-textPrimary capitalize">{listing.transmission}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">অবস্থা</span>
                  <span className="font-semibold text-textPrimary capitalize">{listing.condition}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-textSecondary">লোকেশন</span>
                  <span className="font-semibold text-textPrimary">{listing.district}</span>
                </div>
              </div>
            </section>

            {/* Description / Seller Notes */}
            {listing.description && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-textPrimary">বিক্রেতার বিবরণ</h2>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-textSecondary text-sm leading-relaxed whitespace-pre-line">
                  {listing.description}
                </div>
              </section>
            )}

            {/* Static Map Fallback (Resolved Question 2) */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-textPrimary">অবস্থান মানচিত্র</h2>
              <div className="h-64 bg-gray-200 rounded-xl overflow-hidden relative shadow-sm border border-gray-300">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1"
                  alt={`Map location of ${listing.district}`}
                  className="w-full h-full object-cover blur-[1px]"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-lg font-bold text-sm text-textPrimary shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <span>গাড়ির অবস্থান: {listing.district}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Lead Submission Form */}
            <LeadForm listingId={listing.id} dealershipId={listing.dealership?.id} listingTitle={listing.title} />

          </div>

          {/* Right Sticky Sidebar (33%) */}
          <div className="space-y-6">
            
            {/* Sticky Container */}
            <div className="sticky top-24 space-y-6">
              
              {/* IMV Price Analysis Widget */}
              {listing.deal_rating !== 'unrated' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-textPrimary">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    <h3 className="font-bold text-base">IMV বাজার মূল্য বিশ্লেষণ</h3>
                  </div>
                  
                  {/* Slider Bar */}
                  <div className="relative pt-4">
                    <div className="h-2 w-full rounded-full bg-gray-200 flex overflow-hidden">
                      <div className="w-[30%] bg-deal-great" />
                      <div className="w-[40%] bg-deal-fair" />
                      <div className="w-[30%] bg-deal-overpriced" />
                    </div>
                    {/* Position Pointer */}
                    <div 
                      style={{ left: `${sliderPosition}%` }}
                      className="absolute top-2.5 -ml-1 w-2.5 h-5 bg-primary border-2 border-white rounded-full shadow-md transition-all duration-300"
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-bold text-textSecondary uppercase">
                    <span>Low Price</span>
                    <span>Average</span>
                    <span>High Price</span>
                  </div>

                  {/* Deviation Insight Text */}
                  <p className="text-xs text-textSecondary">
                    গাড়িটি বাজারের গড় মূল্য থেকে{' '}
                    <span className="font-bold text-primary">
                      {deviation < 0 
                        ? `${formatBDT(Math.abs(deviation * listing.asking_price))} কম` 
                        : `${formatBDT(deviation * listing.asking_price)} বেশি`
                      }
                    </span>
                    । এটি একটি <span style={{ color: ratingConfig.text }} className="font-bold">{ratingConfig.label}</span>।
                  </p>
                </div>
              )}

              {/* Dealer Profile Card */}
              {listing.dealership ? (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shrink-0">
                      <img 
                        src={listing.dealership.logo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6jd0uenEKgpikr-xJyUQUpeW8wpnarwZNAzFFYSG0ckrUZNFeGSqZ9Q_oozanHDtVLvmmhTI9Vk-6K6Dqmifa55SRG65M-usTWvM2Z41s4v7SGXxwQw4qqb2A_f2wsiLDoSJI5YBd9SAwlGy-Fr_86Ttu4g09HGkzzzx3sQyThkXuhW-Ue7CS2dqGoOA-fd4IdSdF8dZX65R9dYH243RziZYf7awl8GcyKrKBdd3Ti0Tzj_34_2g6Q6X3hJPTFKUeORpDYupavcy8'} 
                        alt={listing.dealership.business_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Link 
                          href={`/dealers/${listing.dealership.slug}`}
                          className="font-bold text-textPrimary hover:text-primary transition-colors text-base"
                        >
                          {listing.dealership.business_name}
                        </Link>
                        <span className="material-symbols-outlined text-primary text-sm">verified</span>
                      </div>
                      <p className="text-[10px] text-textSecondary uppercase tracking-wider font-semibold mt-0.5">
                        Verified Dealer
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center border-y border-gray-100 py-3">
                    <div>
                      <span className="block font-bold text-textPrimary text-base">
                        {listing.dealership.rating ? Number(listing.dealership.rating).toFixed(1) : '4.8'} ★
                      </span>
                      <span className="text-[10px] text-textSecondary">ডিলার রেটিং</span>
                    </div>
                    <div>
                      <span className="block font-bold text-textPrimary text-base">
                        {listing.dealership.review_count || 12}
                      </span>
                      <span className="text-[10px] text-textSecondary">রিভিউ সংখ্যা</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2">
                    <Link
                      href={`https://wa.me/${listing.dealership.whatsapp_number || '8801711234567'}?text=I%20am%20interested%20in%20your%20listing%20${encodeURIComponent(listing.title)}`}
                      target="_blank"
                      className="w-full bg-[#16A34A] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      WhatsApp এ চ্যাট করুন
                    </Link>
                    <Link
                      href={`tel:${listing.dealership.phone}`}
                      className="w-full bg-white border border-gray-300 text-textPrimary py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      কল করুন: {listing.dealership.phone}
                    </Link>
                  </div>
                </div>
              ) : (
                // Private Seller Fallback
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-textSecondary">account_circle</span>
                    <div>
                      <h4 className="font-bold text-textPrimary">ব্যক্তিগত বিক্রেতা</h4>
                      <p className="text-xs text-textSecondary">গাড়ির মালিক নিজে বিক্রি করছেন</p>
                    </div>
                  </div>
                  <Link
                    href="tel:01700000000"
                    className="w-full bg-white border border-gray-300 text-textPrimary py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-sm shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    কল করুন
                  </Link>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Similar Cars Section */}
        {similarListings.length > 0 && (
          <section className="border-t border-gray-200 pt-12 space-y-6">
            <h2 className="text-2xl font-bold font-outfit text-textPrimary">এই ধরণের আরও গাড়ি</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarListings.map((sim) => {
                const simConfig = getDealRatingConfig(sim.deal_rating);
                const primaryPhoto = sim.photos?.find(p => p.is_primary) || sim.photos?.[0];
                return (
                  <div key={sim.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-card hover:shadow-xl transition-all hover:-translate-y-1 group">
                    <div className="relative aspect-[16/9] bg-gray-100">
                      <img 
                        src={primaryPhoto?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1'} 
                        alt={sim.title}
                        className="w-full h-full object-cover"
                      />
                      <span 
                        style={{ color: simConfig.text, backgroundColor: simConfig.bg }}
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm border border-opacity-40"
                      >
                        {simConfig.label}
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <Link href={`/cars/${sim.slug}`} className="hover:text-primary transition-colors">
                        <h3 className="font-bold text-textPrimary text-sm leading-tight line-clamp-1">{sim.title}</h3>
                      </Link>
                      <div className="text-deal-great font-bold text-base">{formatBDT(sim.asking_price)}</div>
                      <div className="text-[10px] text-textSecondary uppercase font-bold">
                        {sim.district} · {sim.year}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
