// AutoVerse — Step 16: Database Seed Data
// File: apps/api/prisma/seed.ts
// Run: npx prisma db seed
// package.json: "prisma": { "seed": "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts" }

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────
// MAIN SEED ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting AutoVerse database seed...\n');

  await seedDivisionsAndDistricts();
  await seedVehicleReference();
  await seedExpenseCategories();
  await seedPlanConfigs();
  await seedPlatformCalendar();
  await seedLostReasons();
  await seedVehicleFeatures();
  await seedAdminUser();

  console.log('\n✅ Seed complete.');
}

// ─────────────────────────────────────────────────────────────────
// 1. DIVISIONS & DISTRICTS
// All 8 BD Divisions and 64 Districts
// ─────────────────────────────────────────────────────────────────
async function seedDivisionsAndDistricts() {
  console.log('📍 Seeding divisions and districts...');

  const DIVISIONS: {
    name: string;
    name_bn: string;
    slug: string;
    districts: { name: string; name_bn: string; slug: string }[];
  }[] = [
    {
      name: 'Dhaka',
      name_bn: 'ঢাকা',
      slug: 'dhaka',
      districts: [
        { name: 'Dhaka',       name_bn: 'ঢাকা',       slug: 'dhaka'       },
        { name: 'Gazipur',     name_bn: 'গাজীপুর',     slug: 'gazipur'     },
        { name: 'Narayanganj', name_bn: 'নারায়ণগঞ্জ', slug: 'narayanganj' },
        { name: 'Tangail',     name_bn: 'টাঙ্গাইল',    slug: 'tangail'     },
        { name: 'Munshiganj',  name_bn: 'মুন্সিগঞ্জ',  slug: 'munshiganj'  },
        { name: 'Manikganj',   name_bn: 'মানিকগঞ্জ',   slug: 'manikganj'   },
        { name: 'Narsingdi',   name_bn: 'নরসিংদী',     slug: 'narsingdi'   },
        { name: 'Faridpur',    name_bn: 'ফরিদপুর',     slug: 'faridpur'    },
        { name: 'Gopalganj',   name_bn: 'গোপালগঞ্জ',   slug: 'gopalganj'   },
        { name: 'Kishoreganj', name_bn: 'কিশোরগঞ্জ',   slug: 'kishoreganj' },
        { name: 'Madaripur',   name_bn: 'মাদারীপুর',   slug: 'madaripur'   },
        { name: 'Rajbari',     name_bn: 'রাজবাড়ী',    slug: 'rajbari'     },
        { name: 'Shariatpur',  name_bn: 'শরিয়তপুর',   slug: 'shariatpur'  },
      ],
    },
    {
      name: 'Chittagong',
      name_bn: 'চট্টগ্রাম',
      slug: 'chittagong',
      districts: [
        { name: 'Chittagong',    name_bn: 'চট্টগ্রাম',    slug: 'chittagong'    },
        { name: "Cox's Bazar",   name_bn: 'কক্সবাজার',    slug: 'coxs-bazar'    },
        { name: 'Comilla',       name_bn: 'কুমিল্লা',     slug: 'comilla'       },
        { name: 'Brahmanbaria',  name_bn: 'ব্রাহ্মণবাড়িয়া', slug: 'brahmanbaria' },
        { name: 'Chandpur',      name_bn: 'চাঁদপুর',      slug: 'chandpur'      },
        { name: 'Feni',          name_bn: 'ফেনী',         slug: 'feni'          },
        { name: 'Khagrachhari',  name_bn: 'খাগড়াছড়ি',   slug: 'khagrachhari'  },
        { name: 'Lakshmipur',    name_bn: 'লক্ষ্মীপুর',  slug: 'lakshmipur'    },
        { name: 'Noakhali',      name_bn: 'নোয়াখালী',    slug: 'noakhali'      },
        { name: 'Rangamati',     name_bn: 'রাঙ্গামাটি',   slug: 'rangamati'     },
        { name: 'Bandarban',     name_bn: 'বান্দরবান',    slug: 'bandarban'     },
      ],
    },
    {
      name: 'Rajshahi',
      name_bn: 'রাজশাহী',
      slug: 'rajshahi',
      districts: [
        { name: 'Rajshahi',          name_bn: 'রাজশাহী',         slug: 'rajshahi'          },
        { name: 'Bogra',             name_bn: 'বগুড়া',           slug: 'bogra'             },
        { name: 'Joypurhat',         name_bn: 'জয়পুরহাট',       slug: 'joypurhat'         },
        { name: 'Naogaon',           name_bn: 'নওগাঁ',           slug: 'naogaon'           },
        { name: 'Natore',            name_bn: 'নাটোর',           slug: 'natore'            },
        { name: 'Chapai Nawabganj',  name_bn: 'চাঁপাইনবাবগঞ্জ', slug: 'chapai-nawabganj'  },
        { name: 'Pabna',             name_bn: 'পাবনা',           slug: 'pabna'             },
        { name: 'Sirajganj',         name_bn: 'সিরাজগঞ্জ',       slug: 'sirajganj'         },
      ],
    },
    {
      name: 'Khulna',
      name_bn: 'খুলনা',
      slug: 'khulna',
      districts: [
        { name: 'Khulna',    name_bn: 'খুলনা',    slug: 'khulna'    },
        { name: 'Bagerhat',  name_bn: 'বাগেরহাট', slug: 'bagerhat'  },
        { name: 'Chuadanga', name_bn: 'চুয়াডাঙ্গা', slug: 'chuadanga' },
        { name: 'Jashore',   name_bn: 'যশোর',     slug: 'jashore'   },
        { name: 'Jhenaidah', name_bn: 'ঝিনাইদহ', slug: 'jhenaidah' },
        { name: 'Kushtia',   name_bn: 'কুষ্টিয়া', slug: 'kushtia'   },
        { name: 'Magura',    name_bn: 'মাগুরা',   slug: 'magura'    },
        { name: 'Meherpur',  name_bn: 'মেহেরপুর', slug: 'meherpur'  },
        { name: 'Narail',    name_bn: 'নড়াইল',   slug: 'narail'    },
        { name: 'Satkhira',  name_bn: 'সাতক্ষীরা', slug: 'satkhira'  },
      ],
    },
    {
      name: 'Barisal',
      name_bn: 'বরিশাল',
      slug: 'barisal',
      districts: [
        { name: 'Barisal',   name_bn: 'বরিশাল',  slug: 'barisal'   },
        { name: 'Barguna',   name_bn: 'বরগুনা',  slug: 'barguna'   },
        { name: 'Bhola',     name_bn: 'ভোলা',    slug: 'bhola'     },
        { name: 'Jhalokati', name_bn: 'ঝালকাঠি', slug: 'jhalokati' },
        { name: 'Patuakhali', name_bn: 'পটুয়াখালী', slug: 'patuakhali' },
        { name: 'Pirojpur',  name_bn: 'পিরোজপুর', slug: 'pirojpur'  },
      ],
    },
    {
      name: 'Sylhet',
      name_bn: 'সিলেট',
      slug: 'sylhet',
      districts: [
        { name: 'Sylhet',      name_bn: 'সিলেট',       slug: 'sylhet'      },
        { name: 'Habiganj',    name_bn: 'হবিগঞ্জ',     slug: 'habiganj'    },
        { name: 'Moulvibazar', name_bn: 'মৌলভীবাজার', slug: 'moulvibazar' },
        { name: 'Sunamganj',   name_bn: 'সুনামগঞ্জ',   slug: 'sunamganj'   },
      ],
    },
    {
      name: 'Rangpur',
      name_bn: 'রংপুর',
      slug: 'rangpur',
      districts: [
        { name: 'Rangpur',     name_bn: 'রংপুর',     slug: 'rangpur'     },
        { name: 'Dinajpur',    name_bn: 'দিনাজপুর',  slug: 'dinajpur'    },
        { name: 'Gaibandha',   name_bn: 'গাইবান্ধা', slug: 'gaibandha'   },
        { name: 'Kurigram',    name_bn: 'কুড়িগ্রাম', slug: 'kurigram'    },
        { name: 'Lalmonirhat', name_bn: 'লালমনিরহাট', slug: 'lalmonirhat' },
        { name: 'Nilphamari',  name_bn: 'নীলফামারী', slug: 'nilphamari'  },
        { name: 'Panchagarh',  name_bn: 'পঞ্চগড়',   slug: 'panchagarh'  },
        { name: 'Thakurgaon',  name_bn: 'ঠাকুরগাঁও', slug: 'thakurgaon'  },
      ],
    },
    {
      name: 'Mymensingh',
      name_bn: 'ময়মনসিংহ',
      slug: 'mymensingh',
      districts: [
        { name: 'Mymensingh', name_bn: 'ময়মনসিংহ', slug: 'mymensingh' },
        { name: 'Jamalpur',   name_bn: 'জামালপুর',  slug: 'jamalpur'   },
        { name: 'Netrokona',  name_bn: 'নেত্রকোণা', slug: 'netrokona'  },
        { name: 'Sherpur',    name_bn: 'শেরপুর',    slug: 'sherpur'    },
      ],
    },
  ];

  for (const div of DIVISIONS) {
    const division = await prisma.division.upsert({
      where:  { slug: div.slug },
      update: { name: div.name, name_bn: div.name_bn },
      create: { name: div.name, name_bn: div.name_bn, slug: div.slug },
    });

    for (const dist of div.districts) {
      await prisma.district.upsert({
        where:  { slug: dist.slug },
        update: { name: dist.name, name_bn: dist.name_bn, division_id: division.id },
        create: {
          name:        dist.name,
          name_bn:     dist.name_bn,
          slug:        dist.slug,
          division_id: division.id,
        },
      });
    }
  }

  const divCount  = await prisma.division.count();
  const distCount = await prisma.district.count();
  console.log(`   ✅ ${divCount} divisions, ${distCount} districts`);
}

