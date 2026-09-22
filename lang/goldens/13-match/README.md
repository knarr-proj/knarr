# 13-match

Проверяет: решения **33/37** — `!match` mapping `$if`/`$yield`/`$else-yield`.

- `replicas: !match` с `$else-yield` (всегда ключ)
- `topologySpreadConstraints?: !match` без `$else-yield` (omit, если предикат ложен)
