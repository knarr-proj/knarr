# `!from-json-str`

Parse a JSON **string** into a knarr node.

## Syntax

```yaml
$Extra: !from-json-str $Values.extraJson
```

- Object → mapping, array → seq, bool/string as usual.
- JSON integer without `.` or exponent → **int**.
- Number with `.` / `e`/`E` → **float** (`1e2` is float `100.0`).
- Object field `null` ≡ that key is absent. JSON `[null]` / duplicate keys / invalid JSON / Inf → error. Root `null` ≡ omit of the value.

## Examples

### Extra overlay from a string value

```yaml
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
replicas: !ref $Extra.replicas
```

### Read JSON file as YAML

Prefer [`!read`](read.md) when the file is a document. Use `!from-json-str` when the JSON is already a **string** in values.

### HTML unescape

JSON `\u0026` becomes `&` in the string node.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Extra: !expr "fromJson($Values.extraJson)"
# no fromJson() in !expr
```

</td><td>

```yaml
!bind
$Extra: !from-json-str $Values.extraJson
---
!emit
replicas: !ref $Extra.replicas
# parse a JSON string with !from-json-str
```

</td></tr>
<tr><td>

```yaml
!bind
$N: !from-json-str '{"n":1}'
# do not expect n to stay float64
```

</td><td>

```yaml
!bind
$N: !from-json-str '{"n":1}'
# bare JSON 1 becomes int (same as Go encoding/json)
```

</td></tr>
<tr><td>

```yaml
!bind
$X: !from-json-str '{"n":null}'
---
!emit
n: !ref $X.n
# n is absent; required path errors
```

</td><td>

```yaml
!bind
$X: !from-json-str '{"n":null}'
---
!emit
n?: !ref $X.n?
# JSON null on a key ≡ key absent
```

</td></tr>
</table>

## See also

- [`!to-json-str`](to-json-str.md)
- [`!read`](read.md)

## Comparison with Helm

`!from-json-str` parses a JSON **string**. An object field `null` is “key missing”.

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ ( .Values.extraJson | fromJson ).replicas }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
replicas: !ref $Extra.replicas
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
extra: {{ .Files.Get "x.json" | fromJson }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `fromJson` numbers are float64. Knarr `!read` YAML/JSON numbers without `.` are int.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
n: {{ fromJson "{"n":1}" }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `fromJson` numbers are float64. Knarr JSON numbers without `.` are int.

</td></tr>
</table>
