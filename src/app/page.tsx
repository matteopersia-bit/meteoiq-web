"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Droplets,
  Wind,
  Umbrella,
  ChevronDown,
} from "lucide-react";
import { getModelForecast, type ModelForecast } from "./modelsService";

type Hour = {
  time: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  wind: number;
  weatherCode: number;
};

type Day = {
  date: string;
  label: string;
  min: number;
  max: number;
  rainProbability: number;
  hours: Hour[];
};

const weatherInfo: Record<number, { label: string; icon: string }> = {
  0: { label: "Sereno", icon: "☀️" },
  1: { label: "Prevalentemente sereno", icon: "🌤️" },
  2: { label: "Parzialmente nuvoloso", icon: "⛅" },
  3: { label: "Nuvoloso", icon: "☁️" },
  45: { label: "Nebbia", icon: "🌫️" },
  48: { label: "Nebbia", icon: "🌫️" },
  51: { label: "Pioviggine", icon: "🌦️" },
  53: { label: "Pioviggine", icon: "🌦️" },
  55: { label: "Pioviggine intensa", icon: "🌧️" },
  61: { label: "Pioggia debole", icon: "🌦️" },
  63: { label: "Pioggia", icon: "🌧️" },
  65: { label: "Pioggia intensa", icon: "🌧️" },
  71: { label: "Neve debole", icon: "🌨️" },
  73: { label: "Neve", icon: "❄️" },
  75: { label: "Neve intensa", icon: "❄️" },
  80: { label: "Rovesci", icon: "🌦️" },
  81: { label: "Rovesci", icon: "🌧️" },
  82: { label: "Rovesci intensi", icon: "⛈️" },
  95: { label: "Temporale", icon: "⛈️" },
  96: { label: "Temporale con grandine", icon: "⛈️" },
  99: { label: "Temporale intenso", icon: "⛈️" },
};

function formatDay(date: string, index: number) {
  if (index === 0) return "OGGI";

  return new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).toUpperCase();
}

