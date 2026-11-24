import type { ModelForecast } from "./types";

/** Contract for Open-Meteo adapters and future providers such as meteoblue. */
export interface WeatherProvider {
  readonly id: string;
  readonly name: string;
  getForecast(input: { latitude: number; longitude: number; timezone?: string }): Promise<ModelForecast>;
}
