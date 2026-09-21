# `!format` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `printf "%s-%s" .env .name` | `!format` sequence in `!bind` |
| `print` / `println` | `!format` / `!join` |
| Go `fmt` verbs | same dialect; mismatch **errors** |
| `quote` | `%q` or YAML quoting |

## Side by side

**Helm**

```gotemplate
name: {{ printf "%s-%s" .Release.Name .Chart.Name }}
```

**knarr** (no `.Release` in v1 — use your `$Values`)

```yaml
$Name: !format
  - "%s-%s"
  - !ref $Values.release
  - !ref $Values.chart
```

## Differences that bite

- Helm `printf` sits in the template field. knarr `!format` cannot.
- Helm/Go inserts `%!d(string=x)` on mismatch. knarr **fails**.
- `%q` is Go quoting, not `toJson`.
- There is no `!printf` alias.
