import urllib.parse
import urllib.request
import json
import csv
from collections import defaultdict

LAT = 45.4642
LON = 9.1900
TZ = "Europe/Rome"

START = "2026-06-01"
END   = "2026-08-31"

MODELS = {
    "ICON": "icon_seamless",
    "GFS": "gfs_seamless",
    "ECMWF_HRES": "ecmwf_ifs",
}

LEADS = {
    "D-1": "previous_day1",
    "D-2": "previous_day2",
    "D-3": "previous_day3",
}

BASE = "https://previous-runs-api.open-meteo.com/v1/forecast"

rows = []

for model_name, model_id in MODELS.items():

    print(f"\n>>> Scarico {model_name}...")

    params = {
        "latitude": LAT,
        "longitude": LON,
        "hourly": ",".join(
            "temperature_2m_" + x for x in LEADS.values()
        ),
        "models": model_id,
        "start_date": START,
        "end_date": END,
        "timezone": TZ,
    }

    url = BASE + "?" + urllib.parse.urlencode(params)

    try:
        with urllib.request.urlopen(url, timeout=180) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        print(f"ERRORE {model_name}: {e}")
        continue

    if data.get("error"):
        print("API ERROR:", data.get("reason"))
        continue

    times = data["hourly"]["time"]

    for lead_name, lead_id in LEADS.items():

        key = "temperature_2m_" + lead_id

        if key not in data["hourly"]:
            print(f"  {lead_name}: NON DISPONIBILE")
            continue

        values = data["hourly"][key]
        daily = defaultdict(list)

        for t, value in zip(times, values):
            if value is not None:
                daily[t[:10]].append(float(value))

        count = 0

        for date, temps in sorted(daily.items()):
            if temps:
                rows.append({
                    "date": date,
                    "model": model_name,
                    "lead": lead_name,
                    "forecast_max": max(temps)
                })
                count += 1

        print(f"  {lead_name}: {count} giorni")

with open(
    "backtest_milano_forecast.csv",
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=["date", "model", "lead", "forecast_max"]
    )
    writer.writeheader()
    writer.writerows(rows)

print("\n==========================================")
print(" BACKTEST FORECAST GIU-AGO 2026 COMPLETATO")
print("==========================================")

summary = defaultdict(list)

for row in rows:
    summary[(row["model"], row["lead"])].append(
        row["forecast_max"]
    )

for key, values in sorted(summary.items()):
    print(
        f"{key[0]:14} {key[1]:5} "
        f"{len(values):3} giorni | "
        f"min {min(values):.1f}°C | "
        f"max {max(values):.1f}°C"
    )

print("\nFile creato:")
print("backtest_milano_forecast.csv")
