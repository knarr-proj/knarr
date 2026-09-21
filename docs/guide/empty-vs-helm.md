# `!empty` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `empty .Values.tls` | `!empty $Values?.tls` |
| `if not empty` | [`!not-empty`](not-empty.md) |

Helm `empty` on missing keys is often true. knarr missing **without** `?.` is an error; with `?.` omit counts as empty.
