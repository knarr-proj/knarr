# `!emit` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `templates/foo.yaml` | `!emit` document |
| `{{- if .Values.service.enabled }}` around a whole file | `$when` / `$then` / `$else: ""` on `!emit` |
| Several files concatenated by Helm | Several `!emit` documents, source order |
| `{{ toYaml . \| nindent 8 }}` of a whole object | Nested mapping in `$then` / omit keys |

## Side by side

**Helm**

```gotemplate
{{- if .Values.service.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.name }}
{{- end }}
```

**knarr**

```yaml
---
!emit
$when: !ref $Values.service.enabled
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

## Differences that bite

- Helm `if` can wrap any text. knarr `$when` wraps **one mapping document**, not a string of YAML.
- Inner `if` on a **field** is [`!match`](match.md) or omit, not a second `$when`.
- Helm may emit `---` itself. knarr owns document separators.
