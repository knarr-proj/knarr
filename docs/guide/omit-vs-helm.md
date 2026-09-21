# Omit vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{- with .Values.affinity }}{{ toYaml . }}{{ end }}` | `affinity?: !ref $Values?.affinity` |
| `default "localhost" .Values.tls.host` | `!expr "$Values.tls?.host ?? 'localhost'"` |
| `dig` / `index` missing → nil | missing without `?.` is **error** |
| `if .Values.foo` omitting a key | `foo?:` + omit value |
| `coalesce` | [`!pick`](pick.md) (omit, not Helm empty) |

## Side by side

**Helm**

```gotemplate
{{- with .Values.affinity }}
affinity:
{{ toYaml . | nindent 2 }}
{{- end }}
```

**knarr**

```yaml
affinity?: !ref $Values?.affinity
```

## Differences that bite

- Helm nil / empty / missing blur together. knarr: missing without `?.` **fails**; `""` / `0` / `false` are real values (not omit).
- `??` does not treat `""` as missing.
- `with` does not change `.` in knarr; paths stay explicit.
