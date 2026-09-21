# `!b64enc` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{ .Values.password \| b64enc }}` | `!b64enc $Values.password` |
| `b64enc` in `data:` | same place, tag instead of pipeline |

Helm `b64enc` of non-strings depends on `printf %s`. knarr requires a **string**.
