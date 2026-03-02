import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { CommonModule } from '../common/common.module';
import { ProxyConfigService } from './proxy-config.service';

@Module({
  imports: [HttpModule, CommonModule],
  providers: [ProxyConfigService, ProxyService],
  exports: [ProxyConfigService, ProxyService]
})
export class ProxyModule {}


