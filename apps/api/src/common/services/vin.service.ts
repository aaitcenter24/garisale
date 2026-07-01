import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RedisService } from '../../modules/redis/redis.service';

@Injectable()
export class VinService {
  private readonly logger = new Logger(VinService.name);

  constructor(private redis: RedisService) {}

  validateVin(vin: string): boolean {
    if (!vin || vin.length !== 17) return false;
    const cleanVin = vin.toUpperCase();
    if (/[IOQ]/.test(cleanVin)) return false;
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) return false;

    const charMap: { [key: string]: number } = {
      A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
      J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
      S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
    };

    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = cleanVin[i];
      const val = charMap[char];
      if (val === undefined) return false;
      sum += val * weights[i];
    }

    const remainder = sum % 11;
    const expectedCheckDigit = remainder === 10 ? 'X' : remainder.toString();
    return cleanVin[8] === expectedCheckDigit;
  }

  async decodeVin(vin: string): Promise<{ make: string; model: string; year: number; raw?: any }> {
    const cleanVin = vin.toUpperCase().trim();
    if (!this.validateVin(cleanVin)) {
      throw new BadRequestException('INVALID_VIN_FORMAT');
    }

    const cacheKey = `vin_decode:${cleanVin}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`VIN cache hit for: ${cleanVin}`);
      return JSON.parse(cached);
    }

    this.logger.log(`VIN cache miss. Fetching NHTSA for: ${cleanVin}`);
    let decodedData = { make: 'Unknown', model: 'Unknown', year: new Date().getFullYear() };

    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`);
      if (response.ok) {
        const body = await response.json() as any;
        const results = body.Results || [];

        const makeItem = results.find((r: any) => r.Variable === 'Make');
        const modelItem = results.find((r: any) => r.Variable === 'Model');
        const yearItem = results.find((r: any) => r.Variable === 'Model Year');

        decodedData = {
          make: makeItem?.Value || 'Unknown',
          model: modelItem?.Value || 'Unknown',
          year: yearItem?.Value ? parseInt(yearItem.Value, 10) : new Date().getFullYear(),
        };
      }
    } catch (err: any) {
      this.logger.error(`NHTSA vPIC lookup failed: ${err.message}. Invoking BD fallback data.`);
    }

    // Apply BD Supplementary Lookup Fallback if NHTSA returns unknown or fails
    if (decodedData.make === 'Unknown' || decodedData.model === 'Unknown') {
      decodedData = this.getBdSupplementaryData(cleanVin, decodedData.year);
    }

    // Cache in Redis for 90 days (7,776,000 seconds)
    await this.redis.set(cacheKey, JSON.stringify(decodedData), 7776000);

    return decodedData;
  }

  private getBdSupplementaryData(vin: string, year: number): { make: string; model: string; year: number } {
    // Simple lookup mappings based on VIN prefixes for popular reconditioned cars in Bangladesh
    const prefix = vin.substring(0, 3);
    let make = 'Toyota';
    let model = 'Premio';

    if (prefix.startsWith('JTD') || prefix.startsWith('JT1')) {
      make = 'Toyota';
      model = 'Corolla';
    } else if (prefix.startsWith('JHM')) {
      make = 'Honda';
      model = 'Civic';
    } else if (prefix.startsWith('JN1')) {
      make = 'Nissan';
      model = 'Sunny';
    }

    return { make, model, year: year || 2018 };
  }
}
