export type ModelId = "ecmwf_ifs025" | "ecmwf_aifs025" | "gfs_global" | "icon_global";
export type Hour = { time: string; temperature: number; apparentTemperature: number; precipitation: number; precipitationProbability: number; windSpeed: number; windGusts: number; windDirection: number; cloudCover: number; weatherCode: number };
export type ModelForecast = { id: ModelId; name: string; available: boolean; hourly: Hour[]; daily: { time: string[]; temperatureMax: number[]; temperatureMin: number[]; precipitationProbabilityMax: number[]; weatherCode: number[] } };
export type WeatherPayload = { location: { name: string; latitude: number; longitude: number; timezone: string }; models: ModelForecast[]; fetchedAt: string };
export type Agreement = { overall: number; temperature: number; rain: number; wind: number; agreeing: number };
