# `!pick` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `coalesce .a .b "app"` | `!pick` **only if** skip means *omit*, not empty |
| `default "app" .Values.name` | `??` when one optional path |
| `empty` fallthrough | **not** `!pick` |

## Side by side

**Helm**

```gotemplate
name: {{ coalesce .Values.fullnameOverride .Values.name "app" }}
```

**knarr** (omit-based)

```yaml
name: !pick
  - !ref $Values?.fullnameOverride
  - !ref $Values?.name
  - app
```

If Helm relied on skipping `""`, write an explicit `!match` / `!not-empty` instead.

## Differences that bite

- `coalesce` uses Helm `empty` (`""`, `0`, `false`, `[]`). `!pick` only skips **omit**.
- `??` cannot chain; `!pick` is the N-way form.
