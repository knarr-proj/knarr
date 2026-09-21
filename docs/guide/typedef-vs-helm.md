# `!typedef` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| Defaults in `values.yaml` | `default:` on a `!typedef` field |
| `values.schema.json` | `!typedef` field types |
| Applying schema | `$Name: !$Type` |

## Side by side

**Helm** — merge default `values.yaml` with user `-f`.

**knarr** — one instance mapping tagged `!$ValuesType`; missing keys with `default` are filled; policy decides extras / missing required.

## Differences that bite

- Helm defaults apply even without a schema. knarr defaults apply only through `!$Type`.
- You cannot put `!$Type` on a nested field in v1 (only root `$Name` and `$yield`).
- `helm show values` has no knarr twin; the typedef document *is* the schema listing.
