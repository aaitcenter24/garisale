import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { ListingStatus, ListingType, SellerType, LeadSource, LeadPriority, LeadStage } from '@prisma/client';
import * as crypto from 'crypto';
// MeiliSearch is loaded dynamically in the constructor to avoid require() errors of ES Modules in CommonJS

@Injectable()
export class MarketplaceService {
  private meiliClient: any | null = null;
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    const host = this.config.get<string>('MEILISEARCH_HOST');
    const apiKey = this.config.get<string>('MEILISEARCH_API_KEY');
    if (host) {
      const importPromise = eval("import('meilisearch')") as Promise<any>;
      importPromise
        .then(({ MeiliSearch }) => {
          this.meiliClient = new MeiliSearch({ host, apiKey });
        })
        .catch((err: any) => {
          this.logger.warn(`Could not load MeiliSearch dynamically: ${err.message}. Using database search fallback.`);
        });
    }
  }

  private stripPrivateFields(listing: any) {
    if (!listing) return listing;
    const cloned = { ...listing };

    if (cloned.asking_price) cloned.asking_price = Number(cloned.asking_price);
    if (cloned.original_price) cloned.original_price = Number(cloned.original_price);
    if (cloned.imv_p50) cloned.imv_p50 = Number(cloned.imv_p50);
    if (cloned.deal_score) cloned.deal_score = Number(cloned.deal_score);

    if (cloned.vehicle) {
      const v = { ...cloned.vehicle };
      delete v.acquisition_cost;
      delete v.recon_total;
      delete v.net_profit_estimate;
      delete v.floor_plan_cost;
      delete v.internal_notes;
      delete v.staff_notes;
      cloned.vehicle = v;
    }

    // Top level sanitization just in case
    delete cloned.acquisition_cost;
    delete cloned.recon_total;
    delete cloned.net_profit_estimate;
    delete cloned.floor_plan_cost;
    delete cloned.internal_notes;
    delete cloned.staff_notes;

    return cloned;
  }

  private buildMeiliFilter(query: any): string {
    const filters: string[] = ['status = active'];
    if (query.make) {
      filters.push(`make = "${query.make}"`);
    }
    if (query.district) {
      filters.push(`district = "${query.district}"`);
    }
    if (query.deal_rating) {
      filters.push(`deal_rating = "${query.deal_rating}"`);
    }
    return filters.join(' AND ');
  }

  private buildMeiliSort(query: any): string[] {
    if (query.sort === 'price_asc') {
      return ['asking_price:asc'];
    }
    if (query.sort === 'price_desc') {
      return ['asking_price:desc'];
    }
    if (query.sort === 'mileage_asc') {
      return ['mileage_km:asc'];
    }
    return [];
  }

  async search(query: any) {
    if (this.meiliClient) {
      try {
        const index = this.meiliClient.index('listings');
        const searchResult = await index.search(query.q || '', {
          filter: this.buildMeiliFilter(query),
          sort: this.buildMeiliSort(query),
        });

        const ids = searchResult.hits.map((h: any) => h.id);
        const dbListings = await this.prisma.marketplaceListing.findMany({
          where: {
            id: { in: ids },
            status: 'active',
          },
          include: {
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                year: true,
                description: true,
                photos: true,
              },
            },
          },
        });

        // Maintain MeiliSearch relevance sort order
        const mappedListings = ids
          .map((id: any) => dbListings.find((l: any) => l.id === id))
          .filter(Boolean);

        return mappedListings.map((l: any) => this.stripPrivateFields(l));
      } catch (meiliError: any) {
        this.logger.warn(`MeiliSearch search failed, falling back to database: ${meiliError.message}`);
      }
    }

    // DB Fallback search
    const whereClause: any = {
      status: 'active',
    };

    if (query.make) {
      whereClause.make = String(query.make);
    }
    if (query.district) {
      whereClause.district = String(query.district);
    }
    if (query.deal_rating) {
      whereClause.deal_rating = String(query.deal_rating) as any;
    }

    const listings = await this.prisma.marketplaceListing.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            description: true,
            photos: true,
          },
        },
      },
    });

    return listings.map(l => this.stripPrivateFields(l));
  }

  async findOneBySlug(slug: string) {
    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { slug },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            description: true,
            photos: true,
          },
        },
        dealership: {
          select: {
            id: true,
            business_name: true,
            slug: true,
            logo_url: true,
            rating: true,
            review_count: true,
            created_at: true,
            phone: true,
            whatsapp_number: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('LISTING_NOT_FOUND');
    }

    const listingObj = this.stripPrivateFields(listing);

    // Embed structured Schema.org/Vehicle JSON-LD
    const schemaOrg = {
      '@context': 'https://schema.org',
      '@type': 'Vehicle',
      name: listing.title,
      description: listing.description || `Details for ${listing.title}`,
      image: listing.photos,
      offers: {
        '@type': 'Offer',
        price: Number(listing.asking_price),
        priceCurrency: 'BDT',
        availability: 'https://schema.org/InStock',
      },
      brand: {
        '@type': 'Brand',
        name: listing.make,
      },
      model: listing.model,
      productionDate: listing.year,
      vehicleTransmission: listing.transmission,
      fuelType: listing.fuel_type,
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: listing.mileage_km,
        unitCode: 'KMT',
      },
    };

    listingObj.schema_org = schemaOrg;
    return listingObj;
  }

  async findOneDealerBySlug(slug: string) {
    const dealer = await this.prisma.dealership.findUnique({
      where: { slug },
    });
    if (!dealer) {
      throw new NotFoundException('DEALER_NOT_FOUND');
    }
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { dealership_id: dealer.id, status: 'active' },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            description: true,
            photos: true,
          },
        },
      },
    });
    return {
      dealer,
      listings: listings.map(l => this.stripPrivateFields(l)),
      listing_count: listings.length,
    };
  }

  async getPriceTrends(make: string, model: string, district?: string, months = 6) {
    const where: any = {
      make: { equals: make, mode: 'insensitive' },
      model: { equals: model, mode: 'insensitive' },
    };
    if (district) {
      where.district = { equals: district, mode: 'insensitive' };
    }

    const trends = await this.prisma.priceTrend.findMany({
      where,
      orderBy: { recorded_date: 'asc' },
    });

    if (trends.length > 0) {
      return trends;
    }

    // Generate mock trend data for dynamic graphs
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

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);

      // Add a slight fluctuation
      const fluctuation = (Math.sin(i) * 0.03) + (Math.cos(i * 2) * 0.02);
      const avg = Math.round(basePrice * (1 + fluctuation));
      
      mockTrends.push({
        date: date.toISOString().split('T')[0],
        avg_price: avg,
        median_price: Math.round(avg * 0.98),
        listing_count: 5 + Math.round(Math.abs(Math.sin(i) * 10)),
      });
    }

    return mockTrends;
  }

  async createLead(data: any) {
    const dealer = await this.prisma.dealership.findUnique({
      where: { id: data.dealership_id },
    });
    if (!dealer) {
      throw new NotFoundException(`Dealership not found: ${data.dealership_id}`);
    }

    // CRM Lead Routing: Round-Robin among active dealership staff
    const staff = await this.prisma.dealerStaff.findMany({
      where: { dealership_id: data.dealership_id, is_active: true },
    });

    let assignedTo = null;
    if (staff.length > 0) {
      const staffWithCounts = await Promise.all(
        staff.map(async s => {
          const count = await this.prisma.lead.count({
            where: { assigned_to: s.user_id, dealership_id: data.dealership_id },
          });
          return { s, count };
        })
      );
      staffWithCounts.sort((a, b) => a.count - b.count);
      assignedTo = staffWithCounts[0].s.user_id;
    } else {
      // Default to owner if no staff seats configured
      assignedTo = dealer.owner_id;
    }

    // Lookup/Create customer
    let customer = await this.prisma.customer.findFirst({
      where: { dealership_id: data.dealership_id, phone: data.buyer_phone },
    });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          dealership_id: data.dealership_id,
          full_name: data.buyer_name,
          phone: data.buyer_phone,
          email: data.buyer_email,
          district: data.buyer_district || dealer.district,
          division: dealer.division,
        },
      });
    }

    const lead = await this.prisma.lead.create({
      data: {
        dealership_id: data.dealership_id,
        customer_id: customer.id,
        assigned_to: assignedTo,
        vehicle_id: data.vehicle_id,
        buyer_name: data.buyer_name,
        buyer_phone: data.buyer_phone,
        buyer_email: data.buyer_email,
        buyer_district: data.buyer_district || dealer.district,
        source: LeadSource.marketplace,
        priority: LeadPriority.warm,
        stage: LeadStage.new,
        notes: data.notes,
      },
    });

    return lead;
  }

  async getImvValuation(make: string, model: string, year: number, askingPrice: number) {
    const similar = await this.prisma.marketplaceListing.findMany({
      where: {
        make,
        model,
        year,
        status: 'active',
      },
      select: { asking_price: true },
    });

    let imvP50 = askingPrice * 0.95; // default fallback 5% less
    if (similar.length >= 3) {
      const prices = similar.map(s => Number(s.asking_price)).sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      imvP50 = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    }

    return { imv_p50: imvP50, sample_size: similar.length };
  }

  async createC2cListing(data: any) {
    const similar = await this.prisma.marketplaceListing.findMany({
      where: {
        make: data.make,
        model: data.model,
        year: Number(data.year),
        status: 'active',
      },
      select: { asking_price: true },
    });

    let imvP50 = Number(data.asking_price) * 0.95;
    if (similar.length >= 3) {
      const prices = similar.map(s => Number(s.asking_price)).sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      imvP50 = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    }

    const uuid = crypto.randomUUID().slice(0, 8);
    const slug = `${data.make.toLowerCase()}-${data.model.toLowerCase()}-${data.year}-${uuid}`;

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        listing_type: ListingType.c2c,
        seller_type: SellerType.private,
        slug,
        title: `${data.year} ${data.make} ${data.model}${data.variant ? ' ' + data.variant : ''}`,
        description: data.description,
        asking_price: Number(data.asking_price),
        make: data.make,
        model: data.model,
        year: Number(data.year),
        variant: data.variant,
        body_type: data.body_type,
        engine_cc: Number(data.engine_cc) || null,
        fuel_type: data.fuel_type || 'petrol',
        transmission: data.transmission || 'automatic',
        condition: data.condition || 'used',
        mileage_km: Number(data.mileage_km),
        mileage_bucket: '30-60K',
        district: data.district || 'Dhaka',
        division: data.division || 'Dhaka',
        photos: data.photos || [],
        photo_count: data.photos ? data.photos.length : 0,
        status: ListingStatus.under_review,
        imv_p50: imvP50,
        imv_sample_size: similar.length,
      },
    });

    return listing;
  }

  async getGmcFeed(dealershipId: string): Promise<string> {
    const dealer = await this.prisma.dealership.findUnique({
      where: { id: dealershipId },
    });
    if (!dealer) {
      throw new NotFoundException(`Dealership not found: ${dealershipId}`);
    }

    const listings = await this.prisma.marketplaceListing.findMany({
      where: { dealership_id: dealershipId, status: 'active' },
    });

    let xml = `<?xml version="1.0"?>\n`;
    xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${dealer.business_name} - Garisale Inventory</title>\n`;
    xml += `    <link>https://garisale.com/dealers/${dealer.slug}</link>\n`;
    xml += `    <description>Active vehicle inventory feed for ${dealer.business_name} on Garisale</description>\n`;

    for (const listing of listings) {
      const photos = Array.isArray(listing.photos) ? listing.photos : [];
      const imageLink = photos.length > 0 ? photos[0] : '';
      xml += `    <item>\n`;
      xml += `      <g:id>${listing.id}</g:id>\n`;
      xml += `      <g:title>${listing.title}</g:title>\n`;
      xml += `      <g:description>${listing.description || listing.title}</g:description>\n`;
      xml += `      <g:link>https://garisale.com/listings/${listing.slug}</g:link>\n`;
      xml += `      <g:image_link>${imageLink}</g:image_link>\n`;
      xml += `      <g:condition>${listing.condition}</g:condition>\n`;
      xml += `      <g:price>${Number(listing.asking_price).toFixed(2)} BDT</g:price>\n`;
      xml += `      <g:availability>in_stock</g:availability>\n`;
      xml += `      <g:brand>${listing.make}</g:brand>\n`;
      xml += `      <g:model>${listing.model}</g:model>\n`;
      xml += `      <g:year>${listing.year}</g:year>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>\n`;

    return xml;
  }

  async getFacebookFeed(dealershipId: string): Promise<string> {
    return this.getGmcFeed(dealershipId);
  }

  async flagListing(id: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const key = `listing_flags:${id}`;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get current flags from Redis
    const flagsStr = await this.redis.get(key);
    let flags: number[] = flagsStr ? JSON.parse(flagsStr) : [];

    // Filter out flags older than 24h
    flags = flags.filter(ts => ts > oneDayAgo);
    
    // Add current flag
    flags.push(now);

    // Save back to Redis
    await this.redis.set(key, JSON.stringify(flags), 24 * 3600);

    // If >= 2 flags within 24h → auto-hide listing
    if (flags.length >= 2) {
      await this.prisma.marketplaceListing.update({
        where: { id },
        data: { status: 'under_review' as any }, // hide listing
      });

      this.logger.warn(`Listing ${id} has been auto-hidden and flagged for moderation due to ${flags.length} reports in 24h.`);
    }

    return { flags_count: flags.length, status: flags.length >= 2 ? 'under_review' : listing.status };
  }
}
