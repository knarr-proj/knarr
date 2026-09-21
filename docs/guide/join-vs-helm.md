# `!join` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `join "," .Values.hosts` | `!join` `$sep` + `$over` |
| `concat` strings with `printf` | [`!format`](format.md) |

Helm `join` is a function on a field. knarr join is bind-only.
