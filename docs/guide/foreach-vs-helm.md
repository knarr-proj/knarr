# `!foreach` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `range` over a list in `env:` / `ports:` | `!foreach` on that field |
| `range $k, $v := .Values.labels` | `$over` map, `$key`, `$as` |
| `if` inside `range` | `$filter` or `$yield?:` |
| `range` of whole YAML documents | [`!emit-foreach`](emit-foreach.md) |

## Side by side

**Helm**

```gotemplate
env:
{{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
```

**knarr**

```yaml
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

## Differences that bite

- Helm `range` on a missing value can yield nothing or error depending on `with`. knarr `$over` cannot omit; default the list.
- Empty `range` in Helm still prints `env:` if you wrote the key. knarr: `env:` + `[]` stays `env: []`; `env?:` + `[]` drops the key.
- No `$index` (Helm `$i, $v`).
