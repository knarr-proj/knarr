# `!sha256` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `"foo" \| sha256sum` | `!sha256` `$of` string |
| `include "..." . \| sha256sum` | hash a bound string |
| `toJson . \| sha256sum` | [`!sha256-json`](sha256-json.md) |
| `toYaml . \| sha256sum` | not v1 (`!sha256-yaml` later) |

Helm `sha256sum` of a dict without `toJson` is not defined the same way; knarr refuses mapping `$of`.
