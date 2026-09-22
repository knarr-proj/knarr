# `!from-json-str`

Parse a JSON **string** into a knarr node.

## Syntax

```yaml
# $Values = {extraJson: '{"replicas":3}'}
$Extra: !from-json-str $Values.extraJson
# $Extra = {replicas: 3}
```

- Object → mapping, array → seq, bool/string as usual.
- JSON integer without `.` or exponent → **int**.
- Number with `.` / `e`/`E` → **float** (`1e2` is float `100.0`).
- Object field `null` ≡ that key is absent. JSON `[null]` / duplicate keys / invalid JSON / Inf → error. Root `null` ≡ omit of the value.

## Examples

### Extra overlay from a string value

```yaml
# $Values = {extraJson: '{"replicas":3}'}
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
replicas: !ref $Extra.replicas
# replicas: 3
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
# $Values = {extraJson: '{"replicas":3}'}
!bind
$Extra: !expr "fromJson($Values.extraJson)"
# error: no fromJson() in !expr
```

</td><td>

```yaml
# $Values = {extraJson: '{"replicas":3}'}
!bind
$Extra: !from-json-str $Values.extraJson
---
!emit
replicas: !ref $Extra.replicas
# replicas: 3
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$N: !from-json-str '{"n":1}'
# error: do not expect n to stay float64
```

</td><td>

```yaml
# $Values = {}
!bind
$N: !from-json-str '{"n":1}'
# $N = {n: 1}
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$X: !from-json-str '{"n":null}'
---
!emit
n: !ref $X.n
# error: n is absent; required path
```

</td><td>

```yaml
# $Values = {}
!bind
$X: !from-json-str '{"n":null}'
---
!emit
n?: !ref $X.n?
# no n
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
# $Values = {extraJson: '{"replicas":3}'}
replicas: {{ ( .Values.extraJson | fromJson ).replicas }}
# replicas: 3
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {extraJson: '{"replicas":3}'}
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
replicas: !ref $Extra.replicas
# replicas: 3
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# x.json = {"n":1}
extra: {{ .Files.Get "x.json" | fromJson }}
# extra: {n: 1.0}
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
# $Values = {}
n: {{ fromJson "{"n":1}" }}
# n: {n: 1.0}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `fromJson` numbers are float64. Knarr JSON numbers without `.` are int.

</td></tr>
</table>
