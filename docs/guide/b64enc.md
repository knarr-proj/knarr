# `!b64enc`

Base64-encode a **string** (UTF-8 bytes, RFC 4648, no newlines). Result is a string. Allowed on any value node (unlike `!format`).

## Syntax

```yaml
password: !b64enc $Values.password
$B64?: !b64enc $Values.token?
```

Tagged scalar, same `RefScalar` as `!ref`. Not a mapping `$of`.

## Examples

### Secret

```yaml
!emit
password: !b64enc $Values.password
username: !b64enc $Values.user
```

### Optional token

```yaml
!bind
$Tok?: !b64enc $Values.token?
---
!emit
token?: !ref $Tok?
```

### ConfigMap of a certificate

```yaml
tls.crt: !b64enc $Values.certPem
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Tok: !expr "b64enc($Values.token)"
# no b64enc() in !expr
```

</td><td>

```yaml
!emit
token: !b64enc $Values.token
# encode with !b64enc
```

</td></tr>
<tr><td>

```yaml
!emit
config: !b64enc $Values.config
# encoding a mapping is an error
```

</td><td>

```yaml
!bind
$Json: !to-json-str $Values.config
---
!emit
config: !b64enc $Json
# encode a string; JSON bytes via !to-json-str first
```

</td></tr>
<tr><td>

```yaml
!bind
$Tok: !b64enc $Values.token?
# omit $of without ?: on the key is an error
```

</td><td>

```yaml
!bind
$Tok?: !b64enc $Values.token?
---
!emit
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
password: {{ required "password" .Values.password | b64enc }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !not-empty $Values.password?
$fail: "password"
---
!emit
password: !b64enc $Values.password
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
token: {{ .Values.token | b64enc }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Missing `.Values.token` is empty in Helm. Knarr `?:` omits the key.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
tls.crt: {{ required "cert" .Values.certPem | b64enc }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !not-empty $Values.certPem?
$fail: "cert"
---
!emit
tls.crt: !b64enc $Values.certPem
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>
