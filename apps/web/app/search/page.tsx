'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

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
  body_type?: string;
  fuel_type?: string;
  created_at: string;
}

// BDT formatting function following BD standards
function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', 'BDT').replace('Rs', 'BDT');
}

// Auto conversion of Bangla digits (০-৯) to English digits (0-9)
function convertBanglaToEnglish(str: string): string {
  const banglaDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (char) => banglaDigits[char as keyof typeof banglaDigits] || char);
}

// Convert English numbers to Bangla digits for UI display
function convertEnglishToBangla(numStr: string | number): string {
  const engToBn: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(numStr).split('').map(char => engToBn[char] || char).join('');
}

// Helper to determine deal rating styles based on Section 2.7
function getDealRatingConfig(rating: MarketplaceListing['deal_rating']) {
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
      return { text: '#9CA3AF', bg: '#F3F4F6', label: 'No Rating' };
  }
}

function SearchPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search parameters state synced with URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '');
  const [selectedBodyType, setSelectedBodyType] = useState(searchParams.get('body_type') || '');
  const [selectedFuelType, setSelectedFuelType] = useState(searchParams.get('fuel_type') || '');
  const [priceMaxInput, setPriceMaxInput] = useState(searchParams.get('price_max') || '');
  const [mileageMaxInput, setMileageMaxInput] = useState(searchParams.get('mileage_max') || '');
  const [selectedDealRatings, setSelectedDealRatings] = useState<string[]>(
    searchParams.get('deal_rating')?.split(',').filter(Boolean) || []
  );
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'best_deal');

  // Mobile Bottom Sheet toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync state with URL params when URL change
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedMake(searchParams.get('make') || '');
    setSelectedModel(searchParams.get('model') || '');
    setSelectedDistrict(searchParams.get('district') || '');
    setSelectedCondition(searchParams.get('condition') || '');
    setSelectedBodyType(searchParams.get('body_type') || '');
    setSelectedFuelType(searchParams.get('fuel_type') || '');
    setPriceMaxInput(searchParams.get('price_max') || '');
    setMileageMaxInput(searchParams.get('mileage_max') || '');
    setSelectedDealRatings(searchParams.get('deal_rating')?.split(',').filter(Boolean) || []);
    setSortOption(searchParams.get('sort') || 'best_deal');
  }, [searchParams]);

  // Sync filters back to URL
  const updateUrlParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Convert BDT input with Bangla auto-conversion
  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertBanglaToEnglish(e.target.value);
    setPriceMaxInput(converted);
    updateUrlParams({ price_max: converted || null });
  };

  const handleMileageMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertBanglaToEnglish(e.target.value);
    setMileageMaxInput(converted);
    updateUrlParams({ mileage_max: converted || null });
  };

  // Fetch using TanStack Query
  const { data: listings = [], isLoading, error } = useQuery<MarketplaceListing[]>({
    queryKey: ['marketplaceSearch', searchQuery, selectedMake, selectedDistrict, selectedCondition, selectedBodyType, selectedFuelType, priceMaxInput, mileageMaxInput, selectedDealRatings.join(','), sortOption],
    queryFn: async () => {
      const url = new URL('https://api.garisale.com/api/v1/public/marketplace/search');
      if (searchQuery) url.searchParams.append('q', searchQuery);
      if (selectedMake) url.searchParams.append('make', selectedMake);
      if (selectedDistrict) url.searchParams.append('district', selectedDistrict);
      
      const res = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('API fetch failed');
      const result = await res.json();
      return result.success ? result.data : [];
    }
  });

  // Client side filtering & sorting fallback for params MeiliSearch doesn't fully index in mock db mode
  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];

    // Filter by model
    if (selectedModel) {
      result = result.filter(item => item.model?.toLowerCase() === selectedModel.toLowerCase());
    }

    // Filter by body type
    if (selectedBodyType) {
      result = result.filter(item => item.body_type?.toLowerCase() === selectedBodyType.toLowerCase());
    }

    // Filter by fuel type
    if (selectedFuelType) {
      result = result.filter(item => item.fuel_type?.toLowerCase() === selectedFuelType.toLowerCase());
    }

    // Filter by price max
    if (priceMaxInput) {
      const maxPrice = Number(priceMaxInput);
      if (!isNaN(maxPrice)) {
        result = result.filter(item => item.asking_price <= maxPrice);
      }
    }

    // Filter by mileage max
    if (mileageMaxInput) {
      const maxMileage = Number(mileageMaxInput);
      if (!isNaN(maxMileage)) {
        result = result.filter(item => item.mileage_km <= maxMileage);
      }
    }

    // Filter by deal ratings
    if (selectedDealRatings.length > 0) {
      result = result.filter(item => selectedDealRatings.includes(item.deal_rating));
    }

    // Sort options
    if (sortOption === 'price_asc') {
      result.sort((a, b) => a.asking_price - b.asking_price);
    } else if (sortOption === 'price_desc') {
      result.sort((a, b) => b.asking_price - a.asking_price);
    } else if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Default / Best Deal: Sort by great deal -> good deal -> fair price -> others
      const ratingWeight = { great_deal: 4, good_deal: 3, fair_price: 2, unrated: 1, overpriced: 0 };
      result.sort((a, b) => (ratingWeight[b.deal_rating] || 0) - (ratingWeight[a.deal_rating] || 0));
    }

    return result;
  }, [listings, selectedModel, selectedBodyType, selectedFuelType, priceMaxInput, mileageMaxInput, selectedDealRatings, sortOption]);

  // Calculate dynamic facet counts based on listings
  const facets = useMemo(() => {
    const makeCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};
    const bodyCounts: Record<string, number> = {};
    const ratingCounts: Record<string, number> = {};

    listings.forEach(item => {
      makeCounts[item.make] = (makeCounts[item.make] || 0) + 1;
      districtCounts[item.district] = (districtCounts[item.district] || 0) + 1;
      if (item.model) modelCounts[item.model] = (modelCounts[item.model] || 0) + 1;
      if (item.body_type) bodyCounts[item.body_type] = (bodyCounts[item.body_type] || 0) + 1;
      ratingCounts[item.deal_rating] = (ratingCounts[item.deal_rating] || 0) + 1;
    });

    return { makeCounts, modelCounts, districtCounts, bodyCounts, ratingCounts };
  }, [listings]);

  const handleRatingCheckboxChange = (rating: string) => {
    let nextRatings = [...selectedDealRatings];
    if (nextRatings.includes(rating)) {
      nextRatings = nextRatings.filter(r => r !== rating);
    } else {
      nextRatings.push(rating);
    }
    setSelectedDealRatings(nextRatings);
    updateUrlParams({ deal_rating: nextRatings.join(',') || null });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedMake('');
    setSelectedModel('');
    setSelectedDistrict('');
    setSelectedBodyType('');
    setSelectedFuelType('');
    setPriceMaxInput('');
    setMileageMaxInput('');
    setSelectedDealRatings([]);
    setSortOption('best_deal');
    router.push(pathname);
  };

  // Sidebar components rendering helper
  const renderFilters = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">গাড়ি খুঁজুন</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Toyota Axio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateUrlParams({ q: searchQuery || null });
              }
            }}
            className="w-full h-10 border border-gray-300 rounded-lg pl-3 pr-10 text-sm focus:ring-primary focus:border-primary bg-white"
          />
          <button 
            onClick={() => updateUrlParams({ q: searchQuery || null })}
            className="absolute right-2 top-2 text-textSecondary hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>
      </div>

      {/* Make Filter */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">ব্র্যান্ড</h4>
        <select
          value={selectedMake}
          onChange={(e) => {
            setSelectedMake(e.target.value);
            setSelectedModel(''); // reset model when make change
            updateUrlParams({ make: e.target.value || null, model: null });
          }}
          className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white"
        >
          <option value="">All Makes</option>
          <option value="Toyota">Toyota</option>
          <option value="Honda">Honda</option>
          <option value="Nissan">Nissan</option>
        </select>
      </div>

      {/* Model Filter */}
      {selectedMake && (
        <div>
          <h4 className="text-sm font-bold text-textPrimary mb-2">মডেল</h4>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              updateUrlParams({ model: e.target.value || null });
            }}
            className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white"
          >
            <option value="">All Models</option>
            {selectedMake === 'Toyota' && (
              <>
                <option value="Axio">Axio</option>
                <option value="Allion">Allion</option>
                <option value="Premio">Premio</option>
              </>
            )}
            {selectedMake === 'Honda' && <option value="Civic">Civic</option>}
            {selectedMake === 'Nissan' && <option value="X-Trail">X-Trail</option>}
          </select>
        </div>
      )}

      {/* Location Filter */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">লোকেশন</h4>
        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            updateUrlParams({ district: e.target.value || null });
          }}
          className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white"
        >
          <option value="">All Locations</option>
          <option value="Dhaka">Dhaka</option>
          <option value="Chattogram">Chattogram</option>
          <option value="Sylhet">Sylhet</option>
        </select>
      </div>

      {/* Price Slider/Input */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">সর্বোচ্চ বাজেট (BDT)</h4>
        <input
          type="text"
          placeholder="যেমন: ১৫০০০০০ (15 Lakh)"
          value={priceMaxInput}
          onChange={handlePriceMaxChange}
          className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-primary focus:border-primary bg-white"
        />
        {priceMaxInput && !isNaN(Number(priceMaxInput)) && (
          <span className="text-xs text-primary font-bold mt-1 block">
            {formatBDT(Number(priceMaxInput))}
          </span>
        )}
      </div>

      {/* Mileage Input */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">সর্বোচ্চ মাইলেজ (KM)</h4>
        <input
          type="text"
          placeholder="যেমন: ৮০০০০"
          value={mileageMaxInput}
          onChange={handleMileageMaxChange}
          className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-primary focus:border-primary bg-white"
        />
      </div>

      {/* IMV Deal Rating Filter */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">ডিল রেটিং (IMV)</h4>
        <div className="space-y-2">
          {[
            { value: 'great_deal', label: 'Great Deal', color: 'text-green-600' },
            { value: 'good_deal', label: 'Good Deal', color: 'text-teal-600' },
            { value: 'fair_price', label: 'Fair Price', color: 'text-amber-600' },
            { value: 'overpriced', label: 'Overpriced', color: 'text-red-600' },
          ].map((rating) => {
            const count = facets.ratingCounts[rating.value] || 0;
            return (
              <label key={rating.value} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedDealRatings.includes(rating.value)}
                  onChange={() => handleRatingCheckboxChange(rating.value)}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span className={rating.color}>{rating.label}</span>
                <span className="text-gray-400">({convertEnglishToBangla(count)})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Clear Button */}
      <button 
        onClick={clearAllFilters}
        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-textSecondary font-bold rounded-lg text-sm transition-all"
      >
        ফিল্টার রিসেট করুন
      </button>
    </div>
  );

  return (
    <>
      {/* Main Content Area */}
      <main className="max-w-container-max mx-auto px-gutter py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Left Sidebar Filters */}
          <aside className="w-64 bg-white p-6 rounded-xl border border-gray-200 shadow-sm shrink-0 hidden lg:block self-start">
            <h3 className="font-bold text-lg text-textPrimary mb-6 border-b pb-3">ফিল্টারসমূহ</h3>
            {renderFilters()}
          </aside>

          {/* Right Listings View */}
          <section className="flex-1 space-y-6">
            
            {/* Top Toolbar / Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div>
                <span className="text-base font-bold text-textPrimary">
                  {convertEnglishToBangla(filteredAndSortedListings.length)}টি গাড়ি পাওয়া গেছে
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Toggle */}
                <button 
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 border border-gray-300 rounded-lg px-4 text-sm font-semibold bg-white"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  ফিল্টার
                </button>
                {/* Sort Option */}
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    updateUrlParams({ sort: e.target.value });
                  }}
                  className="flex-1 sm:flex-none h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white font-semibold"
                >
                  <option value="best_deal">Best Deal</option>
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {isLoading ? (
              // Skeleton Loader Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-card animate-pulse">
                    <div className="aspect-[16/9] bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-6 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 border-t pt-3" />
                      <div className="h-10 bg-gray-200 rounded w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedListings.length === 0 ? (
              // Empty State
              <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center max-w-md mx-auto space-y-4">
                <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
                <h3 className="text-xl font-bold text-textPrimary">কোনো গাড়ি পাওয়া যায়নি</h3>
                <p className="text-textSecondary text-sm">
                  আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো গাড়ি পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  ফিল্টার পরিবর্তন করুন
                </button>
              </div>
            ) : (
              // Listings Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedListings.map((listing) => {
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
          </section>

        </div>
      </main>

      {/* Mobile Bottom Sheet Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:hidden">
          <div className="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-textPrimary">ফিল্টারসমূহ</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-textSecondary hover:text-textPrimary"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            {renderFilters()}
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg text-sm transition-all"
            >
              ফলাফল দেখুন
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 h-20 flex items-center sticky top-0 z-40 shadow-sm">
        <nav className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto">
          <Link href="/" className="text-2xl font-bold text-textPrimary font-outfit">
            <span className="text-primary">Garisale</span>
          </Link>
          <div className="hidden lg:flex items-center gap-stack-lg text-sm font-semibold text-textSecondary">
            <Link href="/" className="hover:text-primary transition-colors py-2">Home</Link>
            <Link href="/search" className="text-primary border-b-2 border-primary font-bold py-2">গাড়ি খুঁজুন</Link>
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

      <Suspense fallback={
        <div className="max-w-container-max mx-auto px-gutter py-12 text-center text-textSecondary font-semibold">
          লোডিং হচ্ছে...
        </div>
      }>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
