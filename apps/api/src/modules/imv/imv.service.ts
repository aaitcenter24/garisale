import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { VehicleCondition, DealRating, ImvOverrideType } from '@prisma/client';
// MeiliSearch is loaded dynamically in the constructor to avoid require() errors of ES Modules in CommonJS

const DISTRICT_TO_DIVISION: Record<string, string> = {
  Dhaka: 'Dhaka',
  Chittagong: 'Chittagong',
  Sylhet: 'Sylhet',
  Rajshahi: 'Rajshahi',
};

@Injectable()
export class ImvService {
  private readonly logger = new Logger(ImvService.name);
  private meiliClient: any | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
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
          this.logger.warn(`Could not load MeiliSearch dynamically: ${err.message}`);
        });
    }
  }

  // Percentile calculation helper (PERCENTILE_CONT equivalent)
  calculatePercentile(prices: number[], p: number): number {
    if (prices.length === 0) return 0;
    const sorted = [...prices].sort((a, b) => a - b);
    const idx = p * (sorted.length - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return sorted[low];
    return sorted[low] + (idx - low) * (sorted[high] - sorted[low]);
  }

  // Outlier removal using IQR (applied if sample_size >= 10)
  removeOutliersIQR(prices: number[]): number[] {
    if (prices.length < 10) return prices;
    const q1 = this.calculatePercentile(prices, 0.25);
    const q3 = this.calculatePercentile(prices, 0.75);
    const iqr = q3 - q1;
    const minBound = q1 - 1.5 * iqr;
    const maxBound = q3 + 1.5 * iqr;
    return prices.filter(p => p >= minBound && p <= maxBound);
  }

  // Geographic division helper
  getDivisionForDistrict(district: string): string {
    return DISTRICT_TO_DIVISION[district] || 'Dhaka';
  }

  // Core cluster statistics computation
  async computeClusterStats(params: {
    make: string;
    model: string;
    year: number;
    mileage_bucket: string;
    condition: VehicleCondition;
    district: string;
  }) {
    const { make, model, year, mileage_bucket, condition, district } = params;

    // Geographic fallback sequence
    let listings: any[] = [];
    let fallbackLevel = 'district';

    // Step 1: District
    listings = await this.prisma.marketplaceListing.findMany({
      where: {
        make,
        model,
        year,
        mileage_bucket,
        condition,
        district,
        status: 'active',
        is_featured: false,
        created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    });

    // Step 2: Division Fallback
    if (listings.length < 5) {
      fallbackLevel = 'division';
      const division = this.getDivisionForDistrict(district);
      listings = await this.prisma.marketplaceListing.findMany({
        where: {
          make,
          model,
          year,
          mileage_bucket,
          condition,
          division,
          status: 'active',
          is_featured: false,
          created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      });
    }

    // Step 3: National Fallback
    if (listings.length < 5) {
      fallbackLevel = 'national';
      listings = await this.prisma.marketplaceListing.findMany({
        where: {
          make,
          model,
          year,
          mileage_bucket,
          condition,
          status: 'active',
          is_featured: false,
          created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      });
    }

    // Step 4: Condition-Relaxed Fallback
    if (listings.length < 5 && condition === VehicleCondition.reconditioned) {
      fallbackLevel = 'condition_relaxed';
      listings = await this.prisma.marketplaceListing.findMany({
        where: {
          make,
          model,
          year,
          mileage_bucket,
          condition: { in: [VehicleCondition.reconditioned, VehicleCondition.used] },
          status: 'active',
          is_featured: false,
          created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      });
    }

    // Step 5: Mileage-Bucket-Relaxed Fallback
    if (listings.length < 5) {
      fallbackLevel = 'mileage_relaxed';
      // Include all buckets for this make/model/year/condition
      listings = await this.prisma.marketplaceListing.findMany({
        where: {
          make,
          model,
          year,
          condition,
          status: 'active',
          is_featured: false,
          created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      });
    }

    const sampleSize = listings.length;
    if (sampleSize < 5) {
      return {
        sample_size: sampleSize,
        confidence: 'none',
        fallback_level: fallbackLevel,
        p50: null,
      };
    }

    let prices = listings.map(l => Number(l.asking_price));

    // Apply IQR Outlier filtering
    if (sampleSize >= 10) {
      prices = this.removeOutliersIQR(prices);
    }

    const cleanSampleSize = prices.length;
    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);
    const priceMean = prices.reduce((a, b) => a + b, 0) / cleanSampleSize;
    const priceStddev = Math.sqrt(prices.map(x => Math.pow(x - priceMean, 2)).reduce((a, b) => a + b, 0) / cleanSampleSize);

    const p5 = this.calculatePercentile(prices, 0.05);
    const p10 = this.calculatePercentile(prices, 0.10);
    const p25 = this.calculatePercentile(prices, 0.25);
    const p50 = this.calculatePercentile(prices, 0.50);
    const p75 = this.calculatePercentile(prices, 0.75);
    const p90 = this.calculatePercentile(prices, 0.90);
    const p95 = this.calculatePercentile(prices, 0.95);
    const p99 = this.calculatePercentile(prices, 0.99);

    let confidence = 'none';
    if (cleanSampleSize >= 30) confidence = 'high';
    else if (cleanSampleSize >= 10) confidence = 'medium';
    else if (cleanSampleSize >= 5) confidence = 'low';

    return {
      sample_size: cleanSampleSize,
      price_min: priceMin,
      price_max: priceMax,
      price_mean: priceMean,
      price_stddev: priceStddev,
      p5,
      p10,
      p25,
      p50,
      p75,
      p90,
      p95,
      p99,
      confidence,
      fallback_level: fallbackLevel,
    };
  }

  // Nightly recalculation (8 stages)
  async runNightlyRecalculation(): Promise<any> {
    const startedAt = new Date();
    this.logger.log('Starting nightly IMV Recalculation');

    // Stage 1: Snapshot current p50 values as prev_p50
    const prevClusters = await this.prisma.imvCluster.findMany();
    const prevP50Map = new Map<string, number>();
    for (const c of prevClusters) {
      const key = `${c.make}:${c.model}:${c.year}:${c.mileage_bucket}:${c.condition}:${c.district}`;
      prevP50Map.set(key, Number(c.p50));
    }

    // Stage 2: Identify active clusters
    const activeListings = await this.prisma.marketplaceListing.findMany({
      where: { status: 'active' },
      select: {
        make: true,
        model: true,
        year: true,
        mileage_bucket: true,
        condition: true,
        district: true,
        division: true,
      },
    });

    const clusterKeys = new Set<string>();
    const clustersToProcess: any[] = [];

    for (const l of activeListings) {
      const key = `${l.make}:${l.model}:${l.year}:${l.mileage_bucket}:${l.condition}:${l.district}`;
      if (!clusterKeys.has(key)) {
        clusterKeys.add(key);
        clustersToProcess.push({
          make: l.make,
          model: l.model,
          year: l.year,
          mileage_bucket: l.mileage_bucket,
          condition: l.condition,
          district: l.district,
          division: l.division,
        });
      }
    }

    // Stage 3: Compute Cluster Statistics
    let clustersUpdated = 0;
    for (const c of clustersToProcess) {
      const stats = await this.computeClusterStats({
        make: c.make,
        model: c.model,
        year: c.year,
        mileage_bucket: c.mileage_bucket,
        condition: c.condition,
        district: c.district,
      });

      if (!stats.p50) continue;

      const key = `${c.make}:${c.model}:${c.year}:${c.mileage_bucket}:${c.condition}:${c.district}`;
      const prevP50 = prevP50Map.get(key) || null;

      let pctChange30d = 0;
      let trendDirection = 'stable';

      if (prevP50) {
        pctChange30d = ((stats.p50 - prevP50) / prevP50) * 100;
        if (pctChange30d > 2) trendDirection = 'up';
        else if (pctChange30d < -2) trendDirection = 'down';
      }

      // Check Active Overrides
      const activeOverride = await this.prisma.imvOverride.findFirst({
        where: {
          make: c.make,
          model: c.model,
          year: c.year,
          mileage_bucket: c.mileage_bucket,
          condition: c.condition,
          district: c.district,
          is_approved: true,
          override_expires_at: { gte: new Date() },
        },
      });

      let finalP50 = stats.p50;
      let ratingSuppressed = false;

      if (activeOverride) {
        if (activeOverride.override_type === ImvOverrideType.adjust_p50_by_percent) {
          finalP50 = stats.p50 * (1 + Number(activeOverride.override_value));
        } else if (activeOverride.override_type === ImvOverrideType.set_manual_p50) {
          finalP50 = Number(activeOverride.override_value);
        } else if (activeOverride.override_type === ImvOverrideType.suppress_rating_for_period) {
          ratingSuppressed = true;
        }
      }

      await this.prisma.imvCluster.upsert({
        where: {
          make_model_year_mileage_bucket_condition_district: {
            make: c.make,
            model: c.model,
            year: c.year,
            mileage_bucket: c.mileage_bucket,
            condition: c.condition,
            district: c.district,
          },
        },
        create: {
          make: c.make,
          model: c.model,
          year: c.year,
          mileage_bucket: c.mileage_bucket,
          condition: c.condition,
          district: c.district,
          division: c.division || 'Dhaka',
          sample_size: stats.sample_size,
          price_min: stats.price_min,
          price_max: stats.price_max,
          price_mean: stats.price_mean,
          price_stddev: stats.price_stddev,
          p5: stats.p5,
          p10: stats.p10,
          p25: stats.p25,
          p50: finalP50,
          p75: stats.p75,
          p90: stats.p90,
          p95: stats.p95,
          p99: stats.p99,
          prev_p50: prevP50,
          pct_change_30d: pctChange30d,
          trend_direction: trendDirection,
          confidence: ratingSuppressed ? 'none' : stats.confidence,
          last_calculated_at: new Date(),
        },
        update: {
          sample_size: stats.sample_size,
          price_min: stats.price_min,
          price_max: stats.price_max,
          price_mean: stats.price_mean,
          price_stddev: stats.price_stddev,
          p5: stats.p5,
          p10: stats.p10,
          p25: stats.p25,
          p50: finalP50,
          p75: stats.p75,
          p90: stats.p90,
          p95: stats.p95,
          p99: stats.p99,
          prev_p50: prevP50,
          pct_change_30d: pctChange30d,
          trend_direction: trendDirection,
          confidence: ratingSuppressed ? 'none' : stats.confidence,
          last_calculated_at: new Date(),
        },
      });

      clustersUpdated++;
    }

    // Stage 4: Bulk update listing deal ratings and deal scores
    const activeListingsToRate = await this.prisma.marketplaceListing.findMany({
      where: { status: 'active' },
    });

    let listingsRated = 0;
    const batchSize = 1000;
    for (let i = 0; i < activeListingsToRate.length; i += batchSize) {
      const batch = activeListingsToRate.slice(i, i + batchSize);
      for (const item of batch) {
        const cluster = await this.prisma.imvCluster.findFirst({
          where: {
            make: item.make,
            model: item.model,
            year: item.year,
            mileage_bucket: item.mileage_bucket,
            condition: item.condition,
            district: item.district,
          },
        });

        if (cluster && cluster.confidence !== 'none') {
          const p50 = Number(cluster.p50);
          const score = (Number(item.asking_price) - p50) / p50;
          let rating: DealRating = DealRating.fair_price;

          if (score < -0.15) rating = DealRating.great_deal;
          else if (score < -0.05) rating = DealRating.good_deal;
          else if (score < 0.10) rating = DealRating.fair_price;
          else rating = DealRating.overpriced;

          // If sample size is low, keep rating as unrated
          if (cluster.sample_size < 10) {
            rating = DealRating.unrated;
          }

          await this.prisma.marketplaceListing.update({
            where: { id: item.id },
            data: {
              imv_p50: cluster.p50,
              imv_sample_size: cluster.sample_size,
              deal_score: score,
              deal_rating: rating,
            },
          });
        } else {
          await this.prisma.marketplaceListing.update({
            where: { id: item.id },
            data: {
              deal_rating: DealRating.unrated,
            },
          });
        }
        listingsRated++;
      }
      // Stage 4 50ms sleep to avoid lock contention
      await new Promise(r => setTimeout(r, 50));
    }

    // Stage 5: Bulk update MeiliSearch
    if (this.meiliClient) {
      try {
        const index = this.meiliClient.index('listings');
        const updatedListings = await this.prisma.marketplaceListing.findMany({
          where: { status: 'active' },
        });
        const docs = updatedListings.map(l => ({
          id: l.id,
          deal_score: l.deal_score ? Number(l.deal_score) : null,
          deal_rating: l.deal_rating,
        }));
        // Send in batches of 5000
        for (let idx = 0; idx < docs.length; idx += 5000) {
          await index.updateDocuments(docs.slice(idx, idx + 5000));
        }
      } catch (meiliError: any) {
        this.logger.warn(`MeiliSearch index update failed: ${meiliError.message}`);
      }
    }

    // Stage 6: Redis Cache Invalidation
    const imvKeys = await this.redis.keys('cache:imv:*');
    for (const key of imvKeys) {
      await this.redis.del(key);
    }
    const searchKeys = await this.redis.keys('cache:search:*');
    for (const key of searchKeys) {
      await this.redis.del(key);
    }

    // Stage 7: Store price trend records
    const calculatedClusters = await this.prisma.imvCluster.findMany({
      where: { last_calculated_at: { gte: new Date(startedAt.getTime() - 60000) } },
    });

    for (const ic of calculatedClusters) {
      await this.prisma.priceTrend.upsert({
        where: {
          make_model_year_district_recorded_date: {
            make: ic.make,
            model: ic.model,
            year: ic.year,
            district: ic.district,
            recorded_date: new Date(),
          },
        },
        create: {
          make: ic.make,
          model: ic.model,
          year: ic.year,
          district: ic.district,
          recorded_date: new Date(),
          avg_price: ic.price_mean,
          median_price: ic.p50,
          listing_count: ic.sample_size,
        },
        update: {
          avg_price: ic.price_mean,
          median_price: ic.p50,
          listing_count: ic.sample_size,
        },
      });
    }

    // Stage 8: Log to imv_calculation_run
    const run = await this.prisma.imvCalculationRun.create({
      data: {
        status: 'complete',
        clusters_updated: clustersUpdated,
        listings_rated: listingsRated,
        started_at: startedAt,
        completed_at: new Date(),
        triggered_by: 'nightly_cron',
      },
    });

    return run;
  }

  // Instant single listing recalculation (target < 200ms)
  async calculateSingleListingImv(vehicleId: string) {
    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { vehicle_id: vehicleId, status: 'active' },
    });
    if (!listing) return null;

    const cacheKey = `cache:imv:${listing.make}:${listing.model}:${listing.year}:${listing.mileage_bucket}:${listing.condition}:${listing.district}`;
    let cached = await this.redis.get(cacheKey);
    let p50: number | null = null;
    let sampleSize = 0;
    let confidence = 'none';

    if (cached) {
      const data = JSON.parse(cached);
      p50 = data.p50;
      sampleSize = data.sampleSize;
      confidence = data.confidence;
    } else {
      // Check precalculated cluster stats first
      const cluster = await this.prisma.imvCluster.findFirst({
        where: {
          make: listing.make,
          model: listing.model,
          year: listing.year,
          mileage_bucket: listing.mileage_bucket,
          condition: listing.condition,
          district: listing.district,
        },
      });



      if (cluster && cluster.confidence !== 'none') {
        p50 = Number(cluster.p50);
        sampleSize = cluster.sample_size;
        confidence = cluster.confidence;
      } else {
        const stats = await this.computeClusterStats({
          make: listing.make,
          model: listing.model,
          year: listing.year,
          mileage_bucket: listing.mileage_bucket,
          condition: listing.condition,
          district: listing.district,
        });

        p50 = stats.p50 ? Number(stats.p50) : null;
        sampleSize = stats.sample_size || 0;
        confidence = stats.confidence || 'none';
      }

      if (p50) {
        await this.redis.set(cacheKey, JSON.stringify({ p50, sampleSize, confidence }), 3600);
      }
    }

    if (p50 && confidence !== 'none') {
      const score = (Number(listing.asking_price) - p50) / p50;
      let rating: DealRating = DealRating.fair_price;

      if (score < -0.15) rating = DealRating.great_deal;
      else if (score < -0.05) rating = DealRating.good_deal;
      else if (score < 0.10) rating = DealRating.fair_price;
      else rating = DealRating.overpriced;

      if (sampleSize < 10) {
        rating = DealRating.unrated;
      }

      const updated = await this.prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          imv_p50: p50,
          imv_sample_size: sampleSize,
          deal_score: score,
          deal_rating: rating,
        },
      });

      // Update MeiliSearch single doc
      if (this.meiliClient) {
        try {
          const index = this.meiliClient.index('listings');
          await index.updateDocuments([{
            id: listing.id,
            deal_score: score,
            deal_rating: rating,
          }]);
        } catch {}
      }

      return updated;
    } else {
      return this.prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          deal_rating: DealRating.unrated,
        },
      });
    }
  }

  // Admin Override endpoints logic
  async submitImvOverride(role: string, body: any) {
    const allowed = ['super_admin', 'operations_manager', 'marketing_admin'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    const { make, model, year, mileage_bucket, condition, district, override_type, override_value, reason_code, expiry_days } = body;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Math.min(expiry_days || 30, 90)); // cap at 90 days

    return this.prisma.imvOverride.create({
      data: {
        make,
        model,
        year: Number(year),
        mileage_bucket,
        condition: condition as VehicleCondition,
        district,
        override_type: override_type as ImvOverrideType,
        override_value: Number(override_value),
        reason_code,
        override_expires_at: expiry,
        is_approved: false,
      },
    });
  }

  async approveImvOverride(role: string, id: string, approvedBy: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can approve IMV overrides.');
    }

    const override = await this.prisma.imvOverride.findUnique({
      where: { id },
    });
    if (!override) {
      throw new NotFoundException('Override request not found.');
    }

    const approved = await this.prisma.imvOverride.update({
      where: { id },
      data: {
        is_approved: true,
        approved_by: approvedBy,
      },
    });

    // Run nightly recalculation job to apply override immediately
    await this.runNightlyRecalculation();

    return approved;
  }
}