// ─────────────────────────────────────────────────────────────────
// 2. VEHICLE REFERENCE DATABASE
// Common makes/models sold in Bangladesh — VIN lookup supplement
// ─────────────────────────────────────────────────────────────────
async function seedVehicleReference() {
  console.log('🚗 Seeding vehicle reference database...');

  const MAKES: {
    name: string;
    name_bn: string;
    slug: string;
    country_of_origin: string;
    is_popular: boolean;
    models: {
      name: string;
      name_bn: string;
      slug: string;
      body_types: string[];
      fuel_types: string[];
      years_available: string;
      engine_cc_range: string;
      is_popular: boolean;
    }[];
  }[] = [
    {
      name: 'Toyota', name_bn: 'টয়োটা', slug: 'toyota',
      country_of_origin: 'Japan', is_popular: true,
      models: [
        { name: 'Axio',       name_bn: 'অ্যাক্সিও',  slug: 'axio',       body_types: ['sedan'],            fuel_types: ['petrol','hybrid'], years_available: '2006-2019', engine_cc_range: '1300-1500', is_popular: true  },
        { name: 'Allion',     name_bn: 'অ্যালিয়ন',  slug: 'allion',     body_types: ['sedan'],            fuel_types: ['petrol'],          years_available: '2001-2021', engine_cc_range: '1500-1800', is_popular: true  },
        { name: 'Premio',     name_bn: 'প্রিমিও',    slug: 'premio',     body_types: ['sedan'],            fuel_types: ['petrol'],          years_available: '2001-2021', engine_cc_range: '1500-1800', is_popular: true  },
        { name: 'Prius',      name_bn: 'প্রিয়াস',   slug: 'prius',      body_types: ['sedan','hatchback'], fuel_types: ['hybrid'],         years_available: '2004-2023', engine_cc_range: '1800-2000', is_popular: true  },
        { name: 'Aqua',       name_bn: 'অ্যাকুয়া',  slug: 'aqua',       body_types: ['hatchback'],        fuel_types: ['hybrid'],          years_available: '2011-2021', engine_cc_range: '1500',      is_popular: true  },
        { name: 'Vitz',       name_bn: 'ভিটজ',      slug: 'vitz',       body_types: ['hatchback'],        fuel_types: ['petrol'],          years_available: '1998-2019', engine_cc_range: '1000-1500', is_popular: true  },
        { name: 'Fielder',    name_bn: 'ফিল্ডার',   slug: 'fielder',    body_types: ['wagon'],            fuel_types: ['petrol','hybrid'], years_available: '2000-2019', engine_cc_range: '1500-1800', is_popular: true  },
        { name: 'Probox',     name_bn: 'প্রোবক্স',  slug: 'probox',     body_types: ['wagon'],            fuel_types: ['petrol'],          years_available: '2002-2022', engine_cc_range: '1300-1500', is_popular: false },
        { name: 'Hiace',      name_bn: 'হাইএস',     slug: 'hiace',      body_types: ['minivan','van'],     fuel_types: ['diesel'],          years_available: '1977-2023', engine_cc_range: '2000-3000', is_popular: true  },
        { name: 'Land Cruiser', name_bn: 'ল্যান্ড ক্রুজার', slug: 'land-cruiser', body_types: ['suv'], fuel_types: ['diesel','petrol'], years_available: '1950-2023', engine_cc_range: '3000-5700', is_popular: true },
        { name: 'Hilux',      name_bn: 'হাইলাক্স',  slug: 'hilux',      body_types: ['pickup'],           fuel_types: ['diesel'],          years_available: '1968-2023', engine_cc_range: '2400-3000', is_popular: false },
        { name: 'Fortuner',   name_bn: 'ফরচুনার',  slug: 'fortuner',   body_types: ['suv'],              fuel_types: ['diesel','petrol'], years_available: '2005-2023', engine_cc_range: '2700-3000', is_popular: true  },
        { name: 'RAV4',       name_bn: 'র‍্যাভ ফোর', slug: 'rav4',       body_types: ['suv'],              fuel_types: ['petrol','hybrid'], years_available: '1994-2023', engine_cc_range: '2000-2500', is_popular: false },
        { name: 'Corolla',    name_bn: 'করোলা',     slug: 'corolla',    body_types: ['sedan'],            fuel_types: ['petrol','hybrid'], years_available: '1966-2023', engine_cc_range: '1500-2000', is_popular: true  },
        { name: 'Camry',      name_bn: 'ক্যামরি',   slug: 'camry',      body_types: ['sedan'],            fuel_types: ['petrol','hybrid'], years_available: '1982-2023', engine_cc_range: '2000-3500', is_popular: false },
        { name: 'Wish',       name_bn: 'উইশ',       slug: 'wish',       body_types: ['minivan'],          fuel_types: ['petrol'],          years_available: '2003-2017', engine_cc_range: '1800-2000', is_popular: false },
        { name: 'Noah',       name_bn: 'নোয়া',      slug: 'noah',       body_types: ['minivan'],          fuel_types: ['petrol','hybrid'], years_available: '1998-2022', engine_cc_range: '1800-2000', is_popular: false },
        { name: 'Voxy',       name_bn: 'ভক্সি',     slug: 'voxy',       body_types: ['minivan'],          fuel_types: ['petrol','hybrid'], years_available: '2001-2022', engine_cc_range: '1800-2000', is_popular: false },
        { name: 'Alphard',    name_bn: 'আলফার্ড',   slug: 'alphard',    body_types: ['minivan'],          fuel_types: ['petrol','hybrid'], years_available: '2002-2023', engine_cc_range: '2500-3500', is_popular: false },
        { name: 'IST',        name_bn: 'আইএসটি',    slug: 'ist',        body_types: ['hatchback'],        fuel_types: ['petrol'],          years_available: '2002-2007', engine_cc_range: '1300-1500', is_popular: false },
        { name: 'Spade',      name_bn: 'স্পেড',     slug: 'spade',      body_types: ['hatchback'],        fuel_types: ['petrol'],          years_available: '2012-2020', engine_cc_range: '1300-1500', is_popular: false },
        { name: 'Rumion',     name_bn: 'রুমিয়ন',   slug: 'rumion',     body_types: ['hatchback'],        fuel_types: ['petrol'],          years_available: '2007-2016', engine_cc_range: '1500',      is_popular: false },
        { name: 'CHR',        name_bn: 'সিএইচআর',   slug: 'chr',        body_types: ['suv'],              fuel_types: ['petrol','hybrid'], years_available: '2016-2023', engine_cc_range: '1200-2000', is_popular: false },
      ],
    },
    {
      name: 'Honda', name_bn: 'হোন্ডা', slug: 'honda',
      country_of_origin: 'Japan', is_popular: true,
      models: [
        { name: 'Fit',      name_bn: 'ফিট',      slug: 'fit',      body_types: ['hatchback'],  fuel_types: ['petrol','hybrid'], years_available: '2001-2022', engine_cc_range: '1300-1500', is_popular: true  },
        { name: 'City',     name_bn: 'সিটি',     slug: 'city',     body_types: ['sedan'],      fuel_types: ['petrol','hybrid'], years_available: '1996-2023', engine_cc_range: '1300-1500', is_popular: true  },
        { name: 'Civic',    name_bn: 'সিভিক',    slug: 'civic',    body_types: ['sedan'],      fuel_types: ['petrol','hybrid'], years_available: '1972-2023', engine_cc_range: '1500-2000', is_popular: true  },
        { name: 'Accord',   name_bn: 'অ্যাকর্ড', slug: 'accord',   body_types: ['sedan'],      fuel_types: ['petrol','hybrid'], years_available: '1976-2023', engine_cc_range: '2000-3500', is_popular: false },
        { name: 'CR-V',     name_bn: 'সিআর-ভি',  slug: 'crv',      body_types: ['suv'],        fuel_types: ['petrol','hybrid'], years_available: '1995-2023', engine_cc_range: '1500-2000', is_popular: false },
        { name: 'Vezel',    name_bn: 'ভেজেল',    slug: 'vezel',    body_types: ['suv'],        fuel_types: ['petrol','hybrid'], years_available: '2013-2023', engine_cc_range: '1500-2000', is_popular: true  },
        { name: 'HR-V',     name_bn: 'এইচআর-ভি', slug: 'hrv',      body_types: ['suv'],        fuel_types: ['petrol'],          years_available: '1998-2023', engine_cc_range: '1500-2000', is_popular: false },
        { name: 'Freed',    name_bn: 'ফ্রিড',    slug: 'freed',    body_types: ['minivan'],    fuel_types: ['petrol','hybrid'], years_available: '2008-2022', engine_cc_range: '1500',      is_popular: false },
        { name: 'Shuttle',  name_bn: 'শাটল',     slug: 'shuttle',  body_types: ['wagon'],      fuel_types: ['petrol','hybrid'], years_available: '2011-2022', engine_cc_range: '1300-1500', is_popular: false },
        { name: 'Jazz',     name_bn: 'জ্যাজ',    slug: 'jazz',     body_types: ['hatchback'],  fuel_types: ['petrol','hybrid'], years_available: '2001-2020', engine_cc_range: '1200-1500', is_popular: false },
        { name: 'Grace',    name_bn: 'গ্রেস',    slug: 'grace',    body_types: ['sedan'],      fuel_types: ['petrol','hybrid'], years_available: '2014-2020', engine_cc_range: '1300-1500', is_popular: false },
        { name: 'Mobilio',  name_bn: 'মোবিলিও',  slug: 'mobilio',  body_types: ['minivan'],    fuel_types: ['petrol'],          years_available: '2013-2020', engine_cc_range: '1500',      is_popular: false },
        { name: 'Step WGN', name_bn: 'স্টেপ ওয়াগন', slug: 'step-wgn', body_types: ['minivan'], fuel_types: ['petrol','hybrid'], years_available: '1996-2022', engine_cc_range: '1500-2000', is_popular: false },
      ],
    },
    {
      name: 'Nissan', name_bn: 'নিসান', slug: 'nissan',
      country_of_origin: 'Japan', is_popular: true,
      models: [
        { name: 'March',    name_bn: 'মার্চ',    slug: 'march',    body_types: ['hatchback'], fuel_types: ['petrol'],         years_available: '1982-2021', engine_cc_range: '1000-1500', is_popular: true  },
        { name: 'Tiida',    name_bn: 'টিডা',     slug: 'tiida',    body_types: ['sedan','hatchback'], fuel_types: ['petrol'], years_available: '2004-2012', engine_cc_range: '1500-1800', is_popular: false },
        { name: 'Sylphy',   name_bn: 'সিলফি',    slug: 'sylphy',   body_types: ['sedan'],     fuel_types: ['petrol','hybrid'], years_available: '2000-2021', engine_cc_range: '1600-2000', is_popular: false },
        { name: 'X-Trail',  name_bn: 'এক্স-ট্রেইল', slug: 'x-trail', body_types: ['suv'],   fuel_types: ['diesel','petrol'], years_available: '2000-2023', engine_cc_range: '2000-2500', is_popular: false },
        { name: 'Note',     name_bn: 'নোট',      slug: 'note',     body_types: ['hatchback'], fuel_types: ['petrol','hybrid'], years_available: '2005-2022', engine_cc_range: '1200-1600', is_popular: true  },
        { name: 'Wingroad', name_bn: 'উইংরোড',  slug: 'wingroad', body_types: ['wagon'],     fuel_types: ['petrol'],          years_available: '1996-2018', engine_cc_range: '1500-1800', is_popular: false },
        { name: 'AD',       name_bn: 'এডি',      slug: 'ad',       body_types: ['wagon'],     fuel_types: ['petrol'],          years_available: '1982-2018', engine_cc_range: '1500-1600', is_popular: false },
        { name: 'Juke',     name_bn: 'জুক',      slug: 'juke',     body_types: ['suv'],       fuel_types: ['petrol'],          years_available: '2010-2019', engine_cc_range: '1600-1900', is_popular: false },
      ],
    },
    {
      name: 'Suzuki', name_bn: 'সুজুকি', slug: 'suzuki',
      country_of_origin: 'Japan', is_popular: true,
      models: [
        { name: 'Alto',        name_bn: 'অল্টো',       slug: 'alto',        body_types: ['hatchback'], fuel_types: ['petrol','cng'], years_available: '1979-2023', engine_cc_range: '660-800',   is_popular: true  },
        { name: 'Swift',       name_bn: 'সুইফট',       slug: 'swift',       body_types: ['hatchback'], fuel_types: ['petrol'],       years_available: '2004-2023', engine_cc_range: '1000-1300', is_popular: true  },
        { name: 'Wagon R',     name_bn: 'ওয়াগন আর',   slug: 'wagon-r',     body_types: ['hatchback'], fuel_types: ['petrol'],       years_available: '1993-2023', engine_cc_range: '660-1000',  is_popular: true  },
        { name: 'Baleno',      name_bn: 'বালেনো',      slug: 'baleno',      body_types: ['hatchback'], fuel_types: ['petrol'],       years_available: '2015-2023', engine_cc_range: '1000-1200', is_popular: false },
        { name: 'Ciaz',        name_bn: 'সিয়াজ',      slug: 'ciaz',        body_types: ['sedan'],     fuel_types: ['petrol'],       years_available: '2014-2022', engine_cc_range: '1200-1400', is_popular: false },
        { name: 'Dzire',       name_bn: 'ডিজায়ার',    slug: 'dzire',       body_types: ['sedan'],     fuel_types: ['petrol'],       years_available: '2008-2023', engine_cc_range: '1200-1300', is_popular: false },
        { name: 'Ertiga',      name_bn: 'আর্টিগা',     slug: 'ertiga',      body_types: ['minivan'],   fuel_types: ['petrol'],       years_available: '2012-2023', engine_cc_range: '1400-1500', is_popular: false },
        { name: 'Jimny',       name_bn: 'জিমনি',       slug: 'jimny',       body_types: ['suv'],       fuel_types: ['petrol'],       years_available: '1970-2023', engine_cc_range: '660-1500',  is_popular: false },
        { name: 'Grand Vitara', name_bn: 'গ্র্যান্ড ভিটারা', slug: 'grand-vitara', body_types: ['suv'], fuel_types: ['petrol'], years_available: '1998-2022', engine_cc_range: '1600-2400', is_popular: false },
        { name: 'SX4',         name_bn: 'এসএক্স৪',    slug: 'sx4',         body_types: ['suv'],       fuel_types: ['petrol'],       years_available: '2006-2016', engine_cc_range: '1500-2000', is_popular: false },
        { name: 'Ignis',       name_bn: 'ইগনিস',       slug: 'ignis',       body_types: ['hatchback'], fuel_types: ['petrol'],       years_available: '2016-2023', engine_cc_range: '1200',      is_popular: false },
        { name: 'S-Presso',    name_bn: 'এস-প্রেসো',  slug: 's-presso',    body_types: ['hatchback'], fuel_types: ['petrol'],       years_available: '2019-2023', engine_cc_range: '1000',      is_popular: false },
      ],
    },
    {
      name: 'Mitsubishi', name_bn: 'মিতসুবিশি', slug: 'mitsubishi',
      country_of_origin: 'Japan', is_popular: false,
      models: [
        { name: 'Lancer',        name_bn: 'ল্যান্সার',   slug: 'lancer',        body_types: ['sedan'],  fuel_types: ['petrol'],         years_available: '1973-2017', engine_cc_range: '1300-2000', is_popular: false },
        { name: 'Outlander',     name_bn: 'আউটল্যান্ডার', slug: 'outlander',   body_types: ['suv'],    fuel_types: ['petrol','hybrid'], years_available: '2001-2023', engine_cc_range: '2000-3000', is_popular: false },
        { name: 'Pajero',        name_bn: 'পাজেরো',      slug: 'pajero',        body_types: ['suv'],    fuel_types: ['diesel','petrol'], years_available: '1982-2019', engine_cc_range: '2500-3500', is_popular: false },
        { name: 'Pajero Sport',  name_bn: 'পাজেরো স্পোর্ট', slug: 'pajero-sport', body_types: ['suv'], fuel_types: ['diesel'],         years_available: '1996-2023', engine_cc_range: '2400-3200', is_popular: false },
        { name: 'ASX',           name_bn: 'এএসএক্স',     slug: 'asx',           body_types: ['suv'],    fuel_types: ['petrol'],         years_available: '2010-2023', engine_cc_range: '1600-2000', is_popular: false },
        { name: 'Eclipse Cross',  name_bn: 'ইক্লিপস ক্রস', slug: 'eclipse-cross', body_types: ['suv'],  fuel_types: ['petrol','hybrid'], years_available: '2017-2023', engine_cc_range: '1500-2400', is_popular: false },
      ],
    },
    {
      name: 'Hyundai', name_bn: 'হুন্দাই', slug: 'hyundai',
      country_of_origin: 'South Korea', is_popular: true,
      models: [
        { name: 'Accent',     name_bn: 'অ্যাকসেন্ট', slug: 'accent',     body_types: ['sedan','hatchback'], fuel_types: ['petrol'], years_available: '1994-2023', engine_cc_range: '1400-1600', is_popular: true  },
        { name: 'Elantra',    name_bn: 'এলান্ট্রা',  slug: 'elantra',    body_types: ['sedan'],             fuel_types: ['petrol'], years_available: '1990-2023', engine_cc_range: '1600-2000', is_popular: false },
        { name: 'Tucson',     name_bn: 'টাকসন',      slug: 'tucson',     body_types: ['suv'],               fuel_types: ['petrol','diesel'], years_available: '2004-2023', engine_cc_range: '1600-2000', is_popular: false },
        { name: 'Santa Fe',   name_bn: 'সান্তা ফে',  slug: 'santa-fe',   body_types: ['suv'],               fuel_types: ['diesel','petrol'], years_available: '2000-2023', engine_cc_range: '2000-3500', is_popular: false },
        { name: 'Sonata',     name_bn: 'সোনাটা',     slug: 'sonata',     body_types: ['sedan'],             fuel_types: ['petrol','hybrid'], years_available: '1985-2023', engine_cc_range: '2000-2400', is_popular: false },
        { name: 'Creta',      name_bn: 'ক্রেটা',     slug: 'creta',      body_types: ['suv'],               fuel_types: ['petrol'],          years_available: '2015-2023', engine_cc_range: '1400-1500', is_popular: false },
        { name: 'Grand i10',  name_bn: 'গ্র্যান্ড আই১০', slug: 'grand-i10', body_types: ['hatchback'],    fuel_types: ['petrol'],          years_available: '2013-2023', engine_cc_range: '1200',      is_popular: false },
        { name: 'Verna',      name_bn: 'ভার্না',      slug: 'verna',      body_types: ['sedan'],             fuel_types: ['petrol'],          years_available: '2006-2023', engine_cc_range: '1400-1600', is_popular: false },
      ],
    },
    {
      name: 'Kia', name_bn: 'কিয়া', slug: 'kia',
      country_of_origin: 'South Korea', is_popular: false,
      models: [
        { name: 'Picanto',   name_bn: 'পিকান্তো',  slug: 'picanto',   body_types: ['hatchback'], fuel_types: ['petrol'], years_available: '2004-2023', engine_cc_range: '1000-1250', is_popular: false },
        { name: 'Rio',       name_bn: 'রিও',        slug: 'rio',       body_types: ['sedan','hatchback'], fuel_types: ['petrol'], years_available: '2000-2023', engine_cc_range: '1400-1600', is_popular: false },
        { name: 'Sportage',  name_bn: 'স্পোর্টেজ', slug: 'sportage',  body_types: ['suv'],       fuel_types: ['petrol','diesel'], years_available: '1993-2023', engine_cc_range: '1600-2400', is_popular: false },
        { name: 'Sorento',   name_bn: 'সোরেন্টো',  slug: 'sorento',   body_types: ['suv'],       fuel_types: ['diesel','hybrid'], years_available: '2002-2023', engine_cc_range: '2000-3500', is_popular: false },
        { name: 'Carnival',  name_bn: 'কার্নিভাল', slug: 'carnival',  body_types: ['minivan'],   fuel_types: ['diesel'],          years_available: '1998-2023', engine_cc_range: '2200-3500', is_popular: false },
      ],
    },
    {
      name: 'BMW', name_bn: 'বিএমডব্লিউ', slug: 'bmw',
      country_of_origin: 'Germany', is_popular: false,
      models: [
        { name: '3 Series', name_bn: '৩ সিরিজ', slug: '3-series', body_types: ['sedan'], fuel_types: ['petrol','diesel','hybrid'], years_available: '1975-2023', engine_cc_range: '1500-3000', is_popular: false },
        { name: '5 Series', name_bn: '৫ সিরিজ', slug: '5-series', body_types: ['sedan'], fuel_types: ['petrol','diesel','hybrid'], years_available: '1972-2023', engine_cc_range: '2000-4400', is_popular: false },
        { name: '7 Series', name_bn: '৭ সিরিজ', slug: '7-series', body_types: ['sedan'], fuel_types: ['petrol','hybrid'],           years_available: '1977-2023', engine_cc_range: '3000-6600', is_popular: false },
        { name: 'X3',       name_bn: 'এক্স৩',   slug: 'x3',      body_types: ['suv'],   fuel_types: ['petrol','diesel'],           years_available: '2003-2023', engine_cc_range: '2000-3000', is_popular: false },
        { name: 'X5',       name_bn: 'এক্স৫',   slug: 'x5',      body_types: ['suv'],   fuel_types: ['petrol','diesel','hybrid'],  years_available: '1999-2023', engine_cc_range: '3000-5000', is_popular: false },
      ],
    },
    {
      name: 'Mercedes-Benz', name_bn: 'মার্সিডিজ-বেঞ্জ', slug: 'mercedes-benz',
      country_of_origin: 'Germany', is_popular: false,
      models: [
        { name: 'C-Class', name_bn: 'সি-ক্লাস', slug: 'c-class', body_types: ['sedan'], fuel_types: ['petrol','diesel','hybrid'], years_available: '1993-2023', engine_cc_range: '1500-4000', is_popular: false },
        { name: 'E-Class', name_bn: 'ই-ক্লাস', slug: 'e-class', body_types: ['sedan'], fuel_types: ['petrol','diesel','hybrid'], years_available: '1993-2023', engine_cc_range: '2000-5500', is_popular: false },
        { name: 'GLC',     name_bn: 'জিএলসি',  slug: 'glc',     body_types: ['suv'],   fuel_types: ['petrol','diesel','hybrid'], years_available: '2015-2023', engine_cc_range: '2000-3000', is_popular: false },
        { name: 'GLE',     name_bn: 'জিএলই',   slug: 'gle',     body_types: ['suv'],   fuel_types: ['petrol','diesel','hybrid'], years_available: '1997-2023', engine_cc_range: '2000-5500', is_popular: false },
      ],
    },
    {
      name: 'Volkswagen', name_bn: 'ভক্সওয়াগেন', slug: 'volkswagen',
      country_of_origin: 'Germany', is_popular: false,
      models: [
        { name: 'Passat',  name_bn: 'পাসাট',  slug: 'passat',  body_types: ['sedan'], fuel_types: ['petrol','diesel'], years_available: '1973-2023', engine_cc_range: '1400-2000', is_popular: false },
        { name: 'Golf',    name_bn: 'গলফ',    slug: 'golf',    body_types: ['hatchback'], fuel_types: ['petrol','diesel','hybrid'], years_available: '1974-2023', engine_cc_range: '1000-2000', is_popular: false },
        { name: 'Tiguan',  name_bn: 'টিগুয়ান', slug: 'tiguan', body_types: ['suv'],   fuel_types: ['petrol','diesel'], years_available: '2007-2023', engine_cc_range: '1400-2000', is_popular: false },
      ],
    },
    {
      name: 'Haval', name_bn: 'হাভাল', slug: 'haval',
      country_of_origin: 'China', is_popular: false,
      models: [
        { name: 'H6',     name_bn: 'এইচ৬',    slug: 'h6',     body_types: ['suv'], fuel_types: ['petrol'], years_available: '2011-2023', engine_cc_range: '1500-2000', is_popular: false },
        { name: 'Jolion', name_bn: 'জোলিয়ন', slug: 'jolion', body_types: ['suv'], fuel_types: ['petrol'], years_available: '2020-2023', engine_cc_range: '1500',      is_popular: false },
        { name: 'H9',     name_bn: 'এইচ৯',    slug: 'h9',     body_types: ['suv'], fuel_types: ['petrol'], years_available: '2014-2023', engine_cc_range: '2000',      is_popular: false },
      ],
    },
    {
      name: 'MG', name_bn: 'এমজি', slug: 'mg',
      country_of_origin: 'China', is_popular: false,
      models: [
        { name: 'ZS',  name_bn: 'জেডএস', slug: 'zs',  body_types: ['suv'],       fuel_types: ['petrol','electric'], years_available: '2017-2023', engine_cc_range: '1000-1500', is_popular: false },
        { name: 'HS',  name_bn: 'এইচএস', slug: 'hs',  body_types: ['suv'],       fuel_types: ['petrol','hybrid'],  years_available: '2018-2023', engine_cc_range: '1500-2000', is_popular: false },
        { name: 'MG5', name_bn: 'এমজি৫', slug: 'mg5', body_types: ['hatchback'], fuel_types: ['electric'],         years_available: '2020-2023', engine_cc_range: '0',         is_popular: false },
      ],
    },
    {
      name: 'Proton', name_bn: 'প্রোটন', slug: 'proton',
      country_of_origin: 'Malaysia', is_popular: false,
      models: [
        { name: 'Saga', name_bn: 'সাগা', slug: 'saga', body_types: ['sedan'], fuel_types: ['petrol'], years_available: '1985-2023', engine_cc_range: '1300-1600', is_popular: false },
        { name: 'X50',  name_bn: 'এক্স৫০', slug: 'x50', body_types: ['suv'], fuel_types: ['petrol'],  years_available: '2020-2023', engine_cc_range: '1500',      is_popular: false },
        { name: 'X70',  name_bn: 'এক্স৭০', slug: 'x70', body_types: ['suv'], fuel_types: ['petrol'],  years_available: '2018-2023', engine_cc_range: '1800',      is_popular: false },
      ],
    },
  ];

  for (const makeData of MAKES) {
    const make = await prisma.vehicleReferenceMake.upsert({
      where:  { slug: makeData.slug },
      update: { name: makeData.name, name_bn: makeData.name_bn, is_popular: makeData.is_popular },
      create: {
        name:               makeData.name,
        name_bn:            makeData.name_bn,
        slug:               makeData.slug,
        country_of_origin:  makeData.country_of_origin,
        is_popular:         makeData.is_popular,
      },
    });

    for (const modelData of makeData.models) {
      await prisma.vehicleReferenceModel.upsert({
        where:  { make_id_slug: { make_id: make.id, slug: modelData.slug } },
        update: { name: modelData.name, name_bn: modelData.name_bn, is_popular: modelData.is_popular },
        create: {
          make_id:          make.id,
          name:             modelData.name,
          name_bn:          modelData.name_bn,
          slug:             modelData.slug,
          body_types:       modelData.body_types,
          fuel_types:       modelData.fuel_types,
          years_available:  modelData.years_available,
          engine_cc_range:  modelData.engine_cc_range,
          is_popular:       modelData.is_popular,
        },
      });
    }
  }

  const makeCount  = await prisma.vehicleReferenceMake.count();
  const modelCount = await prisma.vehicleReferenceModel.count();
  console.log(`   ✅ ${makeCount} makes, ${modelCount} models`);
}

