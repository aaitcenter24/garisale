import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private currentDealerId: string | null = null;
  public useMock = false;
  public mockPrisma: any = null;

  constructor(config: ConfigService) {
    const dbUrl = config.get<string>('DATABASE_URL') || 'postgresql://dummy:dummy@localhost:5432/dummy';
    super({
      datasources: {
        db: { url: dbUrl },
      },
      log: ['warn', 'error'],
    });

    const self = this;
    return new Proxy(self, {
      get(target, prop, receiver) {
        if (target.useMock && target.mockPrisma && prop in target.mockPrisma) {
          return target.mockPrisma[prop];
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Successfully connected to the database.');
    } catch (err: any) {
      this.logger.warn(`Database connection failed: ${err.message}. Falling back to in-memory MockPrismaService.`);
      this.useMock = true;
      const { MockPrismaService } = require('./mock-prisma.service');
      this.mockPrisma = new MockPrismaService();
      await this.seedMockData();
      return; // Skip middleware if using mock
    }

    // Soft-delete middleware: automatically filter deleted_at IS NULL
    this.$use(async (params, next) => {
      const softDeleteModels = [
        'Vehicle', 'Lead', 'Customer', 'Deal', 'User', 'Dealership'
      ];

      if (params.model && softDeleteModels.includes(params.model)) {
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          if (params.action === 'findUnique') {
            params.action = 'findFirst';
          }
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          params.args.where.deleted_at = null;
        }
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deleted_at: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { deleted_at: new Date() };
        }
      }
      return next(params);
    });
  }

  private async seedMockData() {
    const dealerId = '550e8400-e29b-41d4-a716-44665544000c';
    const ownerId = 'owner-user-id';
    
    // Seed dealership
    await this.mockPrisma.dealership.create({
      data: {
        id: dealerId,
        name: 'Garisale Test Dealership',
        slug: 'garisale-test-dealer',
        status: 'active',
      },
    });

    // Seed Owner User
    await this.mockPrisma.user.create({
      data: {
        id: ownerId,
        phone: '+8801711111111',
        full_name: 'Garisale Test Owner',
        role: 'dealer_owner',
        status: 'active',
      },
    });

    // Link staff membership
    this.mockPrisma.mockData.dealerStaff.push({
      id: 'staff-owner',
      dealership_id: dealerId,
      user_id: ownerId,
      role: 'dealer_owner',
      is_active: true,
      sees_all_leads: true,
    });

    this.logger.log('Local fallback seeded with Owner user (+8801711111111) for dealership 550e8400-e29b-41d4-a716-44665544000c.');
  }

  // RLS context injection
  async setDealerContext(dealerId: string): Promise<void> {
    this.currentDealerId = dealerId;
    if (this.useMock) {
      if (this.mockPrisma) {
        await this.mockPrisma.setDealerContext(dealerId);
      }
      return;
    }
    await this.$executeRaw`
      SELECT set_config('app.current_dealer_id', ${dealerId}, true)
    `;
  }

  async clearDealerContext(): Promise<void> {
    this.currentDealerId = null;
    if (this.useMock) {
      if (this.mockPrisma) {
        await this.mockPrisma.clearDealerContext();
      }
      return;
    }
    await this.$executeRaw`
      SELECT set_config('app.current_dealer_id', '', true)
    `;
  }

  getCurrentDealerId(): string | null {
    return this.currentDealerId;
  }

  setBypassRls(val: boolean): void {
    if (this.useMock && this.mockPrisma) {
      this.mockPrisma.setBypassRls(val);
    }
  }
}
