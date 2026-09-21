# `!to-json-str`

Serialize a knarr node to a JSON **string**. Canon ≡ Helm `toJson` = Go `encoding/json.Marshal`: compact, **sorted** keys, HTML-escape `& < >`.

**Helm:** `toJson` — [vs Helm](to-json-str-vs-helm.md).

## Syntax

```yaml
data:
  config.json: !to-json-str $Values.config
```

Tagged scalar `RefScalar`. Omit path → omit.

## Examples

### ConfigMap JSON

```yaml
---
!emit
apiVersion: v1
kind: ConfigMap
metadata:
  name: app
data:
  runtime.json: !to-json-str $Values.runtime
```

### Annotation + checksum

```yaml
metadata:
  annotations:
    checksum/config: !sha256-json $Values.config
data:
  config.json: !to-json-str $Values.config
```

### `&` in a note

`a&b` becomes `"a\u0026b"` in JSON, like Helm.

### Float

JSON of knarr float matches Go `float64` marshal (`1.0` as float may print `1`).

## Common mistakes

**Wrong — `toJson()` in `!expr`**

**Wrong — expecting pretty JSON or first-seen key order**

That would break Helm checksums.

**Wrong — YAML dump**

`!to-yaml-str` is not v1; emit a mapping instead.

## See also

- [vs Helm](to-json-str-vs-helm.md)
- [`!from-json-str`](from-json-str.md)
- [`!sha256-json`](sha256-json.md)