// ─────────────────────────────────────────────────────────────────
// 3. EXPENSE CATEGORIES
// ─────────────────────────────────────────────────────────────────
async function seedExpenseCategories() {
  console.log('💰 Seeding expense categories...');

  const VEHICLE_EXPENSE_CATEGORIES = [
    { slug: 'engine_service',  name: 'Engine Service',       name_bn: 'ইঞ্জিন সার্ভিস',      icon: '⚙️',  sort_order: 1  },
    { slug: 'paint',           name: 'Paint',                name_bn: 'পেইন্ট',               icon: '🎨',  sort_order: 2  },
    { slug: 'ac_recharge',     name: 'AC Recharge',          name_bn: 'এসি রিচার্জ',          icon: '❄️',  sort_order: 3  },
    { slug: 'battery',         name: 'Battery',              name_bn: 'ব্যাটারি',              icon: '🔋',  sort_order: 4  },
    { slug: 'tyre_change',     name: 'Tyre Change',          name_bn: 'টায়ার পরিবর্তন',      icon: '🔄',  sort_order: 5  },
    { slug: 'upholstery',      name: 'Upholstery',           name_bn: 'আপহোলস্টারি',          icon: '🪑',  sort_order: 6  },
    { slug: 'windshield',      name: 'Windshield',           name_bn: 'উইন্ডশিল্ড',           icon: '🪟',  sort_order: 7  },
    { slug: 'bodywork',        name: 'Bodywork',             name_bn: 'বডিওয়ার্ক',           icon: '🔨',  sort_order: 8  },
    { slug: 'parts',           name: 'Parts',                name_bn: 'যন্ত্রাংশ',            icon: '🔧',  sort_order: 9  },
    { slug: 'detailing',       name: 'Detailing',            name_bn: 'ডিটেইলিং',             icon: '✨',  sort_order: 10 },
    { slug: 'transport',       name: 'Transport',            name_bn: 'পরিবহন',               icon: '🚚',  sort_order: 11 },
    { slug: 'inspection_fee',  name: 'Inspection Fee',       name_bn: 'পরিদর্শন ফি',         icon: '🔍',  sort_order: 12 },
    { slug: 'registration',    name: 'Registration',         name_bn: 'নিবন্ধন',              icon: '📄',  sort_order: 13 },
    { slug: 'documentation',   name: 'Documentation',        name_bn: 'ডকুমেন্টেশন',          icon: '📋',  sort_order: 14 },
    { slug: 'fuel_top_up',     name: 'Fuel Top-Up',          name_bn: 'জ্বালানি ভরা',         icon: '⛽',  sort_order: 15 },
    { slug: 'other_vehicle',   name: 'Other (Vehicle)',      name_bn: 'অন্যান্য (গাড়ি)',     icon: '📦',  sort_order: 16 },
  ];

  const OPERATIONAL_EXPENSE_CATEGORIES = [
    { slug: 'staff_salary',      name: 'Staff Salary',          name_bn: 'কর্মচারী বেতন',      icon: '👤',  sort_order: 1  },
    { slug: 'electricity',       name: 'Electricity',           name_bn: 'বিদ্যুৎ',              icon: '💡',  sort_order: 2  },
    { slug: 'water',             name: 'Water',                 name_bn: 'পানি',                 icon: '💧',  sort_order: 3  },
    { slug: 'rent',              name: 'Rent',                  name_bn: 'ভাড়া',                icon: '🏠',  sort_order: 4  },
    { slug: 'software',          name: 'Software Subscriptions', name_bn: 'সফটওয়্যার সাবস্ক্রিপশন', icon: '💻', sort_order: 5 },
    { slug: 'internet',          name: 'Internet',              name_bn: 'ইন্টারনেট',            icon: '📶',  sort_order: 6  },
    { slug: 'vehicle_logistics', name: 'Vehicle Logistics',     name_bn: 'গাড়ি পরিবহন',         icon: '🚛',  sort_order: 7  },
    { slug: 'advertising',       name: 'Advertising',           name_bn: 'বিজ্ঞাপন',             icon: '📢',  sort_order: 8  },
    { slug: 'office_supplies',   name: 'Office Supplies',       name_bn: 'অফিস সামগ্রী',        icon: '📎',  sort_order: 9  },
    { slug: 'accountant_fees',   name: 'Accountant Fees',       name_bn: 'হিসাবরক্ষক ফি',      icon: '🧮',  sort_order: 10 },
    { slug: 'bank_charges',      name: 'Bank Charges',          name_bn: 'ব্যাংক চার্জ',         icon: '🏦',  sort_order: 11 },
    { slug: 'fuel',              name: 'Fuel',                  name_bn: 'জ্বালানি',              icon: '⛽',  sort_order: 12 },
    { slug: 'cleaning',          name: 'Cleaning',              name_bn: 'পরিষ্কার',              icon: '🧹',  sort_order: 13 },
    { slug: 'security',          name: 'Security',              name_bn: 'নিরাপত্তা',             icon: '🔒',  sort_order: 14 },
    { slug: 'insurance',         name: 'Insurance',             name_bn: 'বীমা',                 icon: '🛡️',  sort_order: 15 },
    { slug: 'telephone',         name: 'Telephone / Mobile',    name_bn: 'টেলিফোন / মোবাইল',   icon: '📱',  sort_order: 16 },
    { slug: 'other_operational', name: 'Other (Operational)',   name_bn: 'অন্যান্য (পরিচালনামূলক)', icon: '📦', sort_order: 17 },
  ];

  for (const cat of VEHICLE_EXPENSE_CATEGORIES) {
    await prisma.vehicleExpenseCategory.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, name_bn: cat.name_bn },
      create: { ...cat },
    });
  }

  for (const cat of OPERATIONAL_EXPENSE_CATEGORIES) {
    await prisma.operationalExpenseCategory.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, name_bn: cat.name_bn },
      create: { ...cat },
    });
  }

  const v1Count = await prisma.vehicleExpenseCategory.count();
  const v2Count = await prisma.operationalExpenseCategory.count();
  console.log(`   ✅ ${v1Count} vehicle expense categories, ${v2Count} operational expense categories`);
}

