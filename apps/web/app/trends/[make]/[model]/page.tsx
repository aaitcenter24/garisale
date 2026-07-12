import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PriceTrendsDashboard from './PriceTrendsDashboard';
import { MOCK_LISTINGS, MarketplaceListing } from '../../../../components/mockData';

export const revalidate = 300; // ISR revalidate: 300 seconds

interface TrendDataPoint {
  date: string;
  avg_price: number;
  median_price: number;
  listing_count: number;
}

// Fetch price trends from API
async function getPriceTrends(make: string, model: string): Promise<TrendDataPoint[]> {
  const apiUrl = `https://api.garisale.com/api/v1/public/marketplace/imv/trends?make=${make}&model=${model}&months=12`;
  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error();
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching trends from API, generating dynamic mock fallback:', error);
    // Generate 12 months of mock trend points for the selected make and model
    const mockTrends = [];
    const basePriceMap: Record<string, number> = {
      axio: 1850000,
      premio: 2850000,
      allion: 2650000,
      civic: 3650000,
      xtrail: 2550000,
      harrier: 5200000,
    };
    const basePrice = basePriceMap[model.toLowerCase()] || 2000000;

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);

      const fluctuation = (Math.sin(i) * 0.04) + (Math.cos(i * 2) * 0.015);
      const avg = Math.round(basePrice * (1 + fluctuation));
      mockTrends.push({
        date: date.toISOString().split('T')[0],
        avg_price: avg,
        median_price: Math.round(avg * 0.98),
        listing_count: 5 + Math.round(Math.abs(Math.sin(i) * 12)),
      });
    }
    return mockTrends;
  }
}

// Fetch active listings for this make/model
async function getModelListings(make: string, model: string): Promise<MarketplaceListing[]> {
  const apiUrl = `https://api.garisale.com/api/v1/public/marketplace/search?make=${make}`;
  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const result = await res.json();
    const list = result.success ? result.data : [];
    return list.filter((l: any) => l.model.toLowerCase() === model.toLowerCase());
  } catch {
    return MOCK_LISTINGS.filter(
      l => l.make.toLowerCase() === make.toLowerCase() && l.model.toLowerCase() === model.toLowerCase()
    );
  }
}

export async function generateStaticParams() {
  const pairs = MOCK_LISTINGS.map(l => ({
    make: l.make.toLowerCase(),
    model: l.model.toLowerCase(),
  }));

  const uniquePairs = Array.from(
    new Set(pairs.map(p => `${p.make}/${p.model}`))
  ).map(str => {
    const [make, model] = str.split('/');
    return { make, model };
  });

  return uniquePairs;
}

export default async function PriceTrendsPage({ params }: { params: { make: string; model: string } }) {
  const make = params.make.toLowerCase();
  const model = params.model.toLowerCase();

  const match = MOCK_LISTINGS.find(
    l => l.make.toLowerCase() === make && l.model.toLowerCase() === model
  );
  const displayMake = match ? match.make : make.charAt(0).toUpperCase() + make.slice(1);
  const displayModel = match ? match.model : model.charAt(0).toUpperCase() + model.slice(1);

  const trendData = await getPriceTrends(displayMake, displayModel);
  const activeListings = await getModelListings(displayMake, displayModel);

  if (trendData.length === 0) {
    notFound();
  }

  const seoTitle = `${displayMake} ${displayModel} বাজার মূল্য বিশ্লেষণ ও ট্রেন্ডস - Garisale`;
  const seoDescription = `${displayMake} ${displayModel} গাড়ির ঐতিহাসিক গড় বাজার মূল্য, মাসিক পরিবর্তনের ট্রেন্ডস চার্ট এবং বর্তমান মার্কেট সিগন্যাল যাচাই করুন।`;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />

      {/* Header */}
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

      {/* Main Container */}
      <main className="max-w-container-max mx-auto px-gutter py-8 space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-textSecondary font-semibold">
          <Link href="/" className="hover:text-primary transition-colors">হোম</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/search" className="hover:text-primary transition-colors">গাড়ি খুঁজুন</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-textPrimary">{displayMake} {displayModel} দামের ট্রেন্ডস</span>
        </nav>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-textPrimary font-outfit leading-tight">
            {displayMake} {displayModel} বাজার মূল্য ট্রেন্ডস
          </h1>
          <p className="text-sm text-textSecondary font-medium">
            Maestro AI দ্বারা সংগৃহীত লাইভ মার্কেট ডেটা চার্ট ও ঐতিহাসিক গড় মূল্যের তালিকা।
          </p>
        </div>

        {/* Interactive Dashboard client component */}
        <PriceTrendsDashboard
          make={displayMake}
          model={displayModel}
          trendData={trendData}
          activeListings={activeListings}
        />

        {/* Listings for this model section */}
        {activeListings.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-textPrimary pl-3 border-l-4 border-primary">
                মার্কেটপ্লেসে {displayMake} {displayModel} গাড়ি সমুহ
              </h2>
              <Link href={`/search?make=${displayMake}&model=${displayModel}`} className="text-primary text-sm font-bold hover:underline">
                সব গাড়ি দেখুন →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeListings.slice(0, 4).map((listing) => {
                // BDT formatting function following BD standards
                const formattedPrice = new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'BDT',
                  maximumFractionDigits: 0,
                }).format(listing.asking_price).replace('INR', 'BDT').replace('Rs', 'BDT');

                const primaryPhoto = listing.photos?.find(p => p.is_primary) || listing.photos?.[0];
                return (
                  <div key={listing.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-card hover:shadow-xl transition-all group">
                    <div className="relative aspect-[16/9] bg-gray-100">
                      <img 
                        src={primaryPhoto?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1'} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <Link href={`/cars/${listing.slug}`} className="hover:text-primary transition-colors">
                        <h3 className="font-bold text-textPrimary text-sm leading-tight line-clamp-1">{listing.title}</h3>
                      </Link>
                      <div className="text-deal-great font-bold text-base">{formattedPrice}</div>
                      <div className="text-[10px] text-textSecondary uppercase font-bold">
                        {listing.district} · {listing.year}
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
