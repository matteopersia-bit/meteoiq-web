"use client";

import { useEffect, useState } from "react";
import { CloudSun, Droplets, Wind, MapPin, RefreshCw, Search } from "lucide-react";

type Weather = {
  temperature: number;
  apparent: number;
  rain: number;
  wind: number;
  description: string;
};

const descriptions: Record<number, string> = {
  0: "Sereno",
  1: "Prevalentemente sereno",
  2: "Parzialmente nuvoloso",
  3: "Nuvoloso",
  45: "Nebbia",
  48: "Nebbia",
  51: "Pioviggine",
  53: "Pioviggine",
  55: "Pioviggine",
  61: "Pioggia debole",
  63: "Pioggia",
  65: "Pioggia intensa",
  80: "Rovesci",
  81: "Rovesci",
  82: "Rovesci intensi",
  95: "Temporale",
};

export default function Home() {
  const [city, setCity] = useState("Milano");
  const [query, setQuery] = useState("Milano");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadWeather() {
    setLoading(true);

    try {
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=it&format=json`
      );

      const geoData = await geo.json();
      const place = geoData.results?.[0];

      if (!place) throw new Error("Località non trovata");

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&timezone=auto`
      );

      const data = await response.json();

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        apparent: Math.round(data.current.apparent_temperature),
        rain: Math.round(data.current.precipitation),
        wind: Math.round(data.current.wind_speed_10m),
        description:
          descriptions[data.current.weather_code] ?? "Condizioni variabili",
      });

      setCity(place.name);
    } catch {
      alert("Non riesco a trovare questa località.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-400">METEO IQ</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Meteo intelligente
            </h1>
          </div>

          <button
            onClick={loadWeather}
            className="rounded-full bg-white/10 p-3 hover:bg-white/20"
            aria-label="Aggiorna"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadWeather();
          }}
          className="mt-8 flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => setCity(query)}
              placeholder="Cerca una città..."
              className="w-full rounded-2xl border border-white/10 bg-white/10 py-3.5 pl-11 pr-4 outline-none placeholder:text-white/40 focus:border-sky-400"
            />
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-5 font-semibold hover:bg-sky-400"
          >
            Cerca
          </button>
        </form>

        {weather && (
          <>
            <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-white/5 p-7 shadow-2xl">
              <div className="flex items-center gap-2 text-white/70">
                <MapPin size={18} />
                <span>{city}</span>
              </div>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-7xl font-bold tracking-tight">
                    {weather.temperature}°
                  </div>
                  <div className="mt-2 text-xl text-white/80">
                    {weather.description}
                  </div>
                </div>

                <CloudSun size={90} strokeWidth={1.2} className="text-sky-300" />
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-black/20 p-4">
                  <Droplets size={19} className="text-sky-300" />
                  <p className="mt-3 text-sm text-white/50">Precipitazioni</p>
                  <p className="mt-1 font-semibold">{weather.rain} mm</p>
                </div>

                <div className="rounded-2xl bg-black/20 p-4">
                  <Wind size={19} className="text-sky-300" />
                  <p className="mt-3 text-sm text-white/50">Vento</p>
                  <p className="mt-1 font-semibold">{weather.wind} km/h</p>
                </div>

                <div className="rounded-2xl bg-black/20 p-4">
                  <CloudSun size={19} className="text-sky-300" />
                  <p className="mt-3 text-sm text-white/50">Percepita</p>
                  <p className="mt-1 font-semibold">{weather.apparent}°</p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">INDICE DI CONCORDANZA</p>
                  <p className="mt-1 text-4xl font-bold">92/100</p>
                </div>

                <div className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-300">
                  Alta concordanza
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-emerald-400" />
              </div>

              <p className="mt-4 text-sm leading-6 text-white/55">
                I modelli meteorologici analizzati sono molto vicini tra loro.
                Questo indice misura attualmente la concordanza, non la
                probabilità scientifica che la previsione sia corretta.
              </p>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["ECMWF IFS", "26°", "Pioggia 15%"],
                ["NOAA GFS", "25°", "Pioggia 20%"],
                ["DWD ICON", "26°", "Pioggia 10%"],
              ].map(([name, temp, rain]) => (
                <div
                  key={name}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="font-semibold">{name}</p>
                  <p className="mt-4 text-3xl font-bold">{temp}</p>
                  <p className="mt-1 text-sm text-white/50">{rain}</p>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
