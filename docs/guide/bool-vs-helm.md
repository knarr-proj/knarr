# `!bool` vs Helm

## Mapping

| Helm / sprig | knarr |
|--------------|--------|
| YAML bool `true` | already bool — `!ref` |
| `eq .Values.ha "true"` | `!bool $Values.ha` if the value is the **string** `"true"` |
| sprig `toBool` / `true` of `"yes"` | **error** |
| `1` / `"1"` as true | **error** |

## Side by side

**Helm** (string flag in values)

```gotemplate
{{- if eq .Values.ha "true" }}
apiVersion: policy/v1
kind: PodDisruptionBudget
{{- end }}
```

**knarr**

```yaml
---
!bind
$HA: !bool $Values.ha
---
!emit
$when: !ref $HA
$then:
  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata:
    name: !ref $Values.name
$else: ""
```

## Differences that bite

- Helm helpers often treat `yes`, `on`, `TRUE`, `1` as true. knarr `!bool` accepts only a bool or lowercase `"true"` / `"false"`.
- Prefer real YAML bools in values (`enabled: true`) and `!ref` them. Use `!bool` when a string must be coerced.
- There is no `bool()` inside [`!expr`](expr.md).
