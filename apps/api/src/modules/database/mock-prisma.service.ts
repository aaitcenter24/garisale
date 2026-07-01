import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserRole, UserStatus, DealerStatus, SubscriptionTier, VehicleStatus, ListingStatus, DealStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MockPrismaService implements OnModuleInit {
  private currentDealerId: string | null = null;
  public mockData: { [key: string]: any[] } = {
    user: [],
    otp: [],
    refreshToken: [],
    dealership: [],
    dealershipLocation: [],
    dealerStaff: [],
    dealerSettings: [],
    planConfig: [],
    vehicle: [],
    vehicleStatusHistory: [],
    reconAssessment: [],
    reconTask: [],
    customer: [],
    lead: [],
    leadInteraction: [],
    deal: [],
    dealPayment: [],
    expenseCategory: [],
    vehicleExpense: [],
    operationalExpense: [],
    marketplaceListing: [],
    syncAuditLog: [],
    imvOverride: [],
    imvCluster: [],
    priceTrend: [],
    imvCalculationRun: [],
    maestroInsight: [],
    automationRule: [],
    automationLog: [],
    platformCalendar: [],
    subscription: [],
    invoice: [],
    paymentTransaction: [],
    platformAuditLog: [],
    entityChangeLog: [],
  };

  async onModuleInit() {}

  async $connect() {}
  async $disconnect() {}

  private bypassRls = false;

  setBypassRls(val: boolean) {
    this.bypassRls = val;
  }

  async setDealerContext(dealerId: string) {
    this.currentDealerId = dealerId;
  }

  async clearDealerContext() {
    this.currentDealerId = null;
  }

  getCurrentDealerId() {
    return this.currentDealerId;
  }

  // Helper to filter by RLS and soft-delete
  private applyRlsAndSoftDelete(modelName: string, records: any[]): any[] {
    const tenantModels = [
      'dealershipLocation', 'dealerStaff', 'dealerSettings', 'vehicle', 'vehicleStatusHistory',
      'reconAssessment', 'reconTask', 'customer', 'lead', 'leadInteraction', 'deal', 'dealPayment',
      'vehicleExpense', 'operationalExpense', 'syncAuditLog',
      'maestroInsight', 'automationRule', 'automationLog',
      'subscription', 'invoice', 'paymentTransaction'
    ];

    let result = records;

    // Apply RLS
    if (tenantModels.includes(modelName) && !this.bypassRls) {
      if (!this.currentDealerId) {
        // RLS fail-safe: if context not set, return 0 records
        return [];
      }
      result = result.filter(r => r.dealership_id === this.currentDealerId);
    }

    // Apply Soft Delete (filter out where deleted_at is set)
    const softDeleteModels = ['vehicle', 'lead', 'customer', 'deal', 'user', 'dealership', 'imvOverride'];
    if (softDeleteModels.includes(modelName)) {
      result = result.filter(r => !r.deleted_at);
    }

    return result;
  }

  // Prisma raw execution helper
  async $executeRaw(query: TemplateStringsArray, ...values: any[]) {
    const rawSql = query.join('?');
    if (rawSql.includes('set_config') && rawSql.includes('app.current_dealer_id')) {
      const dealerId = values[0];
      this.currentDealerId = dealerId || null;
    }
  }

  // Helper to filter records by where query conditions
  private filterRecords(records: any[], whereClause: any): any[] {
    if (!whereClause) return records;
    return records.filter(item => {
      for (const key in whereClause) {
        const val = whereClause[key];
        if (val && typeof val === 'object' && !(val instanceof Date)) {
          if ('gt' in val) {
            if (!(item[key] > val.gt)) return false;
          } else if ('lt' in val) {
            if (!(item[key] < val.lt)) return false;
          } else if ('in' in val) {
            if (!val.in.includes(item[key])) return false;
          } else if ('not' in val) {
            if (item[key] === val.not) return false;
          }
        } else {
          const itemVal = item[key];
          if (itemVal instanceof Date && val instanceof Date) {
            if (itemVal.getTime() !== val.getTime()) return false;
          } else {
            if (itemVal !== val) return false;
          }
        }
      }
      return true;
    });
  }

  // Helper to enrich records with relations
  private enrichRecord(modelName: string, item: any): any {
    if (!item) return item;
    // Shallow clone to avoid mutating raw store directly
    const cloned = { ...item };

    if (modelName === 'user') {
      cloned.staffRecords = (this.mockData.dealerStaff || [])
        .filter(s => s.user_id === item.id)
        .map(s => ({ ...s }));
    }

    if (modelName === 'refreshToken') {
      const rawUser = (this.mockData.user || []).find(u => u.id === item.user_id);
      if (rawUser) {
        cloned.user = this.enrichRecord('user', rawUser);
      }
    }

    if (modelName === 'marketplaceListing') {
      const rawVehicle = (this.mockData.vehicle || []).find(v => v.id === item.vehicle_id);
      if (rawVehicle) {
        cloned.vehicle = { ...rawVehicle };
      }
    }

    if (modelName === 'dealership') {
      cloned.subscription = (this.mockData.subscription || []).find(s => s.dealership_id === item.id) || null;
      cloned.invoices = (this.mockData.invoice || []).filter(i => i.dealership_id === item.id).map(i => ({ ...i }));
      cloned.paymentTransactions = (this.mockData.paymentTransaction || []).filter(p => p.dealership_id === item.id).map(p => ({ ...p }));
    }

    if (modelName === 'invoice') {
      cloned.transactions = (this.mockData.paymentTransaction || []).filter(t => t.invoice_id === item.id).map(t => ({ ...t }));
    }

    if (modelName === 'subscription') {
      const plan = (this.mockData.planConfig || []).find(p => p.id === item.plan_id);
      if (plan) {
        cloned.plan = { ...plan };
      }
    }

    return cloned;
  }

  private modelApis: { [key: string]: any } = {};

  // Model Operations
  private createModelApi(modelName: string) {
    if (this.modelApis[modelName]) {
      return this.modelApis[modelName];
    }
    const api = {
      findMany: async (args: any = {}) => {
        let list = this.mockData[modelName] || [];
        list = this.applyRlsAndSoftDelete(modelName, list);
        list = this.filterRecords(list, args.where);

        // Handle orderBy
        if (args.orderBy) {
          const key = Object.keys(args.orderBy)[0];
          const dir = args.orderBy[key];
          list.sort((a, b) => {
            if (a[key] < b[key]) return dir === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return list.map(item => this.enrichRecord(modelName, item));
      },

      count: async (args: any = {}) => {
        const list = await this.createModelApi(modelName).findMany(args);
        return list.length;
      },

      findFirst: async (args: any = {}) => {
        const list = await this.createModelApi(modelName).findMany(args);
        return list[0] || null;
      },

      findUnique: async (args: any = {}) => {
        let list = this.mockData[modelName] || [];
        list = this.applyRlsAndSoftDelete(modelName, list);
        list = this.filterRecords(list, args.where);
        return this.enrichRecord(modelName, list[0] || null);
      },

      upsert: async (args: any = {}) => {
        try {
          const record = await this.createModelApi(modelName).findUnique({ where: args.where });
          if (record) {
            return await this.createModelApi(modelName).update({ where: args.where, data: args.update });
          }
        } catch (e) {
          // ignore not found
        }
        return await this.createModelApi(modelName).create({ data: args.create });
      },

      create: async (args: any = {}) => {
        const data = { ...args.data };
        if (!data.id) {
          data.id = crypto.randomUUID();
        }
        data.created_at = new Date();
        data.updated_at = new Date();

        const defaults: Record<string, Record<string, any>> = {
          automationRule: { is_active: true },
          marketplaceListing: { is_featured: false, status: 'active' },
          lead: { lead_score: 0, budget_min: null, budget_max: null },
          otp: { is_used: false, attempts: 0 },
          vehicle: { recon_total: 0 },
          user: { totp_enabled: false, totp_failed_attempts: 0, admin_role: null, totp_secret: null },
        };

        const modelDefaults = defaults[modelName];
        if (modelDefaults) {
          for (const key in modelDefaults) {
            if (data[key] === undefined) {
              data[key] = modelDefaults[key];
            }
          }
        }

        if (data.deleted_at === undefined) {
          data.deleted_at = null;
        }

        // Enforce RLS WITH CHECK on tenant tables
        const tenantModels = [
          'dealershipLocation', 'dealerStaff', 'dealerSettings', 'vehicle', 'vehicleStatusHistory',
          'reconAssessment', 'reconTask', 'customer', 'lead', 'leadInteraction', 'deal', 'dealPayment',
          'vehicleExpense', 'operationalExpense', 'syncAuditLog'
        ];

        if (tenantModels.includes(modelName) && !this.bypassRls) {
          if (data.dealership_id !== this.currentDealerId) {
            throw new Error(`RLS check constraint violation: dealership_id must match current session context (${this.currentDealerId})`);
          }
        }

        // Simulate Triggers
        if (modelName === 'vehicle' || modelName === 'marketplaceListing') {
          // mileage_bucket trigger
          const mileage = data.mileage_km || 0;
          if (mileage < 30000) data.mileage_bucket = '0-30K';
          else if (mileage < 60000) data.mileage_bucket = '30-60K';
          else if (mileage < 100000) data.mileage_bucket = '60-100K';
          else data.mileage_bucket = '100K+';
        }

        if (modelName === 'marketplaceListing') {
          // deal_score trigger
          if (data.imv_p50 && data.imv_p50 > 0) {
            const ask = Number(data.asking_price);
            const p50 = Number(data.imv_p50);
            data.deal_score = (ask - p50) / p50;
            const size = data.imv_sample_size || 0;
            if (size < 10) {
              data.deal_rating = 'unrated';
            } else {
              if (data.deal_score < -0.15) data.deal_rating = 'great_deal';
              else if (data.deal_score < -0.05) data.deal_rating = 'good_deal';
              else if (data.deal_score < 0.10) data.deal_rating = 'fair_price';
              else data.deal_rating = 'overpriced';
            }
          } else {
            data.deal_score = null;
            data.deal_rating = 'unrated';
          }
        }

        if (modelName === 'vehicleExpense') {
          // Trigger: update recon_total on vehicle
          const vehicle = this.mockData.vehicle.find(v => v.id === data.vehicle_id);
          if (vehicle) {
            vehicle.recon_total = (Number(vehicle.recon_total) || 0) + Number(data.amount);
            vehicle.net_profit_estimate = (Number(vehicle.asking_price) || 0) - (Number(vehicle.acquisition_cost) || 0) - vehicle.recon_total;
          }
        }

        this.mockData[modelName].push(data);
        return this.enrichRecord(modelName, data);
      },

      update: async (args: any = {}) => {
        let list = this.mockData[modelName] || [];
        list = this.applyRlsAndSoftDelete(modelName, list);
        list = this.filterRecords(list, args.where);
        const item = list[0];
        if (!item) {
          throw new Error('Record to update not found.');
        }

        // Apply edits
        const oldStatus = item.status;
        const newStatus = args.data.status;

        // Enforce guard_vehicle_sold_status trigger
        if (modelName === 'vehicle' && args.data.status) {
          if (oldStatus === 'sold' && newStatus !== 'sold') {
            throw new Error(`Cannot change status of a sold vehicle. Vehicle ID: ${item.id}`);
          }
          if (oldStatus === 'scrapped' && newStatus !== 'scrapped') {
            throw new Error(`Cannot change status of a scrapped vehicle. Vehicle ID: ${item.id}`);
          }
        }

        // Enforce RLS WITH CHECK on update
        if (args.data.dealership_id && args.data.dealership_id !== this.currentDealerId && !this.bypassRls) {
          throw new Error(`RLS check constraint violation: dealership_id must match current session context (${this.currentDealerId})`);
        }

        Object.assign(item, args.data);
        item.updated_at = new Date();

        // Recompute mileage_bucket trigger
        if ((modelName === 'vehicle' || modelName === 'marketplaceListing') && args.data.mileage_km !== undefined) {
          const mileage = item.mileage_km;
          if (mileage < 30000) item.mileage_bucket = '0-30K';
          else if (mileage < 60000) item.mileage_bucket = '30-60K';
          else if (mileage < 100000) item.mileage_bucket = '60-100K';
          else item.mileage_bucket = '100K+';
        }

        // Recompute deal_score trigger
        if (modelName === 'marketplaceListing' && (args.data.asking_price !== undefined || args.data.imv_p50 !== undefined || args.data.imv_sample_size !== undefined)) {
          if (item.imv_p50 && item.imv_p50 > 0) {
            const ask = Number(item.asking_price);
            const p50 = Number(item.imv_p50);
            item.deal_score = (ask - p50) / p50;
            const size = item.imv_sample_size || 0;
            if (size < 10) {
              item.deal_rating = 'unrated';
            } else {
              if (item.deal_score < -0.15) item.deal_rating = 'great_deal';
              else if (item.deal_score < -0.05) item.deal_rating = 'good_deal';
              else if (item.deal_score < 0.10) item.deal_rating = 'fair_price';
              else item.deal_rating = 'overpriced';
            }
          } else {
            item.deal_score = null;
            item.deal_rating = 'unrated';
          }
        }

        return this.enrichRecord(modelName, item);
      },

      updateMany: async (args: any = {}) => {
        let list = this.mockData[modelName] || [];
        list = this.applyRlsAndSoftDelete(modelName, list);
        list = this.filterRecords(list, args.where);

        list.forEach(item => {
          Object.assign(item, args.data);
          item.updated_at = new Date();
        });
        return { count: list.length };
      },

      delete: async (args: any = {}) => {
        let list = this.mockData[modelName] || [];
        list = this.applyRlsAndSoftDelete(modelName, list);
        list = this.filterRecords(list, args.where);
        const item = list[0];
        if (!item) {
          throw new Error('Record to delete not found.');
        }

        // Simulate soft delete
        const softDeleteModels = ['vehicle', 'lead', 'customer', 'deal', 'user', 'dealership'];
        if (softDeleteModels.includes(modelName)) {
          item.deleted_at = new Date();
          return this.enrichRecord(modelName, item);
        }

        const idx = this.mockData[modelName].indexOf(item);
        if (idx !== -1) {
          this.mockData[modelName].splice(idx, 1);
        }
        return this.enrichRecord(modelName, item);
      },

      deleteMany: async (args: any = {}) => {
        let list = this.mockData[modelName] || [];
        list = this.applyRlsAndSoftDelete(modelName, list);
        list = this.filterRecords(list, args.where);

        let count = 0;
        list.forEach(item => {
          const softDeleteModels = ['vehicle', 'lead', 'customer', 'deal', 'user', 'dealership'];
          if (softDeleteModels.includes(modelName)) {
            item.deleted_at = new Date();
          } else {
            const idx = this.mockData[modelName].indexOf(item);
            if (idx !== -1) {
              this.mockData[modelName].splice(idx, 1);
            }
          }
          count++;
        });
        return { count };
      },
    };
    this.modelApis[modelName] = api;
    return api;
  }

  // Model accessors
  get user() { return this.createModelApi('user'); }
  get otp() { return this.createModelApi('otp'); }
  get refreshToken() { return this.createModelApi('refreshToken'); }
  get dealership() { return this.createModelApi('dealership'); }
  get dealershipLocation() { return this.createModelApi('dealershipLocation'); }
  get dealerStaff() { return this.createModelApi('dealerStaff'); }
  get planConfig() { return this.createModelApi('planConfig'); }
  get dealerSettings() { return this.createModelApi('dealerSettings'); }
  get vehicle() { return this.createModelApi('vehicle'); }
  get vehicleStatusHistory() { return this.createModelApi('vehicleStatusHistory'); }
  get reconAssessment() { return this.createModelApi('reconAssessment'); }
  get reconTask() { return this.createModelApi('reconTask'); }
  get customer() { return this.createModelApi('customer'); }
  get lead() { return this.createModelApi('lead'); }
  get leadInteraction() { return this.createModelApi('leadInteraction'); }
  get deal() { return this.createModelApi('deal'); }
  get dealPayment() { return this.createModelApi('dealPayment'); }
  get expenseCategory() { return this.createModelApi('expenseCategory'); }
  get vehicleExpense() { return this.createModelApi('vehicleExpense'); }
  get operationalExpense() { return this.createModelApi('operationalExpense'); }
  get marketplaceListing() { return this.createModelApi('marketplaceListing'); }
  get syncAuditLog() { return this.createModelApi('syncAuditLog'); }
  get imvOverride() { return this.createModelApi('imvOverride'); }
  get imvCluster() { return this.createModelApi('imvCluster'); }
  get priceTrend() { return this.createModelApi('priceTrend'); }
  get imvCalculationRun() { return this.createModelApi('imvCalculationRun'); }
  get maestroInsight() { return this.createModelApi('maestroInsight'); }
  get automationRule() { return this.createModelApi('automationRule'); }
  get automationLog() { return this.createModelApi('automationLog'); }
  get platformCalendar() { return this.createModelApi('platformCalendar'); }
  get subscription() { return this.createModelApi('subscription'); }
  get invoice() { return this.createModelApi('invoice'); }
  get paymentTransaction() { return this.createModelApi('paymentTransaction'); }
  get platformAuditLog() { return this.createModelApi('platformAuditLog'); }
  get entityChangeLog() { return this.createModelApi('entityChangeLog'); }
}
