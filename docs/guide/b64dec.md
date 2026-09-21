# `!b64dec`

Base64-decode to a **string**. Invalid alphabet or non-UTF-8 is an error.

## Syntax

```yaml
$Pem: !b64dec $Values.certB64
```

## Examples

### Decode into a ConfigMap (plain)

```yaml
---
!bind
$Ca: !b64dec $Values.caB64
---
!emit
apiVersion: v1
kind: ConfigMap
metadata:
  name: ca
data:
  ca.crt: !ref $Ca
```

### Round-trip check in bind

```yaml
$Raw: !b64dec $Values.wrapped
$Again: !b64enc $Raw
```

### Optional

```yaml
token?: !b64dec $Values?.tokenB64
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!bind
$Raw: !expr "b64dec($Values.wrapped)"
# no b64dec() in !expr
```

</td><td>

```yaml
---
!bind
$Raw: !b64dec $Values.wrapped
# decode with !b64dec
```

</td></tr>
<tr><td>

```yaml
---
!emit
data:
  token: !b64dec $Values.tokenUrlB64
# URL-safe alphabet (- _) or missing padding fails the render
```

</td><td>

```yaml
---
!emit
data:
  token: !b64dec $Values.tokenB64
# RFC 4648 standard alphabet (+ /) with padding
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
ca.crt: {{ .Values.caB64 | b64dec }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Ca: !b64dec $Values.caB64
---
!emit
data:
  ca.crt: !ref $Ca
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
token: {{ .Values.tokenB64 | b64dec }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
data:
  token?: !b64dec $Values?.tokenB64
```

</td></tr>
<tr><th>Difference</th><td>

Missing value is empty in Helm; knarr `?:` omits the key.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
token: {{ b64enc (b64dec .Values.wrapped) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Raw: !b64dec $Values.wrapped
$Again: !b64enc $Raw
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
