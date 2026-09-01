"use client";

import { useEffect, useMemo, useState } from "react";
import { getModelForecast } from "./modelsService";
import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  RefreshCw,
  Search,
  Sun,
  Wind,
} from "lucide-react";

type Hour = {
  time: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  wind: number;
  code: number;
};

type Day = {
  date: string;
  label: string;
  hours: Hour[];
  min: number;
  max: number;
};

const weatherInfo: Record<
  number,
  { label: string; icon: typeof Sun }
> = {
  0: { label: "Sereno", icon: Sun },
  1: { label: "Prevalentemente sereno", icon: CloudSun },
  2: { label: "Parzialmente nuvoloso", icon: CloudSun },
  3: { label: "Nuvoloso", icon: Cloud },
  45: { label: "Nebbia", icon: Cloud },
  48: { label: "Nebbia", icon: Cloud },
  51: { label: "Pioviggine", icon: CloudRain },
  53: { label: "Pioviggine", icon: CloudRain },
  55: { label: "Pioviggine", icon: CloudRain },
  61: { label: "Pioggia debole", icon: CloudRain },
  63: { label: "Pioggia", icon: CloudRain },
  65: { label: "Pioggia intensa", icon: CloudRain },
  80: { label: "Rovesci", icon: CloudRain },
  81: { label: "Rovesci", icon: CloudRain },
  82: { label: "Rovesci intensi", icon: CloudRain },
  95: { label: "Temporale", icon: CloudRain },
};

