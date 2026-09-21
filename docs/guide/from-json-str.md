# `!from-json-str`

Parse a JSON **string** into a knarr node.

## Syntax

```yaml
$Extra: !from-json-str $Values.extraJson
```

- Object → mapping, array → seq, bool/string as usual.
- JSON integer without `.` or exponent → **int**.
- Number with `.` / `e`/`E` → **float** (`1e2` is float `100.0`).
- `null`, duplicate keys, invalid JSON, Inf → error.

## Examples

### Extra overlay from a string value

```yaml
---
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
spec:
  replicas: !ref $Extra.replicas
```

### Read JSON file as YAML

Prefer [`!read`](read.md) when the file is a document. Use `!from-json-str` when the JSON is already a **string** in values.

### HTML unescape

JSON `\u0026` becomes `&` in the string node.

## Common mistakes

**Wrong — `fromJson()` in `!expr`**

**Wrong — expecting JSON `1` to stay float**

Bare `1` becomes int (same as Go `encoding/json`).

**Wrong — `null` in JSON**

knarr has no null.

## See also

- [`!to-json-str`](to-json-str.md)
- [`!read`](read.md)

## Comparison with Helm

`!from-json-str` parses a JSON **string**. `null` is an error.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{ .Values.extraJson | fromJson }}
```

</td><td>

```yaml
---
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
spec:
  replicas: !ref $Extra.replicas
```

</td></tr>
<tr><td>

```gotemplate
{{ .Files.Get "x.json" | fromJson }}
```

</td><td>

```yaml
$Extra: !read x.json
```

</td></tr>
<tr><td>

```gotemplate
{{ fromJson "{\"n\":1}" }}
```

</td><td>

```yaml
$N: !from-json-str '{"n":1}'
# n is int, not float
```

</td></tr>
</table>
