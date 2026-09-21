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

Optional bind (`$Name?:`) requires an omit-capable value (`?.` / `$Other?`). Elsewhere the name is written `$Name?`. See [Omit](omit.md).

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
$Tls?: !ref $Values?.tls
!emit
tls?: !ref $Tls?
```

### Several binds

```yaml
!bind
$Values: !read values.yaml
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
$Tls?: !ref $Values?.tls
!emit
host: !ref $Tls.host
# optional bind is $Tls?, not $Tls
```

</td><td>

```yaml
!bind
$Tls?: !ref $Values?.tls
!emit
host?: !ref $Tls?.host
# pair $Tls? / ?. with ?: on the output key
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
# values.yaml
name: api
# _helpers.tpl
{{- $full := printf "%s-%s" .Values.env .Values.name -}}
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
```

</td></tr>
<tr><th>Difference</th><td>

Helm splits `values.yaml` and `_helpers.tpl`; knarr names everything in one `!bind`. `printf` stays in the template; `!format` is bind-only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ .Values.replicas }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Values:
  replicas: 3
!emit
replicas: !ref $Values.replicas
```

</td></tr>
<tr><th>Difference</th><td>

Missing `.Values.replicas` is empty in Helm; knarr `!ref` without `?.` is an error.

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
$Tls?: !ref $Values?.tls
!emit
tls?: !ref $Tls?
```

</td></tr>
<tr><th>Difference</th><td>

Helm assigns even when `.Values.tls` is nil; knarr `$Tls?:` is omit and must be paired with `?:` / `?.`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Release.Name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Rel: prod
!emit
name: !ref $Rel
```

</td></tr>
<tr><th>Difference</th><td>

No `.Release` inject. `$Release` is reserved and unused in v1; pass the instance name as `$Rel`.

</td></tr>
</table>
