# `!float` vs Helm

## Mapping

| Helm / sprig | knarr |
|--------------|--------|
| YAML `0.5` in values | knarr float |
| `float64` | `!float` |
| millicpu `500m` | **string**, not float — Quantity is not a type in v1 |
| `add 1 0.5` | `!expr "$N + 0.5"` (int promotes to float) |
| `.nan` / `.inf` | **error** |

## Side by side

**Helm**

```gotemplate
cpu: {{ .Values.cpu }}
```

**knarr** (fractional cores)

```yaml
spec:
  containers:
    - resources:
        limits:
          cpu: !ref $Values.cpu   # YAML 0.5
```

**knarr** (millicores stay a string)

```yaml
cpu: "500m"
```

## Differences that bite

- Helm charts mix Quantity strings and floats in the same field. knarr keeps `"500m"` as string and `0.5` as IEEE f64.
- `!int` of `0.5` is an error (no truncation). Use `!float` or keep the YAML float.
- `0.1 + 0.2` is IEEE, same as Helm/Go — not decimal.
- There is no `float64()` inside [`!expr`](expr.md).
