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

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!bind
$Tok: !expr "b64enc($Values.token)"
# no b64enc() in !expr
```

</td><td>

```yaml
---
!emit
data:
  token: !b64enc $Values.token
# encode with !b64enc
```

</td></tr>
<tr><td>

```yaml
---
!emit
data:
  config: !b64enc $Values.config
# encoding a mapping is an error
```

</td><td>

```yaml
---
!bind
$Json: !to-json-str $Values.config
---
!emit
data:
  config: !b64enc $Json
# encode a string; JSON bytes via !to-json-str first
```

</td></tr>
<tr><td>

```yaml
---
!bind
$Tok: !b64enc $Values?.token
# omit $of without ?: on the key is an error
```

</td><td>

```yaml
---
!bind
$Tok?: !b64enc $Values?.token
---
!emit
data:
  token?: !ref $Tok?
# pair omit markers
```

</td></tr>
</table>

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