// ─────────────────────────────────────────────────────────────────
// 4. PLAN CONFIGS
// ─────────────────────────────────────────────────────────────────
async function seedPlanConfigs() {
  console.log('💳 Seeding subscription plan configs...');

  const PLANS = [
    {
      tier:            'free',
      display_name:    'Free',
      display_name_bn: 'ফ্রি',
      monthly_price_bdt: 0,
      listing_limit:   10,
      staff_seat_limit: 1,
      location_limit:  1,
      sms_quota_monthly: 100,
      features: {
        marketplace_auto_publish: true,
        dealer_microsite:         true,
        subdomain_only:           true,
        custom_domain:            false,
        crm_basic:                true,
        crm_full:                 false,
        crm_ai_scoring:           false,
        sales_invoicing:          true,
        expense_tracking:         true,
        maestro_ai:               false,
        maestro_basic:            false,
        automation_whatsapp_basic: false,
        automation_whatsapp_advanced: false,
        automation_facebook:      false,
        automation_social:        false,
        automation_email:         false,
        analytics_basic:          true,
        analytics_standard:       false,
        analytics_advanced:       false,
        analytics_export:         false,
        facebook_lead_ad_sync:    false,
        gmc_feed:                 false,
        fb_catalog:               false,
        support_in_app:           true,
        support_whatsapp:         false,
        support_call:             false,
        support_dedicated:        false,
        free_listing_boosts_monthly: 0,
        per_lead_billing:         true,
      },
    },
    {
      tier:            'starter',
      display_name:    'Starter',
      display_name_bn: 'স্টার্টার',
      monthly_price_bdt: 2999,
      listing_limit:   50,
      staff_seat_limit: 3,
      location_limit:  1,
      sms_quota_monthly: 500,
      features: {
        marketplace_auto_publish: true,
        dealer_microsite:         true,
        subdomain_only:           true,
        custom_domain:            false,
        crm_basic:                false,
        crm_full:                 true,
        crm_ai_scoring:           false,
        sales_invoicing:          true,
        expense_tracking:         true,
        maestro_ai:               false,
        maestro_basic:            true,
        automation_whatsapp_basic: true,
        automation_whatsapp_advanced: false,
        automation_facebook:      false,
        automation_social:        false,
        automation_email:         false,
        analytics_basic:          false,
        analytics_standard:       true,
        analytics_advanced:       false,
        analytics_export:         false,
        facebook_lead_ad_sync:    false,
        gmc_feed:                 false,
        fb_catalog:               false,
        support_in_app:           false,
        support_whatsapp:         true,
        support_call:             false,
        support_dedicated:        false,
        free_listing_boosts_monthly: 0,
        per_lead_billing:         false,
      },
    },
    {
      tier:            'professional',
      display_name:    'Professional',
      display_name_bn: 'প্রফেশনাল',
      monthly_price_bdt: 5999,
      listing_limit:   200,
      staff_seat_limit: 10,
      location_limit:  2,
      sms_quota_monthly: 2000,
      features: {
        marketplace_auto_publish: true,
        dealer_microsite:         true,
        subdomain_only:           true,
        custom_domain:            false,
        crm_basic:                false,
        crm_full:                 true,
        crm_ai_scoring:           false,
        sales_invoicing:          true,
        expense_tracking:         true,
        maestro_ai:               false,
        maestro_basic:            false,
        maestro_full:             true,
        automation_whatsapp_basic: true,
        automation_whatsapp_advanced: true,
        automation_facebook:      true,
        automation_social:        true,
        automation_email:         true,
        analytics_basic:          false,
        analytics_standard:       false,
        analytics_advanced:       true,
        analytics_export:         false,
        facebook_lead_ad_sync:    true,
        gmc_feed:                 true,
        fb_catalog:               true,
        support_in_app:           false,
        support_whatsapp:         true,
        support_call:             true,
        support_dedicated:        false,
        free_listing_boosts_monthly: 2,
        per_lead_billing:         false,
      },
    },
    {
      tier:            'business',
      display_name:    'Business',
      display_name_bn: 'বিজনেস',
      monthly_price_bdt: 9999,
      listing_limit:   500,
      staff_seat_limit: 25,
      location_limit:  5,
      sms_quota_monthly: 5000,
      features: {
        marketplace_auto_publish: true,
        dealer_microsite:         true,
        subdomain_only:           false,
        custom_domain:            true,
        crm_basic:                false,
        crm_full:                 true,
        crm_ai_scoring:           true,
        sales_invoicing:          true,
        expense_tracking:         true,
        maestro_ai:               false,
        maestro_basic:            false,
        maestro_full:             true,
        automation_whatsapp_basic: true,
        automation_whatsapp_advanced: true,
        automation_facebook:      true,
        automation_social:        true,
        automation_email:         true,
        analytics_basic:          false,
        analytics_standard:       false,
        analytics_advanced:       true,
        analytics_export:         true,
        facebook_lead_ad_sync:    true,
        gmc_feed:                 true,
        fb_catalog:               true,
        support_in_app:           false,
        support_whatsapp:         true,
        support_call:             true,
        support_dedicated:        true,
        free_listing_boosts_monthly: 5,
        per_lead_billing:         false,
      },
    },
    {
      tier:            'enterprise',
      display_name:    'Enterprise',
      display_name_bn: 'এন্টারপ্রাইজ',
      monthly_price_bdt: 0,
      listing_limit:   -1,
      staff_seat_limit: -1,
      location_limit:  -1,
      sms_quota_monthly: -1,
      features: {
        marketplace_auto_publish: true,
        dealer_microsite:         true,
        subdomain_only:           false,
        custom_domain:            true,
        white_label:              true,
        crm_basic:                false,
        crm_full:                 true,
        crm_ai_scoring:           true,
        sales_invoicing:          true,
        expense_tracking:         true,
        maestro_ai:               true,
        maestro_basic:            false,
        maestro_full:             true,
        automation_whatsapp_basic: true,
        automation_whatsapp_advanced: true,
        automation_whatsapp_custom: true,
        automation_facebook:      true,
        automation_social:        true,
        automation_email:         true,
        analytics_basic:          false,
        analytics_standard:       false,
        analytics_advanced:       true,
        analytics_export:         true,
        analytics_custom_bi:      true,
        facebook_lead_ad_sync:    true,
        gmc_feed:                 true,
        fb_catalog:               true,
        support_in_app:           false,
        support_whatsapp:         true,
        support_call:             true,
        support_dedicated:        true,
        sla_contract:             true,
        free_listing_boosts_monthly: -1,
        per_lead_billing:         false,
      },
    },
  ];

  for (const plan of PLANS) {
    await prisma.planConfig.upsert({
      where:  { tier: plan.tier as any },
      update: {
        display_name:        plan.display_name,
        display_name_bn:     plan.display_name_bn,
        monthly_price_bdt:   plan.monthly_price_bdt,
        listing_limit:       plan.listing_limit,
        staff_seat_limit:    plan.staff_seat_limit,
        location_limit:      plan.location_limit,
        sms_quota_monthly:   plan.sms_quota_monthly,
        features:            plan.features as any,
      },
      create: {
        tier:                plan.tier as any,
        display_name:        plan.display_name,
        display_name_bn:     plan.display_name_bn,
        monthly_price_bdt:   plan.monthly_price_bdt,
        listing_limit:       plan.listing_limit,
        staff_seat_limit:    plan.staff_seat_limit,
        location_limit:      plan.location_limit,
        sms_quota_monthly:   plan.sms_quota_monthly,
        features:            plan.features as any,
      },
    });
  }

  const count = await prisma.planConfig.count();
  console.log(`   ✅ ${count} plan configs`);
}

