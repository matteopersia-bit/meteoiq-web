import csv
import math
from collections import defaultdict

# Tmax osservate a Milano Linate - agosto 2026
obs = {
    "2026-08-01":36, "2026-08-02":35, "2026-08-03":37,
    "2026-08-04":37, "2026-08-05":37, "2026-08-06":37,
    "2026-08-07":35, "2026-08-08":34, "2026-08-09":35,
    "2026-08-10":35, "2026-08-11":37, "2026-08-12":36,
    "2026-08-13":36, "2026-08-14":35, "2026-08-15":35,
    "2026-08-16":36, "2026-08-17":32, "2026-08-18":32,
    "2026-08-19":34, "2026-08-20":31, "2026-08-21":24,
    "2026-08-22":30, "2026-08-23":29, "2026-08-24":31,
    "2026-08-25":29, "2026-08-26":31, "2026-08-27":31,
    "2026-08-28":32, "2026-08-29":32, "2026-08-30":31,
    "2026-08-31":32
}

data = []

with open("backtest_milano_forecast.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        date = row["date"]

        if date not in obs:
            continue

        forecast = float(row["forecast_max"])
        actual = obs[date]
        error = forecast - actual

        data.append({
            "date": date,
            "model": row["model"],
            "lead": row["lead"],
            "forecast": forecast,
            "actual": actual,
            "error": error
        })

groups = defaultdict(list)

for r in data:
    groups[(r["model"], r["lead"])].append(r)

print()
print("=" * 72)
print(" METEOIQ — BACKTEST MILANO AGOSTO 2026")
print("=" * 72)
print()
print(f"{'MODELLO':14} {'LEAD':5} {'MAE':8} {'RMSE':8} {'BIAS':8} {'±1°C':8}")
print("-" * 72)

scores = []

for (model, lead), rows in sorted(groups.items()):

    errors = [r["error"] for r in rows]

    mae = sum(abs(e) for e in errors) / len(errors)
    rmse = math.sqrt(sum(e*e for e in errors) / len(errors))
    bias = sum(errors) / len(errors)
    within1 = sum(abs(e) <= 1 for e in errors) / len(errors) * 100

    scores.append((mae, model, lead, rmse, bias, within1))

    print(
        f"{model:14} {lead:5} "
        f"{mae:7.2f}° {rmse:7.2f}° "
        f"{bias:+7.2f}° {within1:6.1f}%"
    )

print()
print("=" * 72)
print(" CLASSIFICA PER ACCURATEZZA (MAE)")
print("=" * 72)

for i, item in enumerate(sorted(scores), 1):
    mae, model, lead, rmse, bias, within1 = item

    print(
        f"{i}. {model:14} {lead} "
        f"→ MAE {mae:.2f}°C | "
        f"RMSE {rmse:.2f}°C | "
        f"Bias {bias:+.2f}°C | "
        f"±1°C {within1:.1f}%"
    )

print()
print("=" * 72)
print(" MEDIA COMPLESSIVA DEI 3 LEAD TIME")
print("=" * 72)

model_scores = defaultdict(list)

for mae, model, lead, rmse, bias, within1 in scores:
    model_scores[model].append(mae)

overall = []

for model, values in model_scores.items():
    avg = sum(values) / len(values)
    overall.append((avg, model))

for i, (avg, model) in enumerate(sorted(overall), 1):
    print(f"{i}. {model:14} → MAE medio D-1/D-2/D-3 = {avg:.2f}°C")

print()
