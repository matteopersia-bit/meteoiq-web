import urllib.request
import urllib.parse
import gzip
import csv
import io
import json
import re

print("Cerco dati NOAA GHCNh per Milano Linate...")

# Milano Linate
STATION = "160800"

# Catalogo NOAA GHCNh
CATALOG = "https://www.ncei.noaa.gov/data/global-historical-climatology-network-hourly/"

try:
    req = urllib.request.Request(
        CATALOG,
        headers={"User-Agent": "MeteoIQ-backtest/1.0"}
    )

    with urllib.request.urlopen(req, timeout=60) as r:
        html = r.read().decode("utf-8", errors="ignore")

except Exception as e:
    print("Errore accesso NOAA:", e)
    raise SystemExit(1)

print("Catalogo NOAA raggiunto.")

# Cerchiamo eventuali file che contengono 160800
matches = sorted(set(re.findall(
    r'href="([^"]*160800[^"]*)"',
    html,
    re.I
)))

print("File trovati:", len(matches))

for x in matches[:20]:
    print(" ", x)

if not matches:
    print()
    print("Il catalogo non espone direttamente il file della stazione.")
    print("Proviamo il download tramite il percorso standard NOAA.")
    
    candidates = [
        "https://www.ncei.noaa.gov/data/global-historical-climatology-network-hourly/access/2026/160800.csv",
        "https://www.ncei.noaa.gov/data/global-historical-climatology-network-hourly/access/2026/160800.psv",
        "https://www.ncei.noaa.gov/data/global-historical-climatology-network-hourly/access/2026/160800.psv.gz",
    ]

else:
    candidates = []

    for m in matches:
        if m.startswith("http"):
            candidates.append(m)
        else:
            candidates.append(
                urllib.parse.urljoin(CATALOG, m)
            )

print()
print("Provo i percorsi disponibili...")

downloaded = None
download_url = None

for url in candidates:

    print("Provo:", url)

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "MeteoIQ-backtest/1.0"}
        )

        with urllib.request.urlopen(req, timeout=120) as r:
            content = r.read()

        if len(content) > 100:
            downloaded = content
            download_url = url
            print("OK")
            break

    except Exception as e:
        print("  non disponibile")

if downloaded is None:
    print()
    print("NON SONO RIUSCITO A SCARICARE IL FILE NOAA AUTOMATICAMENTE.")
    print()
    print("Non modificare nulla.")
    print("Incollami questo output e sistemiamo il percorso esatto.")
    raise SystemExit(1)

print()
print("File NOAA scaricato:")
print(download_url)

# Decompressione eventuale
if download_url.endswith(".gz"):
    downloaded = gzip.decompress(downloaded)

text = downloaded.decode("utf-8", errors="replace")

print("Dimensione:", len(text), "caratteri")

# Il nuovo GHCNh può usare PSV.
lines = text.splitlines()

if not lines:
    print("File vuoto.")
    raise SystemExit(1)

header = lines[0]
print("Header:", header[:300])

# Proviamo CSV/PSV
delimiter = "|" if "|" in header else ","

reader = csv.DictReader(
    io.StringIO(text),
    delimiter=delimiter
)

fields = reader.fieldnames or []

print("Campi trovati:", fields[:30])

# Trova il campo temperatura
temp_field = None

for f in fields:
    fl = f.lower()

    if (
        "dry" in fl and "temperature" in fl
    ) or fl in ("temp", "temperature"):
        temp_field = f
        break

if temp_field is None:
    # Cerca colonne contenenti TMP
    for f in fields:
        if "tmp" in f.lower():
            temp_field = f
            break

print("Campo temperatura:", temp_field)

if temp_field is None:
    print()
    print("Non ho identificato automaticamente la temperatura.")
    print("Incollami l'output precedente.")
    raise SystemExit(1)

daily = {}

for row in reader:

    # Individua data/ora
    date_field = None

    for f in fields:
        fl = f.lower()

        if fl in ("date", "datetime", "time"):
            date_field = f
            break

    if date_field is None:
        for f in fields:
            if "date" in f.lower() or "time" in f.lower():
                date_field = f
                break

    if date_field is None:
        continue

    timestamp = row.get(date_field, "")

    if not timestamp:
        continue

    date = timestamp[:10]

    if not ("2026-06-01" <= date <= "2026-08-31"):
        continue

    raw = row.get(temp_field, "")

    if not raw:
        continue

    # Gestisce eventuali valori tipo:
    # 298.15, 25.0, 250, ecc.
    try:
        value = float(raw)
    except:
        continue

    # Se Kelvin
    if value > 150:
        value = value - 273.15

    # Se NOAA usa decimi di °C
    elif value > 60:
        value = value / 10.0

    if -50 < value < 60:

        if date not in daily:
            daily[date] = []

        daily[date].append(value)

rows = []

for date in sorted(daily):

    temps = daily[date]

    if temps:
        rows.append({
            "date": date,
            "actual_max": round(max(temps), 1)
        })

with open(
    "milano_linate_observations.csv",
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=["date", "actual_max"]
    )

    writer.writeheader()
    writer.writerows(rows)

print()
print("==========================================")
print(" OSSERVAZIONI MILANO LINATE")
print("==========================================")
print("Giorni trovati:", len(rows))

if rows:
    print("Prima:", rows[0]["date"], rows[0]["actual_max"], "°C")
    print("Ultima:", rows[-1]["date"], rows[-1]["actual_max"], "°C")

print()
print("File creato:")
print("milano_linate_observations.csv")
