import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService, WeatherData } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':city')
  getWeather(@Param('city') city: string): Promise<WeatherData> {
    return this.weatherService.getWeather(city);
  }
}
