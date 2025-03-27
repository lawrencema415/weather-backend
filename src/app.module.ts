import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherService } from './weather/weather.service';
import { WeatherController } from './weather/weather.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import type { CacheModuleOptions } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register<CacheModuleOptions>({
      isGlobal: true,
      ttl: 30 * 60 * 1000, // 30 minutes
      max: 100, // maximum number of items in cache
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute
      },
    ]),
  ],
  controllers: [AppController, WeatherController],
  providers: [
    AppService,
    WeatherService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