// ─────────────────────────────────────────────────────────────────
// 5. PLATFORM CALENDAR
// BD public holidays + Eid dates 2025–2027
// Used for festival mode suppression in AutomationHub
// ─────────────────────────────────────────────────────────────────
async function seedPlatformCalendar() {
  console.log('📅 Seeding BD platform calendar...');

  const CALENDAR_EVENTS: {
    event_name:    string;
    event_name_bn: string;
    event_date:    string;
    event_type:    'public_holiday' | 'eid_ul_fitr' | 'eid_ul_adha' | 'national_day' | 'optional_holiday';
    suppress_automation: boolean;
    suppress_days_before: number;
    suppress_days_after:  number;
    notes:         string;
  }[] = [
    // ── 2025 ─────────────────────────────────────────────────────
    { event_name: 'International Mother Language Day',    event_name_bn: 'আন্তর্জাতিক মাতৃভাষা দিবস', event_date: '2025-02-21', event_type: 'national_day',     suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'National holiday. Minor automation impact.' },
    { event_name: 'Eid ul-Fitr',                         event_name_bn: 'ঈদুল ফিতর',                   event_date: '2025-03-30', event_type: 'eid_ul_fitr',      suppress_automation: true,  suppress_days_before: 2, suppress_days_after: 3, notes: 'Major Eid. Suppress all non-urgent automation. Pre-Eid: surge inventory alerts.' },
    { event_name: 'Eid ul-Fitr Holiday 2',               event_name_bn: 'ঈদুল ফিতর ছুটি ২',            event_date: '2025-03-31', event_type: 'eid_ul_fitr',      suppress_automation: true,  suppress_days_before: 0, suppress_days_after: 0, notes: 'Part of Eid holiday period.' },
    { event_name: 'Eid ul-Fitr Holiday 3',               event_name_bn: 'ঈদুল ফিতর ছুটি ৩',            event_date: '2025-04-01', event_type: 'eid_ul_fitr',      suppress_automation: true,  suppress_days_before: 0, suppress_days_after: 0, notes: 'Part of Eid holiday period.' },
    { event_name: 'Independence Day',                    event_name_bn: 'স্বাধীনতা দিবস',               event_date: '2025-03-26', event_type: 'national_day',     suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'National holiday.' },
    { event_name: 'Bengali New Year (Pahela Boishakh)',  event_name_bn: 'পহেলা বৈশাখ',                 event_date: '2025-04-14', event_type: 'public_holiday',   suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'High consumer activity. Do NOT suppress.' },
    { event_name: 'May Day (Labour Day)',                event_name_bn: 'মে দিবস',                      event_date: '2025-05-01', event_type: 'public_holiday',   suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'Minor holiday.' },
    { event_name: 'Buddha Purnima',                      event_name_bn: 'বুদ্ধ পূর্ণিমা',              event_date: '2025-05-12', event_type: 'optional_holiday', suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'Optional holiday for Buddhist community.' },
    { event_name: 'Eid ul-Adha',                         event_name_bn: 'ঈদুল আযহা',                   event_date: '2025-06-06', event_type: 'eid_ul_adha',      suppress_automation: true,  suppress_days_before: 2, suppress_days_after: 3, notes: 'Major Eid. Suppress all non-urgent automation. Pre-Eid: surge inventory alerts.' },
    { event_name: 'Eid ul-Adha Holiday 2',               event_name_bn: 'ঈদুল আযহা ছুটি ২',           event_date: '2025-06-07', event_type: 'eid_ul_adha',      suppress_automation: true,  suppress_days_before: 0, suppress_days_after: 0, notes: 'Part of Eid holiday period.' },
    { event_name: 'Eid ul-Adha Holiday 3',               event_name_bn: 'ঈদুল আযহা ছুটি ৩',           event_date: '2025-06-08', event_type: 'eid_ul_adha',      suppress_automation: true,  suppress_days_before: 0, suppress_days_after: 0, notes: 'Part of Eid holiday period.' },
    { event_name: 'National Mourning Day',               event_name_bn: 'জাতীয় শোক দিবস',             event_date: '2025-08-15', event_type: 'national_day',     suppress_automation: true,  suppress_days_before: 0, suppress_days_after: 0, notes: 'Suppress marketing and promotional content. Transactional automation allowed.' },
    { event_name: 'Eid ul-Maulid (Eid-e-Miladunnabi)',  event_name_bn: 'ঈদে মিলাদুন্নবী',             event_date: '2025-09-04', event_type: 'public_holiday',   suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'Public holiday.' },
    { event_name: 'Durga Puja',                          event_name_bn: 'দুর্গাপূজা',                  event_date: '2025-10-02', event_type: 'optional_holiday', suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'Optional holiday for Hindu community.' },
    { event_name: 'Victory Day',                         event_name_bn: 'বিজয় দিবস',                  event_date: '2025-12-16', event_type: 'national_day',     suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'National holiday.' },
    { event_name: 'Christmas Day',                       event_name_bn: 'বড়দিন',                       event_date: '2025-12-25', event_type: 'optional_holiday', suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: 'Optional holiday for Christian community.' },

    // ── 2026 (approximate dates — update when confirmed by Govt) ─
    { event_name: 'International Mother Language Day 2026', event_name_bn: 'আন্তর্জাতিক মাতৃভাষা দিবস ২০২৬', event_date: '2026-02-21', event_type: 'national_day',   suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: '' },
    { event_name: 'Independence Day 2026',               event_name_bn: 'স্বাধীনতা দিবস ২০২৬',          event_date: '2026-03-26', event_type: 'national_day',     suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: '' },
    { event_name: 'Eid ul-Fitr 2026 (approx)',           event_name_bn: 'ঈদুল ফিতর ২০২৬',               event_date: '2026-03-20', event_type: 'eid_ul_fitr',      suppress_automation: true,  suppress_days_before: 2, suppress_days_after: 3, notes: 'Approximate — update when confirmed by moon sighting.' },
    { event_name: 'Bengali New Year 2026',               event_name_bn: 'পহেলা বৈশাখ ২০২৬',            event_date: '2026-04-14', event_type: 'public_holiday',   suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: '' },
    { event_name: 'Eid ul-Adha 2026 (approx)',           event_name_bn: 'ঈদুল আযহা ২০২৬',              event_date: '2026-05-27', event_type: 'eid_ul_adha',      suppress_automation: true,  suppress_days_before: 2, suppress_days_after: 3, notes: 'Approximate — update when confirmed.' },
    { event_name: 'National Mourning Day 2026',          event_name_bn: 'জাতীয় শোক দিবস ২০২৬',        event_date: '2026-08-15', event_type: 'national_day',     suppress_automation: true,  suppress_days_before: 0, suppress_days_after: 0, notes: '' },
    { event_name: 'Victory Day 2026',                   event_name_bn: 'বিজয় দিবস ২০২৬',              event_date: '2026-12-16', event_type: 'national_day',     suppress_automation: false, suppress_days_before: 0, suppress_days_after: 0, notes: '' },

    // ── 2027 (approximate) ───────────────────────────────────────
    { event_name: 'Eid ul-Fitr 2027 (approx)',           event_name_bn: 'ঈদুল ফিতর ২০২৭',               event_date: '2027-03-09', event_type: 'eid_ul_fitr',     suppress_automation: true,  suppress_days_before: 2, suppress_days_after: 3, notes: 'Approximate.' },
    { event_name: 'Eid ul-Adha 2027 (approx)',           event_name_bn: 'ঈদুল আযহা ২০২৭',              event_date: '2027-05-17', event_type: 'eid_ul_adha',     suppress_automation: true,  suppress_days_before: 2, suppress_days_after: 3, notes: 'Approximate.' },
  ];

  for (const event of CALENDAR_EVENTS) {
    await prisma.platformCalendar.upsert({
      where:  { event_date_event_name: { event_date: new Date(event.event_date), event_name: event.event_name } },
      update: { suppress_automation: event.suppress_automation, notes: event.notes },
      create: {
        event_name:            event.event_name,
        event_name_bn:         event.event_name_bn,
        event_date:            new Date(event.event_date),
        event_type:            event.event_type,
        suppress_automation:   event.suppress_automation,
        suppress_days_before:  event.suppress_days_before,
        suppress_days_after:   event.suppress_days_after,
        notes:                 event.notes,
      },
    });
  }

  const count = await prisma.platformCalendar.count();
  console.log(`   ✅ ${count} calendar events (${CALENDAR_EVENTS.filter(e => e.suppress_automation).length} with automation suppression)`);
}

