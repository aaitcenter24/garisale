import { Module, forwardRef } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AutomationRuleEngine } from './automation-rule.engine';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [AuthModule, DatabaseModule, RedisModule, CrmModule],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationRuleEngine],
  exports: [AutomationService, AutomationRuleEngine],
})
export class AutomationModule {}
