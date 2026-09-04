import csv
from collections import defaultdict

INPUT = "milano_linate_ghcnh.psv"
OUTPUT = "milano_linate_observations.csv"

# Tmax giornaliera per giugno, luglio e agosto 2026
daily = defaultdict(list)

with open(INPUT, "r", encoding="utf-8", errors="replace") as f:
    reader = csv.DictReader(f, delimiter="|")

    for row in reader:
        date = row.get("DATE", "")

        # Solo giugno-agosto 2026
        if not (
            date.startswith("2026-06")
            or date.startswith("2026-07")
            or date.startswith("2026-08")
        ):
            continue

        temp = row.get("temperature", "").strip()

        try:
            temp = float(temp)
        except:
            continue

        # NOAA GHCNh temperature è in °C
        daily[date[:10]].append(temp)

# Scrive una riga per ogni giorno
with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["date", "actual_max"])

    for date in sorted(daily):
        values = daily[date]

        if values:
            writer.writerow([date, f"{max(values):.1f}"])

print("==========================================")
print("OSSERVAZIONI MILANO LINATE")
print("==========================================")
print("Giorni trovati:", len(daily))

if daily:
    dates = sorted(daily)
    print("Prima:", dates[0], f"{max(daily[dates[0]]):.1f}", "°C")
    print("Ultima:", dates[-1], f"{max(daily[dates[-1]]):.1f}", "°C")

print()
print("File creato:")
print(OUTPUT)