// ─────────────────────────────────────────────────────────────────
// 6. LEAD LOST REASONS
// ─────────────────────────────────────────────────────────────────
async function seedLostReasons() {
  console.log('📋 Seeding lead lost reasons...');

  const LOST_REASONS = [
    { slug: 'price_difference',      label: 'Price difference',          label_bn: 'দামের পার্থক্য',          sort_order: 1  },
    { slug: 'found_elsewhere',       label: 'Bought similar car elsewhere', label_bn: 'অন্যত্র কিনেছেন',     sort_order: 2  },
    { slug: 'changed_mind',          label: 'Changed mind',               label_bn: 'মত পরিবর্তন করেছেন',     sort_order: 3  },
    { slug: 'no_budget',             label: 'Budget constraints',         label_bn: 'বাজেট সমস্যা',            sort_order: 4  },
    { slug: 'no_response',           label: 'No response after follow-ups', label_bn: 'সাড়া দেননি',           sort_order: 5  },
    { slug: 'financing_failed',      label: 'Financing issues',           label_bn: 'ফাইন্যান্সিং সমস্যা',    sort_order: 6  },
    { slug: 'sold_to_other',         label: 'Vehicle sold to another buyer', label_bn: 'গাড়িটি বিক্রি হয়ে গেছে', sort_order: 7 },
    { slug: 'quality_concern',       label: 'Condition / quality concern', label_bn: 'গাড়ির অবস্থা নিয়ে সংশয়', sort_order: 8 },
    { slug: 'not_right_model',       label: 'Not the right model',        label_bn: 'মডেল পছন্দ হয়নি',         sort_order: 9  },
    { slug: 'delayed_decision',      label: 'Delayed decision — came back later', label_bn: 'পরে আসবেন বলেছেন', sort_order: 10 },
    { slug: 'other',                 label: 'Other',                      label_bn: 'অন্যান্য',                sort_order: 11 },
  ];

  for (const reason of LOST_REASONS) {
    await prisma.leadLostReason.upsert({
      where:  { slug: reason.slug },
      update: { label: reason.label, label_bn: reason.label_bn },
      create: { ...reason },
    });
  }

  console.log(`   ✅ ${LOST_REASONS.length} lost reasons`);
}

