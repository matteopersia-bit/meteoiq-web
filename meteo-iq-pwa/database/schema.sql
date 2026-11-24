-- Base schema for the future historical model-ranking feature.
CREATE TABLE locations (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL, timezone TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE forecasts (
  id TEXT PRIMARY KEY, model TEXT NOT NULL, location_id TEXT NOT NULL REFERENCES locations(id),
  forecast_issued_at TIMESTAMPTZ NOT NULL, forecast_for TIMESTAMPTZ NOT NULL,
  temperature_c REAL, precipitation_mm REAL, wind_kmh REAL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX forecasts_lookup ON forecasts(location_id, model, forecast_for);
CREATE TABLE actuals (
  id TEXT PRIMARY KEY, location_id TEXT NOT NULL REFERENCES locations(id), observed_at TIMESTAMPTZ NOT NULL,
  temperature_c REAL, precipitation_mm REAL, wind_kmh REAL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX actuals_location_time ON actuals(location_id, observed_at);
