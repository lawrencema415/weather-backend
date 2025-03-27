import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':city')
  getWeather(@Param('city') city: string) {
    return this.weatherService.getWeather(city);
  }

  @Get('cache-status/:city')
  async checkCacheStatus(@Param('city') city: string) {
    return this.weatherService.checkCacheStatus(city);
  }
}
