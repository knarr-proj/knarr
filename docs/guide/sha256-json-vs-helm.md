# `!sha256-json` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{ .Values.config \| toJson \| sha256sum }}` | `!sha256-json $Values.config` |
| `toYaml \| sha256sum` | not v1 |

This is the usual ConfigMap/Secret roll annotation pattern. Matching Helm requires the Go JSON canon (sorted keys, `\u0026`).
