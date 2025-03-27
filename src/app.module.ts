import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherService } from './weather/weather.service';
import { WeatherController } from './weather/weather.controller';

@Module({
  imports: [],
  controllers: [AppController, WeatherController],
  providers: [AppService, WeatherService],
})
export class AppModule {}