function formatHour(time: string) {
  return new Date(time).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [city, setCity] = useState("Milano");
  const [input, setInput] = useState("Milano");
  const [days, setDays] = useState<Day[]>([]);
  const [models, setModels] = useState<ModelForecast[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWeather(searchCity = city) {
    try {
      setLoading(true);
      setError("");

      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity
        )}&count=1&language=it&format=json`
      );

      if (!geoResponse.ok) throw new Error("Errore geocoding");

      const geo = await geoResponse.json();

      if (!geo.results?.length) {
        throw new Error("Città non trovata");
      }

      const place = geo.results[0];
      setCity(place.name);
      setInput(place.name);

      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        hourly:
          "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code",
        forecast_days: "7",
        timezone: "auto",
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Errore previsioni");

      const data = await response.json();

      const hours: Hour[] = data.hourly.time.map(
        (time: string, index: number) => ({
          time,
          temperature: data.hourly.temperature_2m[index],
          rainProbability:
            data.hourly.precipitation_probability?.[index] ?? 0,
          precipitation: data.hourly.precipitation?.[index] ?? 0,
          wind: data.hourly.wind_speed_10m?.[index] ?? 0,
          weatherCode: data.hourly.weather_code?.[index] ?? 0,
        })
      );

      const grouped: Day[] = [];

      for (let i = 0; i < 7; i++) {
        const dayHours = hours.slice(i * 24, i * 24 + 24);

        if (!dayHours.length) continue;

        grouped.push({
          date: dayHours[0].time.slice(0, 10),
          label: formatDay(dayHours[0].time.slice(0, 10), i),
          min: Math.round(Math.min(...dayHours.map((h) => h.temperature))),
          max: Math.round(Math.max(...dayHours.map((h) => h.temperature))),
          rainProbability: Math.max(
            ...dayHours.map((h) => h.rainProbability)
          ),
          hours: dayHours,
        });
      }

      setDays(grouped);

      const modelData = await getModelForecast(
        place.latitude,
        place.longitude
      );

      setModels(modelData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante il caricamento"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather("Milano");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentDay = days[selectedDay];

  const currentHour = useMemo(() => {
    if (!currentDay) return null;

    const now = new Date();

    return (
      currentDay.hours.find((hour) => {
        const date = new Date(hour.time);
        return date.getHours() >= now.getHours();
      }) ?? currentDay.hours[0]
    );
  }, [currentDay]);

  const modelSummary = useMemo(() => {
    if (!models.length || !currentDay) return [];

    const index = selectedDay * 24;

    return models.map((model) => {
      const hour = model.hours[index] ?? model.hours[0];

      return {
        name: model.name,
        shortName: model.shortName,
        temperature: Math.round(hour?.temperature ?? 0),
        rain: Math.round(hour?.rainProbability ?? 0),
        wind: Math.round(hour?.wind ?? 0),
      };
    });
  }, [models, selectedDay, currentDay]);

  const consensus = useMemo(() => {
    if (!modelSummary.length) return null;

    const temperature =
      modelSummary.reduce((sum, model) => sum + model.temperature, 0) /
      modelSummary.length;

    const rain =
      modelSummary.reduce((sum, model) => sum + model.rain, 0) /
      modelSummary.length;

    const spread =
      Math.max(...modelSummary.map((m) => m.temperature)) -
      Math.min(...modelSummary.map((m) => m.temperature));

    return {
      temperature: Math.round(temperature),
      rain: Math.round(rain),
      spread, confidence: Math.max(0, Math.min(100, Math.round(100 - spread * 18))),
    };
  }, [modelSummary]);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.35em] text-sky-400">
              METEO IQ
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Previsioni intelligenti
            </h1>
          </div>

          <button
            onClick={() => loadWeather()}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </header>

        <form
          className="mt-7"
          onSubmit={(event) => {
            event.preventDefault();
            loadWeather(input);
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl">
            <Search size={19} className="text-white/40" />

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/30"
              placeholder="Cerca una città..."
            />

            <button
              type="submit"
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Cerca
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && !currentDay ? (
          <div className="py-24 text-center text-white/50">
            Caricamento previsioni...
          </div>
        ) : currentDay && currentHour ? (
          <>
            <section className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-500/20 via-white/[0.06] to-white/[0.03] p-6 shadow-2xl md:p-8">
              <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                <div>
                  <div className="text-sm font-medium text-white/50">
                    {city}
                  </div>

                  <div className="mt-2 flex items-start gap-4">
                    <div className="text-7xl font-light tracking-tighter">
                      {Math.round(currentHour.temperature)}°
                    </div>

                    <div className="pt-2 text-5xl">
                      {weatherInfo[currentHour.weatherCode]?.icon ?? "🌤️"}
                    </div>
                  </div>

                  <div className="mt-2 text-lg text-white/80">
                    {weatherInfo[currentHour.weatherCode]?.label ??
                      "Condizioni variabili"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-xs text-white/40">MIN</div>
                    <div className="mt-1 text-xl font-semibold">
                      {currentDay.min}°
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-xs text-white/40">MAX</div>
                    <div className="mt-1 text-xl font-semibold">
                      {currentDay.max}°
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-xs text-white/40">PIOGGIA</div>
                    <div className="mt-1 text-xl font-semibold">
                      {currentHour.rainProbability}%
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <div className="text-xs text-white/40">VENTO</div>
                    <div className="mt-1 text-xl font-semibold">
                      {Math.round(currentHour.wind)} km/h
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-white/60">
                  PROSSIMI 7 GIORNI
                </h2>

                <ChevronDown size={17} className="text-white/30" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {days.map((day, index) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(index)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedDay === index
                        ? "border-sky-400/50 bg-sky-400/15"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="text-[11px] font-semibold tracking-wide text-white/50">
                      {day.label}
                    </div>

                    <div className="mt-3 text-2xl">
                      {weatherInfo[day.hours[12]?.weatherCode]?.icon ??
                        "🌤️"}
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-lg font-semibold">
                        {day.max}°
                      </span>

                      <span className="text-sm text-white/40">
                        {day.min}°
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-sky-300">
                      {day.rainProbability}% pioggia
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-white/60">
                  PREVISIONE ORARIA
                </h2>

                <span className="text-xs text-white/30">
                  {currentDay.label}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="flex min-w-max gap-2 p-3">
                  {currentDay.hours.map((hour) => (
                    <div
                      key={hour.time}
                      className="w-24 rounded-xl bg-black/20 px-3 py-4 text-center"
                    >
                      <div className="text-xs text-white/40">
                        {formatHour(hour.time)}
                      </div>

                      <div className="my-3 text-2xl">
                        {weatherInfo[hour.weatherCode]?.icon ?? "🌤️"}
                      </div>

                      <div className="text-lg font-semibold">
                        {Math.round(hour.temperature)}°
                      </div>

                      <div className="mt-2 text-xs text-sky-300">
                        {hour.rainProbability}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] border border-sky-400/20 bg-sky-400/[0.06] p-6 md:p-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <div className="text-xs font-semibold tracking-[0.25em] text-sky-300">
                    METEO IQ
                  </div>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Consensus dei modelli
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                    MeteoIQ confronta più modelli meteorologici. Quando i
                    modelli sono vicini tra loro, la previsione è più
                    consistente; quando divergono, l&apos;incertezza aumenta.
                  </p>
                </div>

                {consensus && (
                  <div className="rounded-2xl bg-black/20 px-5 py-4 md:min-w-44">
                    <div className="text-xs text-white/40">
                      TEMPERATURA MEDIA
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold">{consensus.temperature}°</span>
                      <span className="text-sm text-white/40">consenso</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-sky-300">
                      {consensus.confidence >= 80 ? "Molto affidabile" : consensus.confidence >= 60 ? "Abbastanza affidabile" : "Previsione incerta"} · {consensus.confidence}/100
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      differenza tra modelli: {consensus.spread}°
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 grid gap-3 md:grid-cols-3">
                {modelSummary.map((model) => (
                  <div
                    key={model.shortName}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {model.name}
                      </span>

                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/50">
                        MODELLO
                      </span>
                    </div>

                    <div className="mt-5 text-3xl font-semibold">
                      {model.temperature}°
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white/[0.04] p-3">
                        <div className="text-white/30">Pioggia</div>
                        <div className="mt-1 text-sm">{model.rain}%</div>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] p-3">
                        <div className="text-white/30">Vento</div>
                        <div className="mt-1 text-sm">
                          {model.wind} km/h
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Droplets className="text-sky-400" size={20} />
                <div className="mt-4 text-sm text-white/40">Umidità / acqua</div>
                <div className="mt-1 text-lg font-semibold">
                  {currentHour.precipitation.toFixed(1)} mm
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Umbrella className="text-sky-400" size={20} />
                <div className="mt-4 text-sm text-white/40">
                  Probabilità pioggia
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {currentHour.rainProbability}%
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Wind className="text-sky-400" size={20} />
                <div className="mt-4 text-sm text-white/40">Vento</div>
                <div className="mt-1 text-lg font-semibold">
                  {Math.round(currentHour.wind)} km/h
                </div>
              </div>
            </section>

            <footer className="py-10 text-center text-xs text-white/25">
              MeteoIQ · confronto multi-modello · dati Open-Meteo
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}
