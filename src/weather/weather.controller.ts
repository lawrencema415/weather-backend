import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WeatherService } from './weather.service';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':city')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async getWeather(@Param('city') city: string) {
    try {
      return await this.weatherService.getWeather(city);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cache-status/:city')
  @SkipThrottle() // Skip rate limiting for cache status checks
  async checkCacheStatus(@Param('city') city: string) {
    return this.weatherService.checkCacheStatus(city);
  }
}
