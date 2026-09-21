# `!int` vs Helm

## Mapping

| Helm / sprig | knarr |
|--------------|--------|
| `int .Values.port` | `!int $Values.port` |
| `atoi` | `!int` on a decimal string |
| `int 1.9` (truncates) | **error** — no truncation |
| `!!int` | forbidden in knarr documents |

## Side by side

**Helm**

```gotemplate
containerPort: {{ int .Values.port }}
```

**knarr**

```yaml
---
!bind
$Port: !int $Values.port
---
!emit
spec:
  ports:
    - containerPort: !ref $Port
```

## Differences that bite

- Helm `int` of a float truncates. knarr **errors** on float (`1.9`, `0.5`).
- Helm `int "08"` and knarr `!int` both yield `8`. `"+1"` and hex are knarr errors.
- There is no `int()` inside [`!expr`](expr.md). Coerce with the tag, then add.
