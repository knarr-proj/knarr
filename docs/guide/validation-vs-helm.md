# `!validation` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{ required "msg" .Values.name }}` | `!validation` + `!not-empty` + `$fail` |
| `{{ fail "msg" }}` | `$fail` |
| No first-class warning | `$warning` (stderr, exit 0) |

## Side by side

**Helm**

```gotemplate
name: {{ required "name is required" .Values.name }}
```

**knarr**

```yaml
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "name is required"
---
!emit
metadata:
  name: !ref $Values.name
```

## Differences that bite

- Helm `required` is an expression in a field. knarr validation is a **document**, evaluated before emit.
- `$fail` clears **all** stdout, not only the current template.
- Helm `fail` in a loop can be partial; knarr `$fail` is global to the render.
