# `!policy` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| JSON Schema / `values.schema.json` | `!typedef` + `!policy` + `!$Type` |
| Missing required value at `helm template` | `strict` schema **or** missing `!ref` without `?.` (always) |
| Extra values keys ignored | `soft` allows extras; `strict` rejects |

## Side by side

Helm schema is a sidecar JSON file. knarr schema is YAML in `!typedef` and an instance tag `!$ValuesType`.

## Differences that bite

- Helm often renders with extra values. knarr **strict** (the default when types exist) rejects extras.
- knarr `soft` still does not invent `null` for missing `!ref`.
- There is no Helm `--validate` flag equivalent on the CLI beyond render errors.
