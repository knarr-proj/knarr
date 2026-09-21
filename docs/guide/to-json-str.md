# `!to-json-str`

Serialize a knarr node to a JSON **string**. Canon is Go `encoding/json.Marshal`: compact, **sorted** keys, HTML-escape `& < >`.

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

`a&b` becomes `"a\u0026b"` in JSON.

### Float

JSON of knarr float matches Go `float64` marshal (`1.0` as float may print `1`).

## Common mistakes

**Wrong — `toJson()` in `!expr`**

**Wrong — expecting pretty JSON or first-seen key order**

That would break checksums that depend on this canon.

**Wrong — YAML dump**

`!to-yaml-str` is not v1; emit a mapping instead.

## See also

- [`!from-json-str`](from-json-str.md)
- [`!sha256-json`](sha256-json.md)

## Comparison with Helm

Canon is Go `json.Marshal`: compact, **sorted** keys, HTML-escape `& < >` — same as `toJson`.

<table>
<tr><th>Helm</th><td>

```gotemplate
config.json: {{ toJson .Values.config }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
data:
  config.json: !to-json-str $Values.config
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
checksum: {{ toJson .Values.config | sha256sum }}
config.json: {{ toJson .Values.config }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
metadata:
  annotations:
    checksum/config: !sha256-json $Values.config
data:
  config.json: !to-json-str $Values.config
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
note.json: {{ toJson (dict "note" "a&b") }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
data:
  note.json: !to-json-str
    note: a&b
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
