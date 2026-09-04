export type ModelReliability = {
  name: string;
  shortName: string;
  score: number;
  temperatureError: number;
  rainError: number;
  windError: number;
};

type ForecastModel = {
  name: string;
  shortName: string;
  hours: Array<{
    time: string;
    temperature: number;
    precipitation: number;
    wind: number;
  }>;
};

type Observation = {
  time: string;
  temperature: number;
  precipitation: number;
  wind: number;
};

export function calculateModelReliability(
  model: ForecastModel,
  observations: Observation[]
): ModelReliability {
  let temperatureError = 0;
  let rainError = 0;
  let windError = 0;
  let count = 0;

  for (const forecast of model.hours) {
    const observation = observations.find(
      (item) => item.time === forecast.time
    );

    if (!observation) continue;

    temperatureError += Math.abs(
      forecast.temperature - observation.temperature
    );

    rainError += Math.abs(
      forecast.precipitation - observation.precipitation
    );

    windError += Math.abs(forecast.wind - observation.wind);

    count++;
  }

  if (count === 0) {
    return {
      name: model.name,
      shortName: model.shortName,
      score: 0,
      temperatureError: 0,
      rainError: 0,
      windError: 0,
    };
  }

  temperatureError /= count;
  rainError /= count;
  windError /= count;

  const error =
    temperatureError * 0.5 +
    rainError * 0.3 +
    windError * 0.2;

  const score = Math.max(0, Math.min(100, 100 - error * 10));

  return {
    name: model.name,
    shortName: model.shortName,
    score: Math.round(score),
    temperatureError: Number(temperatureError.toFixed(2)),
    rainError: Number(rainError.toFixed(2)),
    windError: Number(windError.toFixed(2)),
  };
}
