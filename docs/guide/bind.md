# `!bind`

A **bind document** names values. It never appears in stdout. All `$Name` keys from every `!bind` (plus `!typedef` keys) share one graph: forward references are allowed; duplicate names and cycles are errors.

## Syntax

```yaml
---
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
---
!bind
$Values:
  name: api
  image: ghcr.io/acme/api:1.4.0
  replicas: 3
```

### Derived name for a Deployment

```yaml
---
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
metadata:
  name: !ref $FullName
```

### Load `values.yaml`

```yaml
---
!bind
$Values: !read values.yaml
```

### Optional TLS block

```yaml
---
!bind
$Tls?: !ref $Values?.tls
---
!emit
spec:
  tls?: !ref $Tls?
```

### Several binds

```yaml
---
!bind
$Values: !read values.yaml
---
!bind
$Port: !int $Values.port
```

Split computation across documents. Order of `!bind` documents does not restrict visibility.

## Common mistakes

**Wrong — untagged values document**

```yaml
name: api
replicas: 2
```

**Right**

```yaml
---
!bind
$Values:
  name: api
  replicas: 2
```

**Wrong — bind as a field**

```yaml
$Values: !bind
  name: api
```

**Right — tag the document**

```yaml
---
!bind
$Values:
  name: api
```

**Wrong — reserved names**

```yaml
---
!bind
$Release:
  name: prod
```

**Right — pick another binding** (`$Rel`, `$Instance`, …). `$Release` / `$Chart` / `$Capabilities` are reserved.

**Wrong — `$Tls` after optional bind**

```yaml
$Tls?: !ref $Values?.tls
host: !ref $Tls.host
```

**Right**

```yaml
host?: !ref $Tls?.host
```

## See also

- [`!ref`](ref.md)
- [`!typedef`](typedef.md)
- [General Conventions](../best-practices/general-conventions.md)

## Comparison with Helm

Values are named in `!bind`. There is no sidecar `values.yaml` plus `{{ $x := }}`.

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
# values.yaml
name: api
# _helpers.tpl
{{- $full := printf "%s-%s" .Values.env .Values.name -}}
```

</td><td>

```yaml
---
!bind
$Values:
  name: api
  env: prod
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
```

</td><td>

Helm splits `values.yaml` and `_helpers.tpl`; knarr names everything in one `!bind`. `printf` stays in the template; `!format` is bind-only.

</td></tr>
<tr><td>

```gotemplate
replicas: {{ .Values.replicas }}
```

</td><td>

```yaml
---
!bind
$Values:
  replicas: 3
---
!emit
spec:
  replicas: !ref $Values.replicas
```

</td><td>

Missing `.Values.replicas` is empty in Helm; knarr `!ref` without `?.` is an error.

</td></tr>
<tr><td>

```gotemplate
{{- $tls := .Values.tls -}}
spec:
  tls: {{ toYaml $tls | nindent 4 }}
```

</td><td>

```yaml
---
!bind
$Tls?: !ref $Values?.tls
---
!emit
spec:
  tls?: !ref $Tls?
```

</td><td>

Helm assigns even when `.Values.tls` is nil; knarr `$Tls?:` is omit and must be paired with `?:` / `?.`.

</td></tr>
<tr><td>

```gotemplate
metadata:
  name: {{ .Release.Name }}
```

</td><td>

```yaml
---
!bind
$Rel: prod
---
!emit
metadata:
  name: !ref $Rel
```

</td><td>

No `.Release` inject. `$Release` is reserved and unused in v1; pass the instance name as `$Rel`.

</td></tr>
</table>
