# Meteo IQ PWA

PWA Next.js orientata al confronto tra ECMWF IFS, ECMWF AIFS, NOAA GFS e DWD ICON. I dati arrivano esclusivamente dal server tramite Open-Meteo: il browser non riceve né conserva chiavi API.

## Avvio

Serve Node.js 22.15 o successivo. Gli script abilitano la CA di sistema di Node, così le chiamate server-side a Open-Meteo rispettano la verifica TLS anche in reti con certificati aziendali o locali.

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`. Safari su iPhone può installarla da Condividi → "Aggiungi a Home".

## Struttura

- `app/api/weather`: adapter server-side Open-Meteo; i fallimenti di un modello non bloccano gli altri.
- `lib/providers.ts`: interfaccia `WeatherProvider` per i provider presenti e futuri.
- `lib/weather.ts`: aggregazione e indice di concordanza, senza presentarlo come probabilità di correttezza.
- `database/schema.sql`: tabelle per confrontare in futuro forecast e osservazioni reali.

Per aggiungere un provider, si implementa lo stesso contratto `ModelForecast` sul server: la UI usa soltanto quel contratto e non conosce il provider.
