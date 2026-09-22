# `!bind`

A **bind document** names values. It never appears in stdout. All `$Name` keys from every `!bind` (plus `!typedef` keys) share one graph: forward references are allowed; duplicate names and cycles are errors.

## Syntax

```yaml
# $Values = {a: 1}
!bind
$Name: <value>
$Other?: <omit-capable value>
# no stdout
```

- Document tag must be `!bind`. A mapping of one or more keys.
- Keys: `$Name` (capital after `$`) or `$Name?:`.
- Values: literals, `!$Type`, `!ref`, `!expr`, `!read`, `!match`, `!foreach`, bind-only tags (`!format`, `!concat`, …).
- **Not a value:** `!import`, `!emit`, another `!bind`.
- `$Name: !bind` is an error (bind is a document, not a field).
- Empty `!bind` is an error.

Optional bind (`$Name?:`) requires an omit-capable value (`?.` / `$Other?`, `$over` of [`!foreach`](foreach.md) / [`!join`](join.md) without `?? []`, **or** [`!foreach`](foreach.md) with `$yield?:` — `?? []` on that `$over` is allowed, `$of` of [`!split`](split.md) / [`!sha256`](sha256.md) without `?? ''`, an omit child of [`!concat`](concat.md) / [`!format`](format.md), or **every** child of [`!merge`](merge.md) omit-capable, or at least one of `$from` / `$to` / `$until` on [`!range`](range.md) **or** `$yield?:`). [`!pick`](pick.md) is always a value: `$Name?: !pick` is an error. Elsewhere the name is written `$Name?`.

## Examples

### Chart values

```yaml
# $Values = {name: api, image: ghcr.io/acme/api:1.4.0, replicas: 3}
!bind
$Values:
  name: api
  image: ghcr.io/acme/api:1.4.0
  replicas: 3
# no stdout
```

### Derived name for a Deployment

```yaml
# $Values = {env: prod, name: api}
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
name: !ref $FullName
# name: prod-api
```

### Load `values.yaml`

```yaml
# $Values = {a: 1}
!bind
$Values: !read values.yaml
# no stdout
```

### Optional TLS block

```yaml
# $Values = {}
!bind
$Tls?: !ref $Values.tls?
---
!emit
tls?: !ref $Tls?
# no tls
```

### Several binds

```yaml
# $Values = {port: "8080"}
!bind
$Values: !read values.yaml
---
!bind
$Port: !int $Values.port
# no stdout
```

Split computation across documents. Order of `!bind` documents does not restrict visibility.

## Omit

`$Name?:` is an optional bind. Elsewhere write **`$Name?`**. `$Name` without `?` is an error.

| Marker | Meaning |
|--------|---------|
| `$Name?:` | This bind may be absent |
| `?` on a path field | That field may be absent → omit value |
| `??` | Default; the bind stays |

```yaml
# $Values = {}
!bind
$Tls?: !ref $Values.tls?
---
!emit
tls?: !ref $Tls?
# no tls
```

```yaml
# $Values = {tls: {cert: x}}
!bind
$Tls?: !ref $Values.tls?
---
!emit
tls?: !ref $Tls?
cert?: !ref $Tls?.cert
# tls: {cert: x}  /  cert: x
```

`$Name?: !pick` is an error (always a value). `имя?: … ?? …` on a leaf is a pair error.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {a: 1}
name: api
replicas: 2
# error: untagged document is not a bind
```

</td><td>

```yaml
# $Values = {name: api, replicas: 2}
!bind
$Values:
  name: api
  replicas: 2
# no stdout
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
$Values: !bind
  name: api
# error: !bind is a document tag, not a field
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Values:
  name: api
# no stdout
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!bind
$Release:
  name: prod
# error: $Release is reserved
```

</td><td>

```yaml
# $Values = {a: 1}
!bind
$Rel: prod
# no stdout
```

</td></tr>
<tr><td>

```yaml
!bind
$Tls?: !ref $Values.tls?
---
!emit
host: !ref $Tls.host
# optional bind is $Tls?, not $Tls
```

</td><td>

```yaml
!bind
$Tls?: !ref $Values.tls?
---
!emit
host?: !ref $Tls?.host
# pair $Tls? with ?: on the output key
```

</td></tr>
</table>

## See also

- [`!ref`](ref.md)
- [`!typedef`](typedef.md)
- [General Conventions](../best-practices/general-conventions.md)

## Comparison with Helm

Values are named in `!bind`. There is no sidecar `values.yaml` plus `{{ $x := }}`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# values: env=prod name=api
name: {{ printf "%s-%s" (required "env" .Values.env) (required "name" .Values.name) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Values:
  name: api
  env: prod
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!validation
$rules:
  - !is-not-empty $Values.env?
  - !is-not-empty $Values.name?
$fail: "env"
---
!emit
name: !ref $FullName
```

</td></tr>
<tr><th>Difference</th><td>

Same result `prod-api`. `required` abort = `$fail`. Fail text differs. Two `required` → two `$rules`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ required "replicas" .Values.replicas }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Values:
  replicas: 3
---
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
replicas: !ref $Values.replicas
```

</td></tr>
<tr><th>Difference</th><td>

Same result when the key is present. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- $tls := .Values.tls -}}
tls: {{ toYaml $tls | nindent 4 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Tls?: !ref $Values.tls?
---
!emit
tls?: !ref $Tls?
```

</td></tr>
<tr><th>Difference</th><td>

Same presence: Helm `tls: null` ≡ no `tls`. `nindent` is Helm text indent.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Release.Name }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

No `.Release` inject. `$Release` is reserved. Do not pair this with a user `$Rel`.

</td></tr>
</table>
