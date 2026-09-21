# `!b64dec`

Base64-decode to a **string**. Invalid alphabet or non-UTF-8 is an error.

**Helm:** `b64dec` — [vs Helm](b64dec-vs-helm.md).

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

- [vs Helm](b64dec-vs-helm.md)
- [`!b64enc`](b64enc.md)
