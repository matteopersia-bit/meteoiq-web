const MODELS = [
  {
    name: "ECMWF IFS",
    shortName: "ECMWF",
    model: "ecmwf_ifs",
  },
  {
    name: "DWD ICON",
    shortName: "ICON",
    model: "icon_seamless",
  },
  {
    name: "NOAA GFS",
    shortName: "GFS",
    model: "gfs_seamless",
  },
];

export type ModelHour = {
  time: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  wind: number;
  weatherCode: number;
};

export type ModelForecast = {
  name: string;
  shortName: string;
  hours: ModelHour[];
};

export async function getModelForecast(
  latitude: number,
  longitude: number
): Promise<ModelForecast[]> {
  const results = await Promise.all(
    MODELS.map(async (item) => {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        hourly:
          "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code",
        models: item.model,
        forecast_days: "7",
        timezone: "auto",
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Errore modello ${item.name}`);
      }

      const data = await response.json();

      return {
        name: item.name,
        shortName: item.shortName,
        hours: data.hourly.time.map(
          (time: string, index: number): ModelHour => ({
            time,
            temperature: data.hourly.temperature_2m[index],
            rainProbability:
              data.hourly.precipitation_probability?.[index] ?? 0,
            precipitation:
              data.hourly.precipitation?.[index] ?? 0,
            wind: data.hourly.wind_speed_10m?.[index] ?? 0,
            weatherCode: data.hourly.weather_code?.[index] ?? 0,
          })
        ),
      };
    })
  );

  return results;
}
