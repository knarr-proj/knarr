# `!str` vs Helm

## Mapping

| Helm / sprig | knarr |
|--------------|--------|
| `toString` / `print` | `!str` |
| `quote` | not v1; [`!format`](format.md) `%q` for Go quotes |
| `toYaml` of a map | **error** — emit the mapping, or [`!to-json-str`](to-json-str.md) |
| `printf "%s"` on an int | use `%d`, or `!str` then `%s` |

## Side by side

**Helm**

```gotemplate
metadata:
  labels:
    replicas: {{ .Values.replicas | toString | quote }}
```

**knarr**

```yaml
metadata:
  labels:
    replicas: !str $Values.replicas
```

## Differences that bite

- Helm `print` / `toString` will stringify almost anything. knarr `!str` refuses seq and map.
- Float text is Go `FormatFloat 'g'`, same family as Helm/Go, not Rust `Display`.
- Labels and annotations must be strings: coerce ints and bools with `!str` at the field, or bind first.
