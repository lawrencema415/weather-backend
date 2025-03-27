import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

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
  success?: boolean;
  error?: {
    code: number;
    type: string;
    info: string;
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
  private readonly logger = new Logger(WeatherService.name);
  private readonly API_KEY = process.env.WEATHER_API_KEY;
  private readonly BASE_URL = 'http://api.weatherstack.com/current';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getWeather(city: string): Promise<WeatherData> {
    try {
      // Check if we have cached data for this city
      const cacheKey = `weather:${city.toLowerCase()}`;

      // Log cache check attempt
      this.logger.debug(`Checking cache for key: ${cacheKey}`);
      const cachedData = await this.cacheManager.get<WeatherData>(cacheKey);

      if (cachedData) {
        this.logger.log(`CACHE HIT: Returning cached weather data for ${city}`);
        return {
          ...cachedData,
          _fromCache: true, // Add a flag to indicate this came from cache
        } as WeatherData & { _fromCache?: boolean };
      }

      // No cached data, make API request
      this.logger.log(`CACHE MISS: Fetching fresh weather data for ${city}`);
      const response = await axios.get<WeatherstackResponse>(
        `${this.BASE_URL}?access_key=${this.API_KEY}&query=${encodeURIComponent(city)}`,
      );

      // Check if the API returned an error
      if (response.data.error) {
        this.logger.error(`API Error: ${JSON.stringify(response.data.error)}`);
        throw new HttpException(
          response.data.error.info || 'Weather API error',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if we have the required data
      if (!response.data.location || !response.data.current) {
        this.logger.error('Invalid API response structure');
        throw new HttpException(
          'Invalid response from weather service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Log the response for debugging
      this.logger.debug(`API Response: ${JSON.stringify(response.data)}`);

      const weatherData = {
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

      // Cache the result
      this.logger.debug(`Storing data in cache with key: ${cacheKey}`);
      await this.cacheManager.set(cacheKey, weatherData, this.CACHE_TTL);
      this.logger.log(`Data cached successfully for ${city}`);
      return weatherData;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Axios error for ${city}: ${error.message}`);
        if (error.response) {
          this.logger.error(`Response status: ${error.response.status}`);
          this.logger.error(
            `Response data: ${JSON.stringify(error.response.data)}`,
          );
        }
      } else {
        this.logger.error(`Error fetching weather for ${city}:`, error);
      }
      // Check if API key is missing
      if (!this.API_KEY) {
        throw new HttpException(
          'Weather API key not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'City not found or service unavailable',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Add a method to check cache status
  async checkCacheStatus(
    city: string,
  ): Promise<{ isCached: boolean; ttl?: number; requestsRemaining?: number }> {
    const cacheKey = `weather:${city.toLowerCase()}`;
    const cachedData = await this.cacheManager.get<WeatherData>(cacheKey);
    // This is a simplified version
    // We could track remaining requests in a real implementation
    // For now, we'll just return a placeholder
    return {
      isCached: !!cachedData,
      requestsRemaining: 5, // Placeholder - in a real implementation, this would be dynamic
    };
  }
}
