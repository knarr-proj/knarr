# `!len` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `len .Values.workers` | `!len $Values.workers` |
| `len` of a string | UTF-8 **bytes** (Helm `len` is bytes too for strings in Go) |
| `gt (len .) 0` | [`!not-empty`](not-empty.md) |

Helm `len` is a function in the pipeline. knarr `!len` is a tag; no `len()` in `!expr`.
