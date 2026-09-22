# `!b64dec`

Base64-decode to a **string**. Invalid alphabet or non-UTF-8 is an error.

## Syntax

```yaml
# $Values = {certB64: Q0VSVA==}
$Pem: !b64dec $Values.certB64
# $Pem = "CERT"
```

## Examples

### Decode into a ConfigMap (plain)

```yaml
# $Values = {caB64: Q0E=}
!bind
$Ca: !b64dec $Values.caB64
---
!emit
ca.crt: !ref $Ca
# ca.crt: CA
```

### Round-trip check in bind

```yaml
# $Values = {wrapped: aGk=}
$Raw: !b64dec $Values.wrapped
$Again: !b64enc $Raw
# $Again = aGk=
```

### Optional

```yaml
# $Values = {}
token?: !b64dec $Values.tokenB64?
# no token
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {wrapped: aGk=}
!bind
$Raw: !expr "b64dec($Values.wrapped)"
# error: no b64dec() in !expr
```

</td><td>

```yaml
# $Values = {wrapped: aGk=}
!bind
$Raw: !b64dec $Values.wrapped
# $Raw = "hi"
```

</td></tr>
<tr><td>

```yaml
# $Values = {tokenUrlB64: "a-_"}
!emit
token: !b64dec $Values.tokenUrlB64
# error: URL-safe alphabet or missing padding
```

</td><td>

```yaml
# $Values = {tokenB64: dG9r}
!emit
token: !b64dec $Values.tokenB64
# token: tok
```

</td></tr>
</table>

## See also

- [`!b64enc`](b64enc.md)

## Comparison with Helm

`!b64dec` yields UTF-8 text. Invalid alphabet fails the render.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {caB64: Q0E=}
ca.crt: {{ required "ca" .Values.caB64 | b64dec }}
# ca.crt: CA
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {caB64: Q0E=}
!bind
$Ca: !b64dec $Values.caB64
---
!validation
$rules:
  - !is-not-empty $Values.caB64?
$fail: "ca"
---
!emit
ca.crt: !ref $Ca
# ca.crt: CA
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {tokenB64: dG9r}
token: {{ .Values.tokenB64 | b64dec }}
# token: tok
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Missing value is empty in Helm. Knarr `?:` omits the key.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {wrapped: aGk=}
token: {{ b64enc (b64dec .Values.wrapped) }}
# token: aGk=
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {wrapped: aGk=}
!bind
$Raw: !b64dec $Values.wrapped
$Again: !b64enc $Raw
---
!emit
token: !ref $Again
# token: aGk=
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `wrapped` is present.

</td></tr>
</table>
