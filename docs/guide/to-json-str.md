# `!to-json-str`

Serialize a knarr node to a JSON **string**. Canon is Go `encoding/json.Marshal`: compact, **sorted** keys, HTML-escape `& < >`.

## Syntax

```yaml
config.json: !to-json-str $Values.config
```

Tagged scalar `RefScalar`. Omit path → omit.

## Examples

### ConfigMap JSON

```yaml
!emit
runtime.json: !to-json-str $Values.runtime
```

### Annotation + checksum

```yaml
checksum/config: !sha256-json $Values.config
config.json: !to-json-str $Values.config
```

### `&` in a note

`a&b` becomes `"a\u0026b"` in JSON.

### Float

JSON of knarr float matches Go `float64` marshal (`1.0` as float may print `1`).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Json: !expr "toJson($Values.config)"
# no toJson() in !expr
```

</td><td>

```yaml
!emit
config.json: !to-json-str $Values.config
# JSON text is the !to-json-str tag
```

</td></tr>
<tr><td>

```yaml
!emit
config.json: !to-json-str $Values.config
# pretty JSON or first-seen key order would break checksums
```

</td><td>

```yaml
!emit
config.json: !to-json-str $Values.config
# canon is compact, sorted keys, HTML-escape — same as Go json.Marshal
```

</td></tr>
<tr><td>

```yaml
!bind
$Yaml: !to-yaml-str $Values.config
# !to-yaml-str is not v1
```

</td><td>

```yaml
!emit
config: !ref $Values.config
# emit the mapping as YAML, or use !to-json-str for JSON text
```

</td></tr>
</table>

## See also

- [`!from-json-str`](from-json-str.md)
- [`!sha256-json`](sha256-json.md)

## Comparison with Helm

Canon is Go `json.Marshal`: compact, **sorted** keys, HTML-escape `& < >` — same as `toJson`.

<table>
<tr><th>Helm</th><td>

```gotemplate
config.json: {{ toJson (required "config" .Values.config) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !not-empty $Values.config?
$fail: "config"
---
!emit
config.json: !to-json-str $Values.config
```

</td></tr>
<tr><th>Difference</th><td>

Same JSON. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm key is `checksum:`; knarr key is `checksum/config:`. Different document.

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
!emit
note.json: !to-json-str
  note: a&b
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
