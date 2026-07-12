import React, { Suspense } from 'react';
import Link from 'next/link';
import { MOCK_LISTINGS } from '../../../../components/mockData';
import SearchContentWrapper from './SearchContentWrapper';

export const revalidate = 300; // ISR revalidate: 300 seconds

interface PageProps {
  params: {
    make: string;
    model: string;
  };
}

// Generate static params for programmatic SEO pages matching our mock database
export async function generateStaticParams() {
  const pairs = MOCK_LISTINGS.map(l => ({
    make: l.make.toLowerCase(),
    model: l.model.toLowerCase(),
  }));

  // Deduplicate pairs
  const uniquePairs = Array.from(
    new Set(pairs.map(p => `${p.make}/${p.model}`))
  ).map(str => {
    const [make, model] = str.split('/');
    return { make, model };
  });

  return uniquePairs;
}

export default async function ProgrammaticSearchPage({ params }: PageProps) {
  const make = params.make.toLowerCase();
  const model = params.model.toLowerCase();

  // Find proper casing from mock data if available
  const match = MOCK_LISTINGS.find(
    l => l.make.toLowerCase() === make && l.model.toLowerCase() === model
  );
  const displayMake = match ? match.make : make.charAt(0).toUpperCase() + make.slice(1);
  const displayModel = match ? match.model : model.charAt(0).toUpperCase() + model.slice(1);

  // Dynamic SEO metadata tags are resolved from page title
  const seoTitle = `${displayMake} ${displayModel} গাড়ি কিনুন - Garisale`;
  const seoDescription = `ঢাকাসহ বাংলাদেশের বিভিন্ন জেলা থেকে যাচাইকৃত ${displayMake} ${displayModel} গাড়ি খুঁজে নিন সঠিক বাজার মূল্যে।`;

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic SEO Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />

      {/* Header */}
      <header className="bg-surface border-b border-gray-200 h-20 flex items-center sticky top-0 z-40 shadow-sm">
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

      {/* Programmatic SEO Heading Container */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-container-max mx-auto px-gutter space-y-2">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-textSecondary font-semibold">
            <Link href="/" className="hover:text-primary transition-colors">হোম</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link href="/search" className="hover:text-primary transition-colors">গাড়ি খুঁজুন</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-textPrimary">{displayMake} {displayModel}</span>
          </nav>
          
          {/* H1 for Programmatic SEO */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-textPrimary font-outfit">
            বাংলাদেশে বিক্রির জন্য {displayMake} {displayModel} গাড়ি
          </h1>
          <p className="text-xs md:text-sm text-textSecondary font-medium">
            GariSale ভেরিফাইড ডিলার ও লাইভ বাজার দর (IMV) তুলনা করে আপনার সেরা {displayMake} {displayModel} গাড়িটি বেছে নিন।
          </p>
        </div>
      </section>

      {/* Suspended Client search layout containing filters, grid and maps */}
      <Suspense fallback={
        <div className="max-w-container-max mx-auto px-gutter py-12 text-center text-textSecondary font-semibold">
          লোডিং হচ্ছে...
        </div>
      }>
        <SearchContentWrapper make={displayMake} model={displayModel} />
      </Suspense>
    </div>
  );
}
