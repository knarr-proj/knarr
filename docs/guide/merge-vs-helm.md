# `!merge` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `merge dest src` | `!merge` sequence, later wins |
| `mergeOverwrite` | not a separate tag; later map already overwrites |
| `mustMerge` | type clash is always an error |

Helm `merge` is a function; knarr `!merge` is bind-only. Sequence keys are replaced in both typical Helm and knarr.
