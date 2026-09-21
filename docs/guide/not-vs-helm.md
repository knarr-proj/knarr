# `!not` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `not .Values.foo` | `!not $Values.foo` |
| `not (empty .)` | [`!not-empty`](not-empty.md) |
| `if not .Values.x` | `$when: !not $Values.x` |

## Differences that bite

Helm `not` wraps any pipeline. knarr `!not` wraps a **path scalar** only.
