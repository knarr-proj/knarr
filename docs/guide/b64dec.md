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

**Wrong — host `b64dec()` in `!expr`**

**Wrong — padding / url alphabet surprises**

RFC 4648 standard alphabet; invalid input fails the render.

## See also

- [`!b64enc`](b64enc.md)

## Comparison with Helm

`!b64dec` yields UTF-8 text. Invalid alphabet fails the render.

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
ca.crt: {{ .Values.caB64 | b64dec }}
```

</td><td>

```yaml
---
!bind
$Ca: !b64dec $Values.caB64
---
!emit
data:
  ca.crt: !ref $Ca
```

</td><td>

—

</td></tr>
<tr><td>

```gotemplate
token: {{ .Values.tokenB64 | b64dec }}
```

</td><td>

```yaml
---
!emit
data:
  token?: !b64dec $Values?.tokenB64
```

</td><td>

Missing value is empty in Helm; knarr `?:` omits the key.

</td></tr>
<tr><td>

```gotemplate
token: {{ b64enc (b64dec .Values.wrapped) }}
```

</td><td>

```yaml
---
!bind
$Raw: !b64dec $Values.wrapped
$Again: !b64enc $Raw
```

</td><td>

—

</td></tr>
</table>