function formatDay(date: Date, index: number) {
  if (index === 0) return "Oggi";
  if (index === 1) return "Domani";

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function Home() {
  const [city, setCity] = useState("Milano");
  const [query, setQuery] = useState("Milano");
  const [days, setDays] = useState<Day[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modelForecasts, setModelForecasts] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  async function loadWeather(searchCity = city) {
    setLoading(true);

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity
        )}&count=1&language=it&format=json`
      );

      const geo = await geoResponse.json();
      const place = geo.results?.[0];

      if (!place) {
        alert("Località non trovata.");
        return;
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code&forecast_days=7&timezone=auto`
      );

      const data = await response.json();

      setModelsLoading(true);
      try {
        const models = await getModelForecast(
          place.latitude,
          place.longitude
        );
        setModelForecasts(models);
      } catch (error) {
        console.error("Errore confronto modelli:", error);
        setModelForecasts([]);
      } finally {
        setModelsLoading(false);
      }

      const grouped: Day[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dateString = data.hourly.time[dayIndex * 24].split("T")[0];

        const hours: Hour[] = [];

        for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
          const index = dayIndex * 24 + hourIndex;
          const date = new Date(data.hourly.time[index]);

          hours.push({
            time: date.toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            temperature: Math.round(data.hourly.temperature_2m[index]),
            rainProbability:
              data.hourly.precipitation_probability[index] ?? 0,
            precipitation: data.hourly.precipitation[index] ?? 0,
            wind: Math.round(data.hourly.wind_speed_10m[index]),
            code: data.hourly.weather_code[index],
          });
        }

        grouped.push({
          date: dateString,
          label: formatDay(new Date(`${dateString}T12:00:00`), dayIndex),
          hours,
          min: Math.min(...hours.map((h) => h.temperature)),
          max: Math.max(...hours.map((h) => h.temperature)),
        });
      }

      setDays(grouped);
      setSelectedDay(0);
      setCity(place.name);
    } catch {
      alert("Errore nel caricamento delle previsioni.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather("Milano");
  }, []);

  useEffect(() => {
    const text = query.trim();

    if (text.length < 2 || text === city) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            text
          )}&count=6&language=it&format=json`
        );

        const data = await response.json();
        setSuggestions(data.results ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, city]);

  const currentDay = days[selectedDay];

  const maxRain = useMemo(
    () =>
      currentDay
        ? Math.max(...currentDay.hours.map((hour) => hour.rainProbability))
        : 0,
    [currentDay]
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-sky-400">
              METEO IQ
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Previsioni 7 giorni
            </h1>
          </div>

          <button
            onClick={() => loadWeather()}
            className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
            aria-label="Aggiorna previsioni"
          >
            <RefreshCw
              size={20}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setShowSuggestions(false);
            loadWeather(query);
          }}
          className="mt-6 flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />

            <input
              value={query}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowSuggestions(true);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 outline-none placeholder:text-white/40 focus:border-sky-400"
              placeholder="Cerca una località"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                {suggestions.map((place) => (
                  <button
                    type="button"
                    key={`${place.id}-${place.latitude}-${place.longitude}`}
                    onClick={() => {
                      setQuery(place.name);
                      setShowSuggestions(false);
                      loadWeather(place.name);
                    }}
                    className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-white/10"
                  >
                    <MapPin
                      size={18}
                      className="shrink-0 text-sky-400"
                    />

                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {place.name}
                      </span>

                      <span className="block truncate text-xs text-white/50">
                        {[
                          place.admin1,
                          place.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-5 font-semibold hover:bg-sky-400"
          >
            Cerca
          </button>
        </form>

        {days.length > 0 && currentDay && (
          <>
            <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-white/5 p-6">
              <div className="flex items-center gap-2 text-white/60">
                <MapPin size={17} />
                {city}
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-sm text-white/50">{currentDay.label}</p>
                  <p className="mt-1 text-6xl font-bold">
                    {currentDay.hours[0].temperature}°
                  </p>
                  <p className="mt-2 text-lg text-white/70">
                    {weatherInfo[currentDay.hours[0].code]?.label ??
                      "Condizioni variabili"}
                  </p>
                </div>

                {(() => {
                  const Icon =
                    weatherInfo[currentDay.hours[0].code]?.icon ?? CloudSun;
                  return (
                    <Icon
                      size={78}
                      strokeWidth={1.2}
                      className="text-sky-300"
                    />
                  );
                })()}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-white/40">MIN / MAX</p>
                  <p className="mt-2 font-semibold">
                    {currentDay.min}° / {currentDay.max}°
                  </p>
                </div>

                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-white/40">PIOGGIA MAX</p>
                  <p className="mt-2 font-semibold">{maxRain}%</p>
                </div>

                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-white/40">VENTO</p>
                  <p className="mt-2 font-semibold">
                    {currentDay.hours[0].wind} km/h
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {days.map((day, index) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(index)}
                  className={`min-w-[105px] rounded-2xl border px-4 py-3 text-left ${
                    selectedDay === index
                      ? "border-sky-400 bg-sky-500/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="text-sm font-semibold">{day.label}</p>
                  <p className="mt-2 text-xs text-white/50">
                    {day.min}° — {day.max}°
                  </p>
                </button>
              ))}
            </div>

            <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold tracking-widest text-sky-400">
                  PREVISIONE ORARIA
                </p>
                <h2 className="mt-1 text-xl font-bold">{currentDay.label}</h2>
              </div>

              <div className="-mx-1 overflow-x-auto">
                <div className="flex min-w-max gap-2 px-1 pb-3">
                  {currentDay.hours.map((hour) => {
                    const Icon =
                      weatherInfo[hour.code]?.icon ?? CloudSun;

                    return (
                      <div
                        key={hour.time}
                        className="w-[82px] rounded-2xl bg-black/20 p-3 text-center"
                      >
                        <p className="text-xs text-white/50">{hour.time}</p>

                        <Icon
                          size={23}
                          className="mx-auto mt-3 text-sky-300"
                          strokeWidth={1.5}
                        />

                        <p className="mt-2 text-lg font-bold">
                          {hour.temperature}°
                        </p>

                        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-sky-300">
                          <Droplets size={12} />
                          {hour.rainProbability}%
                        </div>

                        <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-white/40">
                          <Wind size={11} />
                          {hour.wind}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Droplets size={18} className="text-sky-300" />
                    <p className="font-semibold">Pioggia</p>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    Probabilità oraria per {currentDay.label.toLowerCase()}.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Wind size={18} className="text-sky-300" />
                    <p className="font-semibold">Vento</p>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    Velocità prevista in km/h per ogni ora.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
