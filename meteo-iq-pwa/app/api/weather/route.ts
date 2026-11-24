import { NextRequest, NextResponse } from "next/server";
import type { ModelForecast, ModelId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELS: { id: ModelId; name: string }[] = [{ id: "ecmwf_ifs025", name: "ECMWF IFS" }, { id: "ecmwf_aifs025", name: "ECMWF AIFS" }, { id: "gfs_global", name: "NOAA GFS" }, { id: "icon_global", name: "DWD ICON" }];
const fields = "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,weather_code";
async function fetchModel(model: { id: ModelId; name: string }, latitude: number, longitude: number): Promise<ModelForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), hourly: fields, daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", timezone: "auto", forecast_days: "7", models: model.id }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${model.id} unavailable`);
  const raw = await response.json(); const h = raw.hourly;
  return { id: model.id, name: model.name, available: true, hourly: h.time.map((time: string, i: number) => ({ time, temperature: h.temperature_2m[i], apparentTemperature: h.apparent_temperature[i], precipitation: h.precipitation[i], precipitationProbability: h.precipitation_probability?.[i] ?? 0, windSpeed: h.wind_speed_10m[i], windGusts: h.wind_gusts_10m[i], windDirection: h.wind_direction_10m[i], cloudCover: h.cloud_cover[i], weatherCode: h.weather_code[i] })), daily: { time: raw.daily.time, temperatureMax: raw.daily.temperature_2m_max, temperatureMin: raw.daily.temperature_2m_min, precipitationProbabilityMax: raw.daily.precipitation_probability_max, weatherCode: raw.daily.weather_code } };
}
export async function GET(request: NextRequest) {
  try {
    const lat = Number(request.nextUrl.searchParams.get("lat") ?? 45.4642);
    const lon = Number(request.nextUrl.searchParams.get("lon") ?? 9.19);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return NextResponse.json({ error: "Coordinate non valide" }, { status: 400 });
    const results = await Promise.allSettled(MODELS.map(m => fetchModel(m, lat, lon)));
    const models = results.map((result, i) => result.status === "fulfilled" ? result.value : { id: MODELS[i].id, name: MODELS[i].name, available: false, hourly: [], daily: { time: [], temperatureMax: [], temperatureMin: [], precipitationProbabilityMax: [], weatherCode: [] } });
    return NextResponse.json({ location: { name: request.nextUrl.searchParams.get("name") ?? "Milano", latitude: lat, longitude: lon, timezone: "auto" }, models, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Weather API error", error);
    return NextResponse.json({ error: "Impossibile recuperare i dati meteo" }, { status: 502 });
  }
}
