'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TrendDataPoint {
  date: string;
  avg_price: number;
  median_price: number;
  listing_count: number;
}

interface PriceTrendsChartProps {
  data: TrendDataPoint[];
}

function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '৳ ').replace('Rs', '৳ ');
}

export default function PriceTrendsChart({ data }: PriceTrendsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full bg-gray-50 animate-pulse rounded-xl border border-gray-150" />;
  }

  // Format date strings for chart labels (e.g. "2026-01-01" -> "Jan 26")
  const formattedData = data.map(pt => {
    const d = new Date(pt.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    return {
      ...pt,
      label,
      'গড় মূল্য': pt.avg_price,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg text-xs space-y-1">
          <p className="font-bold text-textPrimary">{payload[0].payload.label}</p>
          <p className="font-semibold text-primary">গড় মূল্য: {formatBDT(payload[0].value)}</p>
          <p className="text-textSecondary">বিজ্ঞাপন সংখ্যা: {payload[0].payload.listing_count}টি</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
            tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="গড় মূল্য" 
            stroke="#2563EB" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
