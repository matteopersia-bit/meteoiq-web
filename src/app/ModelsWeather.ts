export type ModelHour = {
  time: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  wind: number;
  weatherCode: number;
};

export type WeatherModel = {
  name: string;
  shortName: string;
  hours: ModelHour[];
};

export type ModelComparison = {
  models: WeatherModel[];
};
