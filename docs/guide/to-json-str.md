# `!to-json-str`

Serialize a knarr node to a JSON **string**. Canon is Go `encoding/json.Marshal`: compact, **sorted** keys, HTML-escape `& < >`.

## Syntax

```yaml
# $Values = {config: {a: 1}}
config.json: !to-json-str $Values.config
# config.json: {"a":1}
```

Tagged scalar `RefScalar`. Omit path → omit.

## Examples

### ConfigMap JSON

```yaml
# $Values = {runtime: {a: 1}}
!emit
runtime.json: !to-json-str $Values.runtime
# runtime.json: {"a":1}
```

### Annotation + checksum

```yaml
# $Values = {config: {a: 1}}
checksum/config: !sha256-json $Values.config
config.json: !to-json-str $Values.config
# checksum/config: 015abd7f… / config.json: {"a":1}
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
# $Values = {config: {a: 1}}
!bind
$Json: !expr "toJson($Values.config)"
# error: no toJson() in !expr
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!emit
config.json: !to-json-str $Values.config
# config.json: {"a":1}
```

</td></tr>
<tr><td>

```yaml
# $Values = {config: {a: 1}}
!emit
config.json: !to-json-str $Values.config
# error: pretty JSON or first-seen key order would break checksums
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!emit
config.json: !to-json-str $Values.config
# config.json: {"a":1}
```

</td></tr>
<tr><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$Yaml: !to-yaml-str $Values.config
# error: !to-yaml-str is not v1
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!emit
config: !ref $Values.config
# config: {a: 1}
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
# $Values = {config: {a: 1}}
config.json: {{ toJson (required "config" .Values.config) }}
# config.json: {"a":1}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {config: {a: 1}}
!validation
$rules:
  - !is-not-empty $Values.config?
$fail: "config"
---
!emit
config.json: !to-json-str $Values.config
# config.json: {"a":1}
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
# $Values = {}
note.json: {{ toJson (dict "note" "a&b") }}
# note.json: {"note":"a\u0026b"}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit
note.json: !to-json-str
  note: a&b
# note.json: {"note":"a\u0026b"}
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
