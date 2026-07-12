import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_LISTINGS, MarketplaceListing, Dealership } from '../../../components/mockData';

export const revalidate = 60; // ISR revalidate: 60 seconds

interface DealerProfileResponse {
  dealer: Dealership;
  listings: MarketplaceListing[];
  listing_count: number;
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

// Fetch dealer profile from API
async function getDealerProfile(slug: string): Promise<DealerProfileResponse | null> {
  const apiUrl = `https://api.garisale.com/api/v1/public/marketplace/dealers/${slug}`;
  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    return null;
  }
}

export async function generateStaticParams() {
  return [
    { slug: 'dhaka-premium-motors' },
    { slug: 'uttara-auto-hub' },
    { slug: 'ctg-auto-gallery' },
    { slug: 'sylhet-auto-express' }
  ];
}

export default async function DealerProfilePage({ params }: { params: { slug: string } }) {
  let profile = await getDealerProfile(params.slug);

  // Fallback to high-fidelity mock dealer profile when API yields nothing
  if (!profile) {
    const matchingListing = MOCK_LISTINGS.find(l => l.dealership?.slug === params.slug) || MOCK_LISTINGS[0];
    if (matchingListing && matchingListing.dealership) {
      const dealer = matchingListing.dealership;
      // Filter mock listings belonging to this dealer
      const dealerListings = MOCK_LISTINGS.filter(l => l.dealership?.id === dealer.id);
      profile = {
        dealer,
        listings: dealerListings,
        listing_count: dealerListings.length,
      };
    }
  }

  if (!profile) {
    notFound();
  }

  const { dealer, listings, listing_count } = profile;
  const joinedYear = new Date(dealer.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero Banner Area */}
      <div className="w-full h-48 md:h-64 bg-slate-300 relative">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1"
          alt="Dealer Banner"
          className="w-full h-full object-cover brightness-[0.85]"
        />
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center md:items-end gap-4 text-white">
            {/* Logo */}
            <div className="w-24 h-24 md:w-28 md:h-28 bg-white border-4 border-white rounded-full overflow-hidden shadow-lg shrink-0 -mb-10 md:-mb-12 relative z-10">
              <img 
                src={dealer.logo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6jd0uenEKgpikr-xJyUQUpeW8wpnarwZNAzFFYSG0ckrUZNFeGSqZ9Q_oozanHDtVLvmmhTI9Vk-6K6Dqmifa55SRG65M-usTWvM2Z41s4v7SGXxwQw4qqb2A_f2wsiLDoSJI5YBd9SAwlGy-Fr_86Ttu4g09HGkzzzx3sQyThkXuhW-Ue7CS2dqGoOA-fd4IdSdF8dZX65R9dYH243RziZYf7awl8GcyKrKBdd3Ti0Tzj_34_2g6Q6X3hJPTFKUeORpDYupavcy8'} 
                alt={dealer.business_name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Name and Stats */}
            <div className="text-center md:text-left space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-1">
                <h1 className="text-2xl md:text-3xl font-bold font-outfit drop-shadow-md">{dealer.business_name}</h1>
                <span className="material-symbols-outlined text-primary bg-white rounded-full p-0.5 text-sm shadow-sm">verified</span>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs md:text-sm text-gray-200 font-semibold drop-shadow-sm">
                <span>{listing_count}টি লিস্টিং সচল</span>
                <span>·</span>
                <span>{dealer.rating ? Number(dealer.rating).toFixed(1) : '4.8'} ★ ({dealer.review_count || 12} রিভিউ)</span>
                <span>·</span>
                <span>যুক্ত হয়েছেন {joinedYear} সালে</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-container-max mx-auto px-gutter py-16 md:py-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (66%) */}
          <div className="flex-1 space-y-8 order-2 lg:order-1">
            
            {/* About Dealership Card (Requested) */}
            <section className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-textPrimary pl-3 border-l-4 border-primary font-outfit">
                শোরুম পরিচিতি
              </h2>
              
              {/* Bio description */}
              <p className="text-sm text-textSecondary leading-relaxed">
                {dealer.bio || `${dealer.business_name} বাংলাদেশের অন্যতম বিশ্বস্ত গাড়ির ডিলার। আমরা জাপানি রিকন্ডিশন এবং ব্যবহৃত সকল ব্র্যান্ডের গাড়ি সুনামের সাথে সরবরাহ করে আসছি।`}
              </p>

              {/* Showroom Location and Address (Requested) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">location_on</span>
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-textSecondary uppercase tracking-wider">শোরুম ঠিকানা</span>
                    <span className="text-sm font-semibold text-textPrimary leading-relaxed">
                      {dealer.address || `${dealer.district}, Bangladesh`}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">store</span>
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-textSecondary uppercase tracking-wider">শোরুম এরিয়া</span>
                    <span className="text-sm font-semibold text-textPrimary">
                      {dealer.district} জেলা
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlight Dealer Personal Website (Requested: Highly Highlighted) */}
              {dealer.website_url && (
                <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md transition-all hover:shadow-lg group">
                  {/* Glowing background light */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-primary">
                        <span className="material-symbols-outlined text-[20px] animate-pulse">language</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Highlight Website</span>
                      </div>
                      <h4 className="text-base font-bold text-textPrimary">
                        {dealer.business_name} এর পার্সোনাল ওয়েবসাইট
                      </h4>
                      <p className="text-xs text-textSecondary">
                        গ্যারিসেল OS ডিলার প্লাটফর্ম দ্বারা তৈরিকৃত এবং ভেরিফাইড। সরাসরি ব্যক্তিগত স্টক ব্রাউজ করুন।
                      </p>
                    </div>
                    <Link
                      href={dealer.website_url}
                      target="_blank"
                      className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95"
                    >
                      <span>ওয়েবসাইট ভিজিট করুন</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Active Listings Grid */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-textPrimary pl-3 border-l-4 border-primary font-outfit">
                ডিলারের সচল বিজ্ঞপ্তিসমূহ
              </h2>

              {listings.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center max-w-sm mx-auto space-y-3">
                  <span className="material-symbols-outlined text-5xl text-gray-300">directions_car</span>
                  <h3 className="font-bold text-base text-textPrimary">কোনো গাড়ি নেই</h3>
                  <p className="text-xs text-textSecondary">
                    বর্তমানে এই ডিলারের কোনো গাড়ি লাইভ বিজ্ঞাপনে সচল নেই।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => {
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

          {/* Right Column: Contact Card (Sticky on desktop, above listings on mobile) */}
          <aside className="w-full lg:w-80 order-1 lg:order-2 self-start lg:sticky lg:top-24 space-y-6">
            
            {/* Quick Contact Box */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-lg text-textPrimary">যোগাযোগ করুন</h3>
              <p className="text-xs text-textSecondary leading-relaxed">
                অনুগ্রহ করে ডিলারের সাথে কথা বলতে সরাসরি কল করুন অথবা হোয়াটসঅ্যাপ এর মাধ্যমে চ্যাট শুরু করুন।
              </p>
              
              <div className="space-y-2 pt-2">
                <Link
                  href={`https://wa.me/${dealer.whatsapp_number || '8801611613952'}?text=Hello%20${encodeURIComponent(dealer.business_name)}`}
                  target="_blank"
                  className="w-full bg-[#16A34A] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  WhatsApp চ্যাট
                </Link>
                <Link
                  href={`tel:${dealer.phone}`}
                  className="w-full bg-white border border-gray-300 text-textPrimary py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all text-sm shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  সরাসরি কল: {dealer.phone}
                </Link>
              </div>
            </div>

            {/* Social Media Links Widget (Requested) */}
            {dealer.social_media && Object.keys(dealer.social_media).length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-textPrimary">সোশ্যাল মিডিয়া পেজ</h4>
                <div className="flex flex-col gap-2">
                  {dealer.social_media.facebook && (
                    <Link
                      href={dealer.social_media.facebook}
                      target="_blank"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-textPrimary hover:bg-gray-50 hover:text-primary transition-all"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-xs">F</span>
                      <span>Facebook Page</span>
                    </Link>
                  )}
                  {dealer.social_media.youtube && (
                    <Link
                      href={dealer.social_media.youtube}
                      target="_blank"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-textPrimary hover:bg-gray-50 hover:text-red-600 transition-all"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-bold text-xs">Y</span>
                      <span>YouTube Channel</span>
                    </Link>
                  )}
                  {dealer.social_media.instagram && (
                    <Link
                      href={dealer.social_media.instagram}
                      target="_blank"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-textPrimary hover:bg-gray-50 hover:text-pink-600 transition-all"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-pink-100 text-pink-600 rounded-full font-bold text-xs">I</span>
                      <span>Instagram Profile</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </aside>

        </div>
      </main>
    </div>
  );
}
