# `!b64enc`

Base64-encode a **string** (UTF-8 bytes, RFC 4648, no newlines). Result is a string. Allowed on any value node (unlike `!format`).

## Syntax

```yaml
password: !b64enc $Values.password
$B64?: !b64enc $Values?.token
```

Tagged scalar, same `RefScalar` as `!ref`. Not a mapping `$of`.

## Examples

### Secret

```yaml
---
!emit
apiVersion: v1
kind: Secret
metadata:
  name: db
type: Opaque
data:
  password: !b64enc $Values.password
  username: !b64enc $Values.user
```

### Optional token

```yaml
---
!bind
$Tok?: !b64enc $Values?.token
---
!emit
data:
  token?: !ref $Tok?
```

### ConfigMap of a certificate

```yaml
data:
  tls.crt: !b64enc $Values.certPem
```

## Common mistakes

**Wrong — `b64enc()` in `!expr`**

**Wrong — encoding a mapping**

Encode a string (`!to-json-str` first if you need JSON bytes).

**Wrong — `$N: !b64enc $X?.y` without `?:` on the key**

Pair omit markers.

## See also

- [`!b64dec`](b64dec.md)

## Comparison with Helm

`!b64enc` is a tagged scalar on a **string** (RFC 4648, no newlines).

<table>
<tr><th>Helm</th><td>

```gotemplate
data:
  password: {{ .Values.password | b64enc }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
data:
  password: !b64enc $Values.password
  username: !b64enc $Values.user
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
token: {{ .Values.token | b64enc }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Tok?: !b64enc $Values?.token
---
!emit
data:
  token?: !ref $Tok?
```

</td></tr>
<tr><th>Difference</th><td>

Missing `.Values.token` is empty in Helm; knarr omit pair drops the key.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
tls.crt: {{ .Values.certPem | b64enc }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
data:
  tls.crt: !b64enc $Values.certPem
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
