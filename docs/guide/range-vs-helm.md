# `!range` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `until 5` → 0..4 | `!range` `$until: 5` |
| `untilStep 0 5 1` | `$from` `$until` `$step` |
| `seq 1 3` inclusive | `$from: 1` `$to: 3` |
| `range until N` in a template | bind `!range`, then `!foreach` / `!emit-foreach` |

## Differences that bite

- Helm `until` is exclusive. knarr `$to` is **inclusive**; `$until` matches Helm.
- You cannot drop `!range` into `$over` or a manifest field.
