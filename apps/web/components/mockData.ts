export interface VehiclePhoto {
  id: string;
  url: string;
  is_primary: boolean;
}

export interface Dealership {
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

export interface MarketplaceListing {
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
  registration_year?: number;
  features?: string[];
  created_at: string;
}

export const MOCK_LISTINGS: MarketplaceListing[] = [
  {
    id: 'mock-1',
    slug: '2019-toyota-axio-dhaka-xk7p2',
    title: 'Toyota Axio G Grade 2019 Pearl White',
    description: 'Toyota Axio G Grade 2019 model in pristine condition. Pearl white exterior with clean beige interior. Single hand driven, well maintained, octan & hybrid driven. Dynamic suspension, soft touch AC panel, push start, HID projection headlights, reverse camera, lane assist, collision mitigation system. No accident history, all papers are up-to-date.',
    asking_price: 1850000,
    original_price: 1900000,
    price_drop_flag: true,
    deal_rating: 'great_deal',
    deal_score: -0.09,
    year: 2019,
    registration_year: 2023,
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
    photo_count: 4,
    features: ['Push Start', 'Reverse Camera', 'Soft Touch AC', 'Lane Assist', 'HID Projection'],
    photos: [
      { id: 'p1-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpsmL_ZTcyRjRLkXwM2Ia3BddzCQJ6lOLxfAwInwkAvpRWUty6NSK48R38nfzjdP0iKXJ9r-4R9sQPmGz-OvUISaeD-tqFgHJpM7GJ_DjUGXzmlPghJOYfQ7EUe6_BkSloQwWnuI9maBw-UiBscmr5CAzpSrYLbLc2uAHdJjKv4TP23S1hKjwR3a5Q1TeMF0T97WlWIhXDYSRtBau_dNbs_rWlFLqndY8Mkh_lwLy_EF7WhAOaPvIOt-FH4e_H_CSRrkiHzfuzCSoi', is_primary: true },
      { id: 'p1-2', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPka1MBzclAOMn24NPZ2dgkndFsd6fPCq_blD2TrnM9mnRTxJgDPsTzOqVRJ85doXPILFOTt437RaTOVNb7nnqTgWJq5Z8y8ML6pNs5cUeNiPdyeFnrwu02LXF37oajriFJgxBDIbaafyDOpQI-1CPz33ctzy6TIvKeTa61wjADaRGujY2zIGSM4D1FlRAv6o94FJE6UA1R4slkMKQBbnPl1D3m7VDRFAlLfK7GLkOjLoqFIvV54ML9ki5IE5clpC70NK5RtEBjPoN', is_primary: false },
      { id: 'p1-3', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxAUxM-k69IU5yfXjeiu14FSrJDyzv84Q2ScouKOQGu6MueVRZO2Y-lQqHtTIwD2GQmAD6nQVSBshANoNumAdjK43yZbtex1BgVEtwoaSh8X_tE8cIxKaDRNNnGunelyNqujF2e6wPKMzJWu6VHxeH6E0Ude9RlSXCxqfd2aJIUbTIMM1a6F0zAqQQeGJzvo6nBS9hXhw3HHCqgm8FbV7U7xyC9-K__6CHVAI3bl-BHybTn_lLWdbGVfJua_mpD1XWZSQxn-29GF8F', is_primary: false },
      { id: 'p1-4', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKpDWoEYFizlNCPgePCoDlowSr2Tob5a0kDrtFm0E2RZksBwl5aAjuJLD-I_7jETttg84sHdKaxjimqohU77NmFNCf6Va3nm4u2uThbYuh4EcPGzsDaxsc-tkL81lcmUyWpDvETvgWI7JS2aySGVjH8uMFFBXrVq5J7N7C2JFs2Z-zoq8uK2oUSF4kRKQlnXs3K2NIblDbguRTxWw0g-a40y85iLrO-hW3QuDfEX4W47UnwLOad77pHw5YIREPWX4gOm15ds50qCay', is_primary: false }
    ],
    dealership: {
      id: 'd-1',
      business_name: 'Dhaka Premium Motors',
      slug: 'dhaka-premium-motors',
      logo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6jd0uenEKgpikr-xJyUQUpeW8wpnarwZNAzFFYSG0ckrUZNFeGSqZ9Q_oozanHDtVLvmmhTI9Vk-6K6Dqmifa55SRG65M-usTWvM2Z41s4v7SGXxwQw4qqb2A_f2wsiLDoSJI5YBd9SAwlGy-Fr_86Ttu4g09HGkzzzx3sQyThkXuhW-Ue7CS2dqGoOA-fd4IdSdF8dZX65R9dYH243RziZYf7awl8GcyKrKBdd3Ti0Tzj_34_2g6Q6X3hJPTFKUeORpDYupavcy8',
      rating: 4.8,
      review_count: 36,
      created_at: '2018-06-15T00:00:00Z',
      phone: '01611-613952',
      whatsapp_number: '8801611613952'
    },
    created_at: '2026-07-10T12:00:00Z'
  },
  {
    id: 'mock-2',
    slug: '2018-toyota-premio-f-ex-dhaka-a39bd',
    title: 'Toyota Premio F EX Package 2018 Gold',
    description: 'Very well maintained Toyota Premio F EX Package. Golden color exterior, premium leather seats, wooden panel trim. Dual zone automatic climate control, cruise control, dynamic parking sensors.',
    asking_price: 2850000,
    original_price: 2950000,
    price_drop_flag: true,
    deal_rating: 'good_deal',
    deal_score: -0.04,
    year: 2018,
    registration_year: 2021,
    make: 'Toyota',
    model: 'Premio',
    variant: 'F EX Package',
    body_type: 'Sedan',
    engine_cc: 1500,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 38000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['Leather Seats', 'Cruise Control', 'Wooden Trim', 'LED Headlights'],
    photos: [{ id: 'p2-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-2',
      business_name: 'Uttara Auto Hub',
      slug: 'uttara-auto-hub',
      rating: 4.6,
      review_count: 22,
      created_at: '2020-02-10T00:00:00Z',
      phone: '01711-223344',
      whatsapp_number: '8801711223344'
    },
    created_at: '2026-07-09T10:00:00Z'
  },
  {
    id: 'mock-3',
    slug: '2022-honda-civic-rs-chattogram-h28d9',
    title: 'Honda Civic RS Turbo 2022 Black',
    description: 'Sleek black Honda Civic RS Turbo. Single owner, octane-only driven. Sporty interior with red stitching, dynamic drive modes, sunroof, active safety package.',
    asking_price: 3650000,
    price_drop_flag: false,
    deal_rating: 'good_deal',
    deal_score: -0.05,
    year: 2022,
    registration_year: 2022,
    make: 'Honda',
    model: 'Civic',
    variant: 'RS Turbo',
    body_type: 'Sedan',
    engine_cc: 1500,
    fuel_type: 'octane',
    transmission: 'CVT',
    condition: 'used',
    mileage_km: 12000,
    district: 'Chattogram',
    photo_count: 1,
    features: ['Turbo Engine', 'Sunroof', 'Leather Steering', 'Paddle Shifters'],
    photos: [{ id: 'p3-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2wkejAfcty4yak-Qf1c7ylGvxT_HFy5KdBA7drk5FUcg4JtwwD1aEmWxzzMRCamOp0Mfnlp5IOFUvVCqTsPgZK4VkLRQRwSuZ4dw9TcqzsuHE5LNRwCydLAMxM7oGs8Irh6u2Jv2GyUkdegbreV8n4m1f8k-HmRtqFJnOFMwgDytpUXP8yOOKLATuEe498wChqUAuV74S0eMpKNcRnH6GenYzT4LZePNZJMJroJeoYTpwKZCK1S0fJh1yHObxr1qnnKiSHsyV2Lqa', is_primary: true }],
    dealership: {
      id: 'd-3',
      business_name: 'Ctg Auto Gallery',
      slug: 'ctg-auto-gallery',
      rating: 4.7,
      review_count: 15,
      created_at: '2019-11-01T00:00:00Z',
      phone: '01819-887766'
    },
    created_at: '2026-07-08T09:00:00Z'
  },
  {
    id: 'mock-4',
    slug: '2018-nissan-xtrail-sylhet-f89d3',
    title: 'Nissan X-Trail Hybrid 2018 Silver',
    description: 'Nissan X-Trail Hybrid 2018. Metallic silver, spacious 5-seater configuration. Dual emergency brake support, 360 view parking camera, power tail gate, all-wheel drive control.',
    asking_price: 2550000,
    price_drop_flag: false,
    deal_rating: 'fair_price',
    deal_score: 0.01,
    year: 2018,
    registration_year: 2021,
    make: 'Nissan',
    model: 'X-Trail',
    variant: 'Hybrid',
    body_type: 'SUV',
    engine_cc: 2000,
    fuel_type: 'hybrid',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 56000,
    district: 'Sylhet',
    photo_count: 1,
    features: ['360 Camera', 'Power Tailgate', 'AWD', 'Panoramic Sunroof'],
    photos: [{ id: 'p4-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDISxLDRJIREW9d-yZNoF0xyaPNvpdiHM-4FF-F4Erv8wETT36N39Zt-AWM-N2hgTEIUFZpPi9GCH7Pnwt88RaOTgCqksysKpSmU9s6ewSegpZ6NF-5l3NlPNt4K_7Alzbf4kL5OIyzk8JKc6ZrF0GvpTNlTxbMKVKM2Tfact5larP7TNHwfTS69B4ZCDI3nNuEYJCbGI5vAFBfWk-SUTyoHoXe1944fF7f9bxhDnHCFZcbxb2iUmt9P5CFjcOF028C6DQ9CA6vX2YE', is_primary: true }],
    dealership: {
      id: 'd-4',
      business_name: 'Sylhet Auto Express',
      slug: 'sylhet-auto-express',
      rating: 4.5,
      review_count: 9,
      created_at: '2021-08-20T00:00:00Z',
      phone: '01911-334455'
    },
    created_at: '2026-07-07T08:00:00Z'
  },
  {
    id: 'mock-5',
    slug: '2020-toyota-harrier-progress-dhaka-h291a',
    title: 'Toyota Harrier Progress 2020 Black',
    description: 'High-spec Toyota Harrier Progress 2020. Panoramic sunroof, JBL sound system, red wine leather interior dashboard, electric memory seats.',
    asking_price: 5200000,
    original_price: 5400000,
    price_drop_flag: true,
    deal_rating: 'great_deal',
    deal_score: -0.08,
    year: 2020,
    registration_year: 2021,
    make: 'Toyota',
    model: 'Harrier',
    variant: 'Progress',
    body_type: 'SUV',
    engine_cc: 2000,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 18000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['JBL Sound', 'Panoramic Roof', 'Memory Seats', 'Dynamic Cruise'],
    photos: [{ id: 'p5-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-1',
      business_name: 'Dhaka Premium Motors',
      slug: 'dhaka-premium-motors',
      rating: 4.8,
      review_count: 36,
      created_at: '2018-06-15T00:00:00Z',
      phone: '01611-613952'
    },
    created_at: '2026-07-06T12:00:00Z'
  },
  {
    id: 'mock-6',
    slug: '2017-toyota-ch-r-gt-dhaka-c392d',
    title: 'Toyota C-HR GT LED Edition 2017 Red',
    description: 'Toyota C-HR GT 2017 LED Edition. Vibrant metallic red, two-tone black roof. Keyless entry, lane departure warning, blind spot monitors, premium heated seats.',
    asking_price: 2150000,
    price_drop_flag: false,
    deal_rating: 'fair_price',
    deal_score: 0.02,
    year: 2017,
    registration_year: 2020,
    make: 'Toyota',
    model: 'C-HR',
    variant: 'GT LED Edition',
    body_type: 'Crossover',
    engine_cc: 1200,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 42000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['Heated Seats', 'Blind Spot Monitor', 'Lane Departure', 'Two Tone Style'],
    photos: [{ id: 'p6-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-2',
      business_name: 'Uttara Auto Hub',
      slug: 'uttara-auto-hub',
      rating: 4.6,
      review_count: 22,
      created_at: '2020-02-10T00:00:00Z',
      phone: '01711-223344'
    },
    created_at: '2026-07-05T10:00:00Z'
  },
  {
    id: 'mock-7',
    slug: '2019-honda-vezel-rs-dhaka-v83a1',
    title: 'Honda Vezel RS Hybrid 2019 Blue',
    description: 'Honda Vezel RS Hybrid 2019. Blue exterior with alcantara interior finish. Sporty RS body styling, 18-inch RS alloy wheels, steering controls, paddle shifts.',
    asking_price: 2450000,
    price_drop_flag: false,
    deal_rating: 'good_deal',
    deal_score: -0.03,
    year: 2019,
    registration_year: 2022,
    make: 'Honda',
    model: 'Vezel',
    variant: 'RS Hybrid',
    body_type: 'Crossover',
    engine_cc: 1500,
    fuel_type: 'hybrid',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 35000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['RS Alloy Wheels', 'Alcantara Seats', 'Paddle Shifts', 'LED Fog Lights'],
    photos: [{ id: 'p7-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-1',
      business_name: 'Dhaka Premium Motors',
      slug: 'dhaka-premium-motors',
      rating: 4.8,
      review_count: 36,
      created_at: '2018-06-15T00:00:00Z',
      phone: '01611-613952'
    },
    created_at: '2026-07-04T12:00:00Z'
  },
  {
    id: 'mock-8',
    slug: '2020-toyota-rav4-g-dhaka-r392f',
    title: 'Toyota RAV4 G Package 2020 White',
    description: 'Toyota RAV4 G Package 2020 model. White exterior, black leather interior. Excellent offroad handling, multi terrain select modes, power driver seat, dual exhaust.',
    asking_price: 3950000,
    price_drop_flag: false,
    deal_rating: 'good_deal',
    deal_score: -0.04,
    year: 2020,
    registration_year: 2021,
    make: 'Toyota',
    model: 'RAV4',
    variant: 'G Package',
    body_type: 'SUV',
    engine_cc: 2000,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 26000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['Leather Interior', 'Multi Terrain Select', 'Power Seat', 'Dual Exhaust'],
    photos: [{ id: 'p8-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-2',
      business_name: 'Uttara Auto Hub',
      slug: 'uttara-auto-hub',
      rating: 4.6,
      review_count: 22,
      created_at: '2020-02-10T00:00:00Z',
      phone: '01711-223344'
    },
    created_at: '2026-07-03T10:00:00Z'
  },
  {
    id: 'mock-9',
    slug: '2019-mitsubishi-outlander-dhaka-o28d9',
    title: 'Mitsubishi Outlander 2019 White',
    description: 'Mitsubishi Outlander 2019. Pearl white, 7-seater configuration. Super All-Wheel Control (S-AWC), Rockford Fosgate premium sound system, electric tailgate, blind spot monitors.',
    asking_price: 3150000,
    original_price: 3300000,
    price_drop_flag: true,
    deal_rating: 'great_deal',
    deal_score: -0.07,
    year: 2019,
    registration_year: 2021,
    make: 'Mitsubishi',
    model: 'Outlander',
    variant: 'S-AWC 7 Seater',
    body_type: 'SUV',
    engine_cc: 2000,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 32000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['7 Seats', 'Rockford Sound', 'S-AWC All Wheel', 'Blind Spot Detection'],
    photos: [{ id: 'p9-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-1',
      business_name: 'Dhaka Premium Motors',
      slug: 'dhaka-premium-motors',
      rating: 4.8,
      review_count: 36,
      created_at: '2018-06-15T00:00:00Z',
      phone: '01611-613952'
    },
    created_at: '2026-07-02T12:00:00Z'
  },
  {
    id: 'mock-10',
    slug: '2019-toyota-noah-si-dhaka-n89a2',
    title: 'Toyota Noah Si WxB II 2019 Black',
    description: 'Toyota Noah Si WxB II 2019 model. Black exterior, premium WxB interior styling. Dual power sliding doors, 7-seater captain seats, cruise control, rear AC vents.',
    asking_price: 2580000,
    price_drop_flag: false,
    deal_rating: 'good_deal',
    deal_score: -0.04,
    year: 2019,
    registration_year: 2022,
    make: 'Toyota',
    model: 'Noah',
    variant: 'Si WxB II',
    body_type: 'Microbus',
    engine_cc: 2000,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 48000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['Dual Power Doors', 'WxB Interior', 'Captain Seats', 'Rear AC Vents'],
    photos: [{ id: 'p10-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-2',
      business_name: 'Uttara Auto Hub',
      slug: 'uttara-auto-hub',
      rating: 4.6,
      review_count: 22,
      created_at: '2020-02-10T00:00:00Z',
      phone: '01711-223344'
    },
    created_at: '2026-07-01T10:00:00Z'
  },
  {
    id: 'mock-11',
    slug: '2020-hyundai-tucson-gls-dhaka-t28b3',
    title: 'Hyundai Tucson GLS 2020 Crimson Red',
    description: 'Crimson Red Hyundai Tucson GLS 2020 model. Panoramic sunroof, power seats, leather interior. Excellent suspension, active parking guidelines, dynamic styling.',
    asking_price: 3250000,
    price_drop_flag: false,
    deal_rating: 'good_deal',
    deal_score: -0.03,
    year: 2020,
    registration_year: 2020,
    make: 'Hyundai',
    model: 'Tucson',
    variant: 'GLS',
    body_type: 'SUV',
    engine_cc: 2000,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 19000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['Panoramic Sunroof', 'Crimson Red Finish', 'Power Seats', 'Parking Guide'],
    photos: [{ id: 'p11-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-1',
      business_name: 'Dhaka Premium Motors',
      slug: 'dhaka-premium-motors',
      rating: 4.8,
      review_count: 36,
      created_at: '2018-06-15T00:00:00Z',
      phone: '01611-613952'
    },
    created_at: '2026-06-30T12:00:00Z'
  },
  {
    id: 'mock-12',
    slug: '2018-ford-mustang-ecoboost-dhaka-f392a',
    title: 'Ford Mustang EcoBoost 2018 Yellow',
    description: 'Eye-catching yellow Ford Mustang EcoBoost. Leather interior, premium sound system, dynamic steering modes, custom sport exhaust. Only driven during weekends.',
    asking_price: 6800000,
    original_price: 7200000,
    price_drop_flag: true,
    deal_rating: 'overpriced',
    deal_score: 0.12,
    year: 2018,
    registration_year: 2019,
    make: 'Ford',
    model: 'Mustang',
    variant: 'EcoBoost Premium',
    body_type: 'Coupe',
    engine_cc: 2300,
    fuel_type: 'octane',
    transmission: 'automatic',
    condition: 'used',
    mileage_km: 15000,
    district: 'Dhaka',
    photo_count: 1,
    features: ['EcoBoost Engine', 'Leather Sport Seats', 'Custom Sport Exhaust', 'Yellow Racing Style'],
    photos: [{ id: 'p12-1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1', is_primary: true }],
    dealership: {
      id: 'd-1',
      business_name: 'Dhaka Premium Motors',
      slug: 'dhaka-premium-motors',
      rating: 4.8,
      review_count: 36,
      created_at: '2018-06-15T00:00:00Z',
      phone: '01611-613952'
    },
    created_at: '2026-06-29T12:00:00Z'
  }
];
