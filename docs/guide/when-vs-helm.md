# `$when` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{- if .Values.service.enabled }}` … `{{- end }}` around a file | `!emit` `$when` / `$then` / `$else: ""` |
| `if` wrapping `range` of resources | `$when` on `!emit-foreach` |
| `if` inside a spec field | [`!match`](match.md), not `$when` |
| `else if` | nested `$else: !match` or a bool `!expr` |

## Side by side

**Helm**

```gotemplate
{{- if .Values.service.enabled }}
apiVersion: v1
kind: Service
{{- end }}
```

**knarr** — see [`!emit`](emit.md).

## Differences that bite

- Helm `if` is textual. knarr `$when` needs a **bool** node; omit without `??` is an error.
- Helm `with` is not `$when`. Optional object: `affinity?: !ref $Values?.affinity`.
