# 13-match

Проверяет: решения **33/37** — `!match` mapping `$if`/`$then`/`$else`.

- `replicas: !match` с `$else` (всегда ключ)
- `topologySpreadConstraints?: !match` без `$else` (omit, если предикат ложен)
