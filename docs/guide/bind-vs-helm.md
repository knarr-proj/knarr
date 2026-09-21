# `!bind` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `values.yaml` plus `-f` / `--set` | `!bind` `$Values:` (file or `!read`). No CLI overlay |
| `{{ $name := .Values.name }}` | `$Name: !ref $Values.name` in `!bind` |
| `{{ .Values }}` dotted path | `$Values` + `!ref` / `!expr` |
| Chart `global:` | Ordinary keys under `$Values` |

## Side by side

**Helm**

```yaml
# values.yaml
name: api
---
# templates/deploy.yaml
metadata:
  name: {{ .Values.name }}
```

**knarr**

```yaml
---
!bind
$Values:
  name: api
---
!emit
metadata:
  name: !ref $Values.name
```

## Differences that bite

- Helm merges many `-f` files. knarr has **one program file**; extra data is `!read` / extra `!bind` keys you write yourself.
- Helm `$_ :=` assignments are scoped to a template. knarr `$Name` is **global** to the render (except `$as` / `$key` in a loop).
- There is no `.Release.Name` in v1. Do not bind `$Release`.
