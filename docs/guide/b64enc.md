# `!b64enc`

Base64-encode a **string** (UTF-8 bytes, RFC 4648, no newlines). Result is a string. Allowed on any value node (unlike `!format`).

## Syntax

```yaml
# $Values = {password: secret, token: tok}
password: !b64enc $Values.password
$B64?: !b64enc $Values.token?
# password: c2VjcmV0 / $B64 = dG9r
```

Tagged scalar, same `RefScalar` as `!ref`. Not a mapping `$of`.

## Examples

### Secret

```yaml
# $Values = {password: secret, user: admin}
!emit
password: !b64enc $Values.password
username: !b64enc $Values.user
# password: c2VjcmV0 / username: YWRtaW4=
```

### Optional token

```yaml
# $Values = {}
!bind
$Tok?: !b64enc $Values.token?
---
!emit
token?: !ref $Tok?
# no token
```

### ConfigMap of a certificate

```yaml
# $Values = {certPem: CERT}
tls.crt: !b64enc $Values.certPem
# tls.crt: Q0VSVA==
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {token: tok}
!bind
$Tok: !expr "b64enc($Values.token)"
# error: no b64enc() in !expr
```

</td><td>

```yaml
# $Values = {token: tok}
!emit
token: !b64enc $Values.token
# token: dG9r
```

</td></tr>
<tr><td>

```yaml
# $Values = {config: {a: 1}}
!emit
config: !b64enc $Values.config
# error: encoding a mapping
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$Json: !to-json-str $Values.config
---
!emit
config: !b64enc $Json
# config: eyJhIjoxfQ==
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Tok: !b64enc $Values.token?
# error: omit $of without ?: on the key
```

</td><td>

```yaml
# $Values = {}
!bind
$Tok?: !b64enc $Values.token?
---
!emit
token?: !ref $Tok?
# no token
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
# $Values = {password: secret}
password: {{ required "password" .Values.password | b64enc }}
# password: c2VjcmV0
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {password: secret}
!validation
$rules:
  - !is-not-empty $Values.password?
$fail: "password"
---
!emit
password: !b64enc $Values.password
# password: c2VjcmV0
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {token: tok}
token: {{ .Values.token | b64enc }}
# token: dG9r
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
# $Values = {certPem: CERT}
tls.crt: {{ required "cert" .Values.certPem | b64enc }}
# tls.crt: Q0VSVA==
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {certPem: CERT}
!validation
$rules:
  - !is-not-empty $Values.certPem?
$fail: "cert"
---
!emit
tls.crt: !b64enc $Values.certPem
# tls.crt: Q0VSVA==
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>
