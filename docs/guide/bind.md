# `!bind`

A **bind document** names values. It never appears in stdout. All `$Name` keys from every `!bind` (plus `!typedef` keys) share one graph: forward references are allowed; duplicate names and cycles are errors.

## Syntax

```yaml
!bind
$Name: <value>
$Other?: <omit-capable value>
```

- Document tag must be `!bind`. A mapping of one or more keys.
- Keys: `$Name` (capital after `$`) or `$Name?:`.
- Values: literals, `!$Type`, `!ref`, `!expr`, `!read`, `!match`, `!foreach`, bind-only tags (`!format`, `!concat`, …).
- **Not a value:** `!import`, `!emit`, another `!bind`.
- `$Name: !bind` is an error (bind is a document, not a field).
- Empty `!bind` is an error.

Optional bind (`$Name?:`) requires an omit-capable value (`?.` / `$Other?`, `$over` of [`!foreach`](foreach.md) / [`!join`](join.md) without `?? []`, **or** [`!foreach`](foreach.md) with `$yield?:` — `?? []` on that `$over` is allowed, `$of` of [`!split`](split.md) / [`!sha256`](sha256.md) without `?? ''`, an omit child of [`!concat`](concat.md) / [`!format`](format.md), or **every** child of [`!merge`](merge.md) omit-capable, or at least one of `$from` / `$to` / `$until` on [`!range`](range.md)). [`!pick`](pick.md) is always a value: `$Name?: !pick` is an error. Elsewhere the name is written `$Name?`. See [Omit](omit.md).

## Examples

### Chart values

```yaml
!bind
$Values:
  name: api
  image: ghcr.io/acme/api:1.4.0
  replicas: 3
```

### Derived name for a Deployment

```yaml
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
name: !ref $FullName
```

### Load `values.yaml`

```yaml
!bind
$Values: !read values.yaml
```

### Optional TLS block

```yaml
!bind
$Tls?: !ref $Values.tls?
---
!emit
tls?: !ref $Tls?
```

### Several binds

```yaml
!bind
$Values: !read values.yaml
---
!bind
$Port: !int $Values.port
```

Split computation across documents. Order of `!bind` documents does not restrict visibility.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
name: api
replicas: 2
# untagged document is not a bind; names never enter the graph
```

</td><td>

```yaml
!bind
$Values:
  name: api
  replicas: 2
# !bind is the document tag; keys are $Name
```

</td></tr>
<tr><td>

```yaml
$Values: !bind
  name: api
# !bind is a document tag, not a field
```

</td><td>

```yaml
!bind
$Values:
  name: api
# tag the document; put keys in the mapping
```

</td></tr>
<tr><td>

```yaml
!bind
$Release:
  name: prod
# $Release is reserved and unused in v1
```

</td><td>

```yaml
!bind
$Rel: prod
# use $Rel / $Instance; $Release / $Chart / $Capabilities are reserved
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
  - !not-empty $Values.env?
  - !not-empty $Values.name?
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
  - !not-empty $Values.replicas?
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
