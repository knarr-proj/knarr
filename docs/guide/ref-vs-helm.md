# `!ref` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{ .Values.name }}` | `!ref $Values.name` |
| `index .Values.labels "app.kubernetes.io/name"` | `!ref "$Values.labels['app.kubernetes.io/name']"` |
| `index .Values.workers 0` | `!ref "$Workers[0].name"` |
| `index .Values.images $name` | `!expr "$Values.images[$Name]"` |

## Side by side

**Helm**

```gotemplate
image: {{ index .Values.images .name }}
```

**knarr**

```yaml
image: !expr "$Values.images[$Worker.name]"
```

(static keys stay `!ref`.)

## Differences that bite

- Helm missing keys often become `<no value>` / empty. knarr missing without `?.` is an **error**.
- Helm `quote` is not `!ref`. Use [`!format`](format.md) `%q` or emit the string as YAML.
