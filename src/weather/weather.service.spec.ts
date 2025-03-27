import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ThrottlerModule } from '@nestjs/throttler';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  let service: WeatherService;
  let controller: WeatherController;
  let cacheManager: { get: jest.Mock; set: jest.Mock };

  const mockWeatherData = {
    location: {
      name: 'London',
      country: 'United Kingdom',
      region: 'City of London, Greater London',
      lat: '51.517',
      lon: '-0.106',
      localtime: '2023-04-25 10:00',
    },
    current: {
      temperature: 15,
      weather_descriptions: ['Partly cloudy'],
      weather_icons: ['https://example.com/icon.png'],
      humidity: 72,
      wind_speed: 10,
      wind_dir: 'SW',
      pressure: 1015,
      feelslike: 14,
      uv_index: 4,
      visibility: 10,
      cloudcover: 25,
    },
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Create mock cache manager
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
      controllers: [WeatherController],
      providers: [
        WeatherService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    controller = module.get<WeatherController>(WeatherController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('getWeather', () => {
    it('should return weather data from API when cache is empty', async () => {
      // Mock cache miss
      cacheManager.get.mockResolvedValue(null);
      // Mock API response
      mockedAxios.get.mockResolvedValue({ data: mockWeatherData });

      const result = await service.getWeather('London');

      expect(result).toEqual(
        expect.objectContaining({
          city: 'London',
          country: 'United Kingdom',
          temperature: '15°C',
          description: 'Partly cloudy',
        }),
      );

      // Verify cache was checked
      expect(cacheManager.get).toHaveBeenCalledWith('weather:london');

      // Verify result was cached
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return cached weather data when available', async () => {
      // Mock cached data
      const cachedData = {
        city: 'London',
        country: 'United Kingdom',
        region: 'City of London, Greater London',
        temperature: '15°C',
        feelsLike: '14°C',
        description: 'Partly cloudy',
        humidity: '72%',
        windSpeed: '10 km/h',
        windDirection: 'SW',
        pressure: '1015 hPa',
        uvIndex: 4,
        visibility: '10 km',
        cloudCover: '25%',
        iconUrl: 'https://example.com/icon.png',
        localTime: '2023-04-25 10:00',
        coordinates: {
          lat: '51.517',
          lon: '-0.106',
        },
      };

      // Clear any previous calls to axios.get
      mockedAxios.get.mockClear();

      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getWeather('London');

      // Should include _fromCache flag
      expect(result).toEqual(
        expect.objectContaining({
          ...cachedData,
          _fromCache: true,
        }),
      );

      // API should not be called
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle API errors properly', async () => {
      // Mock cache miss
      cacheManager.get.mockResolvedValue(null);

      // Mock API error
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getWeather('InvalidCity')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('checkCacheStatus', () => {
    it('should return cache status when city is cached', async () => {
      cacheManager.get.mockResolvedValue({ city: 'London' });

      const result = await service.checkCacheStatus('London');

      expect(result).toEqual(
        expect.objectContaining({
          isCached: true,
        }),
      );
    });

    it('should return not cached when city is not in cache', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.checkCacheStatus('London');

      expect(result).toEqual(
        expect.objectContaining({
          isCached: false,
        }),
      );
    });
  });

  describe('WeatherController', () => {
    it('should call service.getWeather with the city parameter', async () => {
      // Mock service method
      jest.spyOn(service, 'getWeather').mockResolvedValue({
        city: 'London',
        country: 'United Kingdom',
        region: 'City of London, Greater London',
        temperature: '15°C',
        feelsLike: '14°C',
        description: 'Partly cloudy',
        humidity: '72%',
        windSpeed: '10 km/h',
        windDirection: 'SW',
        pressure: '1015 hPa',
        uvIndex: 4,
        visibility: '10 km',
        cloudCover: '25%',
        iconUrl: 'https://example.com/icon.png',
        localTime: '2023-04-25 10:00',
        coordinates: {
          lat: '51.517',
          lon: '-0.106',
        },
      });

      const result = await controller.getWeather('London');

      expect(service.getWeather).toHaveBeenCalledWith('London');
      expect(result).toEqual(
        expect.objectContaining({
          city: 'London',
        }),
      );
    });

    it('should handle service errors', async () => {
      // Mock service throwing an error
      jest
        .spyOn(service, 'getWeather')
        .mockRejectedValue(
          new HttpException('City not found', HttpStatus.NOT_FOUND),
        );

      await expect(controller.getWeather('InvalidCity')).rejects.toThrow(
        HttpException,
      );
    });

    it('should call service.checkCacheStatus with the city parameter', async () => {
      // Mock service method
      jest.spyOn(service, 'checkCacheStatus').mockResolvedValue({
        isCached: true,
      });

      const result = await controller.checkCacheStatus('London');

      expect(service.checkCacheStatus).toHaveBeenCalledWith('London');
      expect(result).toEqual(
        expect.objectContaining({
          isCached: true,
        }),
      );
    });
  });
});
