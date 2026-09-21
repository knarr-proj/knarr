# `!match` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `if` / `else` / `else if` in a field | `!match` `$if` / `$then` / `$else` |
| `else if` chain | `$else: !match` |
| `if` omitting a key | `key?: !match` without `$else` |
| ternary `?:` in sprig | not in `!expr`; use `!match` |

## Side by side

**Helm**

```gotemplate
replicas: {{ if gt .Values.replicas 0 }}{{ .Values.replicas }}{{ else }}1{{ end }}
```

**knarr**

```yaml
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
```

## Differences that bite

- Helm `if` can emit raw text (commas, comments). knarr `!match` yields a **YAML node**.
- Sprig ternary is not `??`. `??` is omit-default in [`!expr`](expr.md) only.