// ─────────────────────────────────────────────────────────────────
// 7. COMMON VEHICLE FEATURES
// Used in vehicle listing feature checklist (marketplace + DMS)
// ─────────────────────────────────────────────────────────────────
async function seedVehicleFeatures() {
  console.log('🚘 Seeding vehicle feature options...');

  const FEATURES = [
    // Comfort
    { slug: 'ac',                 label: 'Air Conditioning',         label_bn: 'এয়ার কন্ডিশনিং',     category: 'comfort',   sort_order: 1  },
    { slug: 'auto_climate',       label: 'Auto Climate Control',     label_bn: 'অটো ক্লাইমেট কন্ট্রোল', category: 'comfort', sort_order: 2  },
    { slug: 'heated_seats',       label: 'Heated Seats',             label_bn: 'হিটেড সিট',             category: 'comfort',   sort_order: 3  },
    { slug: 'leather_seats',      label: 'Leather Seats',            label_bn: 'লেদার সিট',             category: 'comfort',   sort_order: 4  },
    { slug: 'sunroof',            label: 'Sunroof',                  label_bn: 'সানরুফ',                category: 'comfort',   sort_order: 5  },
    { slug: 'power_windows',      label: 'Power Windows',            label_bn: 'পাওয়ার উইন্ডো',        category: 'comfort',   sort_order: 6  },
    { slug: 'power_steering',     label: 'Power Steering',           label_bn: 'পাওয়ার স্টিয়ারিং',    category: 'comfort',   sort_order: 7  },
    // Technology
    { slug: 'navigation',         label: 'Navigation System',        label_bn: 'নেভিগেশন সিস্টেম',     category: 'technology', sort_order: 8  },
    { slug: 'reverse_camera',     label: 'Reverse Camera',           label_bn: 'রিভার্স ক্যামেরা',      category: 'technology', sort_order: 9  },
    { slug: '360_camera',         label: '360° Camera',              label_bn: '৩৬০° ক্যামেরা',        category: 'technology', sort_order: 10 },
    { slug: 'bluetooth',          label: 'Bluetooth',                label_bn: 'ব্লুটুথ',               category: 'technology', sort_order: 11 },
    { slug: 'usb_charging',       label: 'USB Charging',             label_bn: 'ইউএসবি চার্জিং',        category: 'technology', sort_order: 12 },
    { slug: 'apple_carplay',      label: 'Apple CarPlay',            label_bn: 'অ্যাপল কারপ্লে',        category: 'technology', sort_order: 13 },
    { slug: 'android_auto',       label: 'Android Auto',             label_bn: 'অ্যান্ড্রয়েড অটো',     category: 'technology', sort_order: 14 },
    { slug: 'push_start',         label: 'Push Start / Keyless',     label_bn: 'পুশ স্টার্ট / কীলেস',   category: 'technology', sort_order: 15 },
    // Safety
    { slug: 'airbags',            label: 'Airbags',                  label_bn: 'এয়ারব্যাগ',             category: 'safety',    sort_order: 16 },
    { slug: 'abs',                label: 'ABS (Anti-lock Brakes)',   label_bn: 'এবিএস ব্রেক',           category: 'safety',    sort_order: 17 },
    { slug: 'blind_spot',         label: 'Blind Spot Monitor',       label_bn: 'ব্লাইন্ড স্পট মনিটর',  category: 'safety',    sort_order: 18 },
    { slug: 'lane_assist',        label: 'Lane Assist',              label_bn: 'লেন অ্যাসিস্ট',         category: 'safety',    sort_order: 19 },
    { slug: 'collision_warning',  label: 'Collision Warning',        label_bn: 'কোলিশন ওয়ার্নিং',      category: 'safety',    sort_order: 20 },
    { slug: 'parking_sensors',    label: 'Parking Sensors',          label_bn: 'পার্কিং সেন্সর',         category: 'safety',    sort_order: 21 },
    { slug: 'central_locking',    label: 'Central Locking',          label_bn: 'সেন্ট্রাল লকিং',        category: 'safety',    sort_order: 22 },
    { slug: 'alarm',              label: 'Security Alarm',           label_bn: 'সিকিউরিটি অ্যালার্ম',   category: 'safety',    sort_order: 23 },
    // Exterior
    { slug: 'alloy_wheels',       label: 'Alloy Wheels',             label_bn: 'অ্যালয় হুইল',           category: 'exterior',  sort_order: 24 },
    { slug: 'led_headlights',     label: 'LED Headlights',           label_bn: 'এলইডি হেডলাইট',         category: 'exterior',  sort_order: 25 },
    { slug: 'fog_lights',         label: 'Fog Lights',               label_bn: 'ফগ লাইট',               category: 'exterior',  sort_order: 26 },
    { slug: 'roof_rack',          label: 'Roof Rack',                label_bn: 'রুফ র‍্যাক',             category: 'exterior',  sort_order: 27 },
    { slug: 'tow_hitch',          label: 'Tow Hitch',                label_bn: 'টো হিচ',                category: 'exterior',  sort_order: 28 },
    // BD-specific
    { slug: 'cng_converted',      label: 'CNG Converted',            label_bn: 'সিএনজি কনভার্টেড',      category: 'bd_specific', sort_order: 29 },
    { slug: 'reconditioned_japan', label: 'Reconditioned (Japan)',   label_bn: 'রিকন্ডিশন্ড (জাপান)',   category: 'bd_specific', sort_order: 30 },
    { slug: 'hybrid_battery_new', label: 'New Hybrid Battery',       label_bn: 'নতুন হাইব্রিড ব্যাটারি', category: 'bd_specific', sort_order: 31 },
  ];

  for (const feature of FEATURES) {
    await prisma.vehicleFeatureOption.upsert({
      where:  { slug: feature.slug },
      update: { label: feature.label, label_bn: feature.label_bn },
      create: { ...feature },
    });
  }

  console.log(`   ✅ ${FEATURES.length} vehicle features`);
}

