'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MOCK_LISTINGS, MarketplaceListing } from '../../../components/mockData';

interface MakeSearchContentWrapperProps {
  make: string;
}

function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '৳ ').replace('Rs', '৳ ');
}

function convertBanglaToEnglish(str: string): string {
  const banglaDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (char) => banglaDigits[char as keyof typeof banglaDigits] || char);
}

function convertEnglishToBangla(numStr: string | number): string {
  const engToBn: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(numStr).split('').map(char => engToBn[char] || char).join('');
}

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

export default function MakeSearchContentWrapper({ make }: MakeSearchContentWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
  const [priceMaxInput, setPriceMaxInput] = useState(searchParams.get('price_max') || '');
  const [mileageMaxInput, setMileageMaxInput] = useState(searchParams.get('mileage_max') || '');
  const [selectedDealRatings, setSelectedDealRatings] = useState<string[]>(
    searchParams.get('deal_rating')?.split(',').filter(Boolean) || []
  );
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'best_deal');

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedModel(searchParams.get('model') || '');
    setSelectedDistrict(searchParams.get('district') || '');
    setPriceMaxInput(searchParams.get('price_max') || '');
    setMileageMaxInput(searchParams.get('mileage_max') || '');
    setSelectedDealRatings(searchParams.get('deal_rating')?.split(',').filter(Boolean) || []);
    setSortOption(searchParams.get('sort') || 'best_deal');
  }, [searchParams]);

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

  // Fetch listings for this make
  const { data: listings = [], isLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ['makeSearch', make, searchQuery, selectedModel, selectedDistrict, priceMaxInput, mileageMaxInput, selectedDealRatings.join(','), sortOption],
    queryFn: async () => {
      const url = new URL('https://api.garisale.com/api/v1/public/marketplace/search');
      url.searchParams.append('make', make);
      if (searchQuery) url.searchParams.append('q', searchQuery);
      if (selectedModel) url.searchParams.append('model', selectedModel);
      if (selectedDistrict) url.searchParams.append('district', selectedDistrict);

      try {
        const res = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('API fetch failed');
        const result = await res.json();
        return result.success && result.data && result.data.length > 0 ? result.data : MOCK_LISTINGS;
      } catch (err) {
        console.warn('Using mock listings make search fallback:', err);
        return MOCK_LISTINGS;
      }
    }
  });

  const filteredAndSortedListings = useMemo(() => {
    let result = listings.filter(item => item.make.toLowerCase() === make.toLowerCase());

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.model.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q)
      );
    }

    if (selectedModel) {
      result = result.filter(item => item.model.toLowerCase() === selectedModel.toLowerCase());
    }

    if (selectedDistrict) {
      result = result.filter(item => item.district.toLowerCase() === selectedDistrict.toLowerCase());
    }

    if (priceMaxInput) {
      const maxPrice = Number(priceMaxInput);
      if (!isNaN(maxPrice)) {
        result = result.filter(item => item.asking_price <= maxPrice);
      }
    }

    if (mileageMaxInput) {
      const maxMileage = Number(mileageMaxInput);
      if (!isNaN(maxMileage)) {
        result = result.filter(item => item.mileage_km <= maxMileage);
      }
    }

    if (selectedDealRatings.length > 0) {
      result = result.filter(item => selectedDealRatings.includes(item.deal_rating));
    }

    // Sorting
    if (sortOption === 'price_asc') {
      result.sort((a, b) => a.asking_price - b.asking_price);
    } else if (sortOption === 'price_desc') {
      result.sort((a, b) => b.asking_price - a.asking_price);
    } else if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      const ratingWeight = { great_deal: 4, good_deal: 3, fair_price: 2, unrated: 1, overpriced: 0 };
      result.sort((a, b) => (ratingWeight[b.deal_rating] || 0) - (ratingWeight[a.deal_rating] || 0));
    }

    return result;
  }, [listings, make, searchQuery, selectedModel, selectedDistrict, priceMaxInput, mileageMaxInput, selectedDealRatings, sortOption]);

  const facets = useMemo(() => {
    const modelCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};
    const ratingCounts: Record<string, number> = {};

    listings
      .filter(item => item.make.toLowerCase() === make.toLowerCase())
      .forEach(item => {
        modelCounts[item.model] = (modelCounts[item.model] || 0) + 1;
        districtCounts[item.district] = (districtCounts[item.district] || 0) + 1;
        ratingCounts[item.deal_rating] = (ratingCounts[item.deal_rating] || 0) + 1;
      });

    return { modelCounts, districtCounts, ratingCounts };
  }, [listings, make]);

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
    setSelectedModel('');
    setSelectedDistrict('');
    setPriceMaxInput('');
    setMileageMaxInput('');
    setSelectedDealRatings([]);
    setSortOption('best_deal');
    router.push(pathname);
  };

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">সার্চ করুন</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="মডেল বা লোকেশন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg pl-3 pr-10 text-sm focus:ring-primary focus:border-primary bg-white"
          />
          <button className="absolute right-2 top-2 text-textSecondary hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>
      </div>

      {/* Model Filter */}
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
          {Object.keys(facets.modelCounts).map((mod) => (
            <option key={mod} value={mod}>
              {mod} ({facets.modelCounts[mod]})
            </option>
          ))}
        </select>
      </div>

      {/* District Filter */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">অবস্থান/জেলা</h4>
        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            updateUrlParams({ district: e.target.value || null });
          }}
          className="w-full h-10 border border-gray-300 rounded-lg px-2 text-sm bg-white"
        >
          <option value="">All Districts</option>
          {['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi'].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Price input */}
      <div>
        <h4 className="text-sm font-bold text-textPrimary mb-2">সর্বোচ্চ বাজেট (BDT)</h4>
        <input
          type="text"
          placeholder="যেমন: ১৫০০০০০"
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

      {/* Mileage input */}
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

      {/* Deal Rating Filter */}
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
    <main className="max-w-container-max mx-auto px-gutter py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-64 bg-white p-6 rounded-xl border border-gray-200 shadow-sm shrink-0 hidden lg:block self-start">
          <h3 className="font-bold text-lg text-textPrimary mb-6 border-b pb-3 font-outfit">ফিল্টারসমূহ</h3>
          {renderFilters()}
        </aside>

        {/* Listings Grid */}
        <section className="flex-1 space-y-6">
          
          {/* Top stats bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <span className="text-base font-bold text-textPrimary">
                {convertEnglishToBangla(filteredAndSortedListings.length)}টি গাড়ি পাওয়া গেছে
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 border border-gray-300 rounded-lg px-4 text-sm font-semibold bg-white"
              >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                ফিল্টার
              </button>
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

          {/* Grid View */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-card animate-pulse">
                  <div className="aspect-[16/9] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 border-t pt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedListings.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center max-w-md mx-auto space-y-4">
              <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
              <h3 className="text-xl font-bold text-textPrimary">কোনো গাড়ি পাওয়া যায়নি</h3>
              <p className="text-textSecondary text-sm">
                আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো {make} গাড়ি পাওয়া যায়নি।
              </p>
              <button 
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedListings.map((listing) => {
                const ratingConfig = getDealRatingConfig(listing.deal_rating);
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
                        style={{ color: ratingConfig.text, backgroundColor: ratingConfig.bg }}
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm border border-opacity-40"
                      >
                        {ratingConfig.label}
                      </span>
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">image</span> {listing.photo_count}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-textSecondary font-semibold">
                        <span>{listing.district}</span>
                      </div>
                      <Link href={`/cars/${listing.slug}`} className="hover:text-primary transition-colors">
                        <h3 className="font-bold text-textPrimary text-base leading-tight line-clamp-1">{listing.title}</h3>
                      </Link>
                      <div className="text-deal-great font-bold text-lg">{formatBDT(listing.asking_price)}</div>
                      <div className="flex items-center gap-2 text-xs text-textSecondary border-t pt-3 font-semibold">
                        <span className="bg-gray-100 px-2 py-1 rounded">Used</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{listing.transmission}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{Math.round(listing.mileage_km / 1000)}k km</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Mobile Filters Sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:hidden animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-textPrimary font-outfit">ফিল্টারসমূহ</h3>
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
    </main>
  );
}
