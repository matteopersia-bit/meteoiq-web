import urllib.request
import json
import csv
from datetime import date, timedelta

LAT = 45.4667
LON = 9.2667
START = date(2026, 6, 1)
END = date(2026, 8, 31)

models = {
    "ECMWF": "ecmwf_ifs025",
    "ICON": "icon_seamless",
    "GFS": "gfs_seamless"
}

rows = []

d = START
while d <= END:

    day = str(d)

    for model_name, model_id in models.items():

        for lead in [1, 2, 3]:

            variable = f"temperature_2m_previous_day{lead}"

            url = (
                "https://previous-runs-api.open-meteo.com/v1/forecast"
                f"?latitude={LAT}"
                f"&longitude={LON}"
                f"&hourly={variable}"
                f"&models={model_id}"
                f"&start_date={day}"
                f"&end_date={day}"
                "&timezone=Europe%2FRome"
            )

            try:
                with urllib.request.urlopen(url, timeout=60) as r:
                    data = json.load(r)

                hourly = data["hourly"]
                temps = hourly[variable]

                valid = [x for x in temps if x is not None]

                if valid:
                    tmax = max(valid)
                    rows.append([day, model_name, f"D-{lead}", tmax])

            except Exception as e:
                print(f"ERRORE {day} {model_name} D-{lead}: {e}")

    print(day)

    d += timedelta(days=1)

with open("backtest_linate_2026.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["date", "model", "lead", "forecast_tmax"])
    w.writerows(rows)

print("")
print("===================================")
print("BACKTEST COMPLETATO")
print("===================================")
print("File: backtest_linate_2026.csv")
print("Righe:", len(rows))
