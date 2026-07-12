import React, { Suspense } from 'react';
import Link from 'next/link';
import MakeSearchContentWrapper from './MakeSearchContentWrapper';
import DistrictSearchContentWrapper from './DistrictSearchContentWrapper';
import { MOCK_LISTINGS } from '../../../components/mockData';

export const revalidate = 300; // ISR revalidate: 300 seconds

export async function generateStaticParams() {
  const makes = Array.from(new Set(MOCK_LISTINGS.map(l => l.make.toLowerCase())));
  const districts = ['dhaka', 'chattogram', 'sylhet'];
  return [...makes, ...districts].map(m => ({ make: m }));
}

const DISTRICT_LIST = ['dhaka', 'chattogram', 'sylhet', 'khulna', 'rajshahi', 'barishal', 'rangpur', 'mymensingh'];

export default async function CarsDynamicRouterPage({ params }: { params: { make: string } }) {
  const pathParam = params.make.toLowerCase();

  // ROUTE 1: Render Programmatic District search page if path is a division/district name
  if (DISTRICT_LIST.includes(pathParam)) {
    const displayDistrict = pathParam.charAt(0).toUpperCase() + pathParam.slice(1);
    const seoTitle = `${displayDistrict}-এ বিক্রির জন্য গাড়ি - Garisale`;
    const seoDescription = `${displayDistrict} জেলা থেকে যাচাইকৃত ও সাশ্রয়ী মূল্যে সেরা গাড়িগুলো খুঁজে নিন Garisale-এ।`;

    return (
      <div className="min-h-screen bg-background">
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

        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-container-max mx-auto px-gutter space-y-2">
            <nav className="flex items-center gap-2 text-xs text-textSecondary font-semibold">
              <Link href="/" className="hover:text-primary transition-colors">হোম</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <Link href="/search" className="hover:text-primary transition-colors">গাড়ি খুঁজুন</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-textPrimary">{displayDistrict}</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-extrabold text-textPrimary font-outfit">
              {displayDistrict}-এ বিক্রির জন্য গাড়ি
            </h1>
            <p className="text-xs md:text-sm text-textSecondary font-medium">
              {displayDistrict} জেলার ভেরিফাইড গাড়ি ও ডিলারদের স্টক ব্রাউজ করুন।
            </p>
          </div>
        </section>

        <Suspense fallback={
          <div className="max-w-container-max mx-auto px-gutter py-12 text-center text-textSecondary font-semibold">
            লোডিং হচ্ছে...
          </div>
        }>
          <DistrictSearchContentWrapper district={displayDistrict} />
        </Suspense>
      </div>
    );
  }

  // ROUTE 2: Make Browse Page
  const displayMake = pathParam.charAt(0).toUpperCase() + pathParam.slice(1);
  const seoTitle = `বাংলাদেশে বিক্রির জন্য ${displayMake} গাড়ি - Garisale`;
  const seoDescription = `ভেরিফাইড ও ভালো কন্ডিশনে থাকা সেরা ${displayMake} ব্র্যান্ডের গাড়িগুলো খুঁজে নিন Garisale মার্কেটপ্লেসে।`;

  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-container-max mx-auto px-gutter space-y-2">
          <nav className="flex items-center gap-2 text-xs text-textSecondary font-semibold">
            <Link href="/" className="hover:text-primary transition-colors">হোম</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link href="/search" className="hover:text-primary transition-colors">গাড়ি খুঁজুন</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-textPrimary">{displayMake}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-textPrimary font-outfit">
            বিক্রির জন্য {displayMake} গাড়ি
          </h1>
          <p className="text-xs md:text-sm text-textSecondary font-medium">
            যাচাইকৃত মূল্যে চমৎকার সব {displayMake} গাড়ি ব্রাউজ করুন।
          </p>
        </div>
      </section>

      <Suspense fallback={
        <div className="max-w-container-max mx-auto px-gutter py-12 text-center text-textSecondary font-semibold">
          লোডিং হচ্ছে...
        </div>
      }>
        <MakeSearchContentWrapper make={displayMake} />
      </Suspense>
    </div>
  );
}
