const MODELS = [
  {
    name: "ECMWF IFS",
    shortName: "ECMWF",
    model: "ecmwf_ifs",
  },
  {
    name: "NOAA GFS",
    shortName: "GFS",
    model: "gfs_seamless",
  },
  {
    name: "DWD ICON",
    shortName: "ICON",
    model: "icon_seamless",
  },
];

export async function getModelForecast(
  latitude: number,
  longitude: number
) {
  const results = await Promise.all(
    MODELS.map(async (item) => {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code` +
        `&models=${item.model}` +
        `&forecast_days=7` +
        `&timezone=auto`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Errore modello ${item.name}`);
      }

      const data = await response.json();

      return {
        name: item.name,
        shortName: item.shortName,
        hours: data.hourly.time.map((time: string, index: number) => ({
          time,
          temperature: data.hourly.temperature_2m[index],
          rainProbability:
            data.hourly.precipitation_probability[index] ?? 0,
          precipitation: data.hourly.precipitation[index] ?? 0,
          wind: data.hourly.wind_speed_10m[index],
          weatherCode: data.hourly.weather_code[index],
        })),
      };
    })
  );

  return results;
}
