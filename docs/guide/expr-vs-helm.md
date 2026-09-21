# `!expr` vs Helm

## Mapping

| Helm / sprig | knarr |
|--------------|--------|
| `and` `or` `not` `eq` `ne` `gt` `lt` | `&&` `\|\|` `!` `==` `!=` `>` `<` in `!expr` |
| `add` / `add1` | `+` (int or float promote) |
| `printf` | [`!format`](format.md), not a call |
| `len` | [`!len`](len.md) |
| `default` | `??` (omit only) |
| `?:` ternary | [`!match`](match.md) |
| `hasKey` | no `has()`; use `?.` / omit |

## Side by side

**Helm**

```gotemplate
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
```

**knarr**

```yaml
$when: !expr "$Values.service.enabled && $Values.replicas > 1"
```

## Differences that bite

- Sprig is a large function library. knarr `!expr` has **operators only**; the rest are YAML tags.
- Helm `+` on strings concatenates in some pipelines. knarr `+` never concatenates strings.
- CEL-looking syntax is **not** the CEL standard library.
