# `!split` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `splitList "," .` | `!split` `$sep` / `$of` |
| `split ":" .` (map with `_0`) | sequence, then index |

Helm `split` returns a dict of `_0`, `_1`. knarr returns a **list**.
