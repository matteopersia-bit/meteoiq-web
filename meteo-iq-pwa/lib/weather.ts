import type { Agreement, ModelForecast } from "./types";

const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
const spread = (values: number[]) => values.length < 2 ? 0 : Math.max(...values) - Math.min(...values);
export function agreement(models: ModelForecast[]): Agreement {
  const points = models.filter(m => m.available && m.hourly[0]).map(m => m.hourly[0]);
  const temperature = clamp(100 - spread(points.map(p => p.temperature)) * 12);
  const rain = clamp(100 - spread(points.map(p => p.precipitationProbability)) * 1.15);
  const wind = clamp(100 - spread(points.map(p => p.windSpeed)) * 6);
  const availability = Math.min(100, models.filter(m => m.available).length / 4 * 100);
  return { temperature, rain, wind, overall: clamp((temperature * .45 + rain * .3 + wind * .15) * .9 + availability * .1), agreeing: points.filter(p => Math.abs(p.temperature - points.reduce((a,b) => a + b.temperature, 0) / points.length) < 2).length };
}
export function condition(code: number) { if (code === 0) return "Sereno"; if (code <= 2) return "Poco nuvoloso"; if (code <= 48) return "Nuvoloso"; if (code <= 57) return "Pioviggine"; if (code <= 67) return "Pioggia"; if (code <= 77) return "Neve"; if (code <= 82) return "Rovesci"; return "Temporali"; }
export function icon(code: number) { if (code <= 1) return "☀️"; if (code <= 3) return "⛅"; if (code <= 48) return "☁️"; if (code <= 67) return "🌧️"; if (code <= 77) return "❄️"; return "⛈️"; }