// ─────────────────────────────────────────────────────────────────
// 8. INITIAL ADMIN USER
// Creates the first Super Admin account for initial platform setup
// ─────────────────────────────────────────────────────────────────
async function seedAdminUser() {
  console.log('👤 Seeding initial admin user...');

  const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || '+8801700000001';
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@autoverse.com.bd';
  const ADMIN_PASS  = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2025';

  const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);

  const existing = await prisma.adminUser.findFirst({
    where: { email: ADMIN_EMAIL }
  });

  if (existing) {
    console.log('   ℹ️  Admin user already exists — skipped');
    return;
  }

  await prisma.adminUser.create({
    data: {
      email:         ADMIN_EMAIL,
      phone:         ADMIN_PHONE,
      full_name:     'Platform Administrator',
      password_hash: passwordHash,
      admin_role:    'super_admin',
      is_active:     true,
      two_fa_enabled: false,
    }
  });

  console.log(`   ✅ Super Admin created: ${ADMIN_EMAIL}`);
  console.log(`   ⚠️  IMPORTANT: Change the default password immediately after first login!`);
  console.log(`   ⚠️  Enable 2FA on first login — it is required for all admin accounts.`);
}

// ─────────────────────────────────────────────────────────────────
// RUN SEED
// ─────────────────────────────────────────────────────────────────
main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
