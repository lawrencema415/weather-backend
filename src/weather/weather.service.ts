import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

interface WeatherstackResponse {
  location: {
    name: string;
    country: string;
    region: string;
    lat: string;
    lon: string;
    localtime: string;
  };
  current: {
    temperature: number;
    weather_descriptions: string[];
    weather_icons: string[];
    humidity: number;
    wind_speed: number;
    wind_dir: string;
    pressure: number;
    feelslike: number;
    uv_index: number;
    visibility: number;
    cloudcover: number;
  };
}

export interface WeatherData {
  city: string;
  country: string;
  region: string;
  temperature: string;
  feelsLike: string;
  description: string;
  humidity: string;
  windSpeed: string;
  windDirection: string;
  pressure: string;
  uvIndex: number;
  visibility: string;
  cloudCover: string;
  iconUrl: string;
  localTime: string;
  coordinates: {
    lat: string;
    lon: string;
  };
}

@Injectable()
export class WeatherService {
  // https://weatherstack.com/documentation
  private readonly API_KEY = process.env.WEATHER_API_KEY;
  private readonly BASE_URL = 'http://api.weatherstack.com/current';

  async getWeather(city: string): Promise<WeatherData> {
    try {
      const response = await axios.get<WeatherstackResponse>(
        `${this.BASE_URL}?access_key=${this.API_KEY}&query=${encodeURIComponent(city)}`,
      );

      return {
        city: response.data.location.name,
        country: response.data.location.country,
        region: response.data.location.region,
        temperature: `${response.data.current.temperature}°C`,
        feelsLike: `${response.data.current.feelslike}°C`,
        description:
          response.data.current.weather_descriptions[0] ||
          'No description available',
        humidity: `${response.data.current.humidity}%`,
        windSpeed: `${response.data.current.wind_speed} km/h`,
        windDirection: response.data.current.wind_dir,
        pressure: `${response.data.current.pressure} hPa`,
        uvIndex: response.data.current.uv_index,
        visibility: `${response.data.current.visibility} km`,
        cloudCover: `${response.data.current.cloudcover}%`,
        iconUrl: response.data.current.weather_icons[0] || '',
        localTime: response.data.location.localtime,
        coordinates: {
          lat: response.data.location.lat,
          lon: response.data.location.lon,
        },
      };
    } catch (error: unknown) {
      console.log(error);
      throw new HttpException('City not found', HttpStatus.NOT_FOUND);
    }
  }
}
