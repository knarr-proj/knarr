# `!emit-foreach` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `range` wrapping a whole `templates/*.yaml` | `!emit-foreach` |
| `range $k, $v := .Values.images` | `$over` map, `$key: $K`, `$as: $V` |
| `if` inside `range` to skip an item | `$filter` or `$yield?:` |
| `if` around the whole `range` | `$when` on `!emit-foreach` (no `$else`) |
| `range $i, $v` | No `$index` in v1 |

## Side by side

**Helm**

```gotemplate
{{- range .Values.workers }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ .name }}
---
{{- end }}
```

**knarr**

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
    name: !ref $Worker.name
```

## Differences that bite

- Helm `range` in a **field** (env list) is [`!foreach`](foreach.md), not `!emit-foreach`.
- Empty `$over` prints **nothing** (empty stdout if that was the only emit), exit 0 — not an error.
- No splat “here is a list of manifests, emit them”. Each document comes from `$yield`.
