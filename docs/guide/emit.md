# `!emit`

An **emit document** is exactly one YAML document on stdout. **`!emit?`** may print **none**. The document may be a Kubernetes manifest or any other YAML mapping.

## Syntax

**Unconditional** — the mapping *is* the manifest. No `$when`:

```yaml
# $Values = {name: api}
!emit
kind: ConfigMap
name: !ref $Values.name  # name: api
```

**If, no else** — tag **`!emit?`**: only `$when` and `$then`. False `$when` → no document. Omit `$when` is still an error. `$else` on `!emit?` is a pair error.

```yaml
# $Values = {service: {enabled: true}, name: api}
!emit?
$when: !ref $Values.service.enabled
$then:
  kind: Service
  name: !ref $Values.name  # name: api
```

**If / else** — tag **`!emit`**: only `$when`, `$then`, `$else` (no other keys):

```yaml
# $Values = {useJob: false}
!emit
$when: !ref $Values.useJob
$then:
  kind: Job
$else:
  kind: Deployment
# kind: Deployment
```

- `$when` is a bool predicate (`!ref`, `!not`, `!expr`, `!is-empty`, `!is-not-empty`, `!and`, `!or`, or YAML `true` / `false`).
- `$then` is a mapping (the manifest).
- On `!emit`, `$else: ""` skips the document; `$else:` may be another mapping.
- `$Name: !emit` / `$Name: !emit?` is an error.

Several `!emit` documents print in **source order**.

## Examples

### Deployment

```yaml
# $Values = {name: api, replicas: 2, image: ghcr.io/acme/api:1}
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: !ref $Values.name
  labels:
    app: !ref $Values.name
spec:
  replicas: !ref $Values.replicas
  selector:
    matchLabels:
      app: !ref $Values.name
  template:
    metadata:
      labels:
        app: !ref $Values.name
    spec:
      containers:
        - name: app
          image: !ref $Values.image
# kind: Deployment / name: api / replicas: 2
```

### Optional Service

```yaml
# $Values = {service: {enabled: true}, name: api}
!emit?
$when: !ref $Values.service.enabled
$then:
  kind: Service
  name: !ref $Values.name  # name: api
```

### Else branch is a different kind

```yaml
# $Values = {useJob: false, name: api}
!emit
$when: !ref $Values.useJob
$then:
  kind: Job
  name: !ref $Values.name
$else:
  kind: Deployment
  name: !ref $Values.name
# kind: Deployment / name: api
```

### Optional field inside an emitted spec

```yaml
# $Values = {name: api}
!emit
kind: Deployment
name: !ref $Values.name  # name: api
affinity?: !ref $Values.affinity?  # no affinity
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $On = true
!emit
$when: !ref $On
kind: Service
# error: $when cannot mix with a raw manifest
```

</td><td>

```yaml
# $On = true
!emit?
$when: !ref $On
$then:
  kind: Service
  name: !ref $Values.name  # name: api
```

</td></tr>
<tr><td>

```yaml
# $On = true
!emit?
when: !ref $On
$then:
  kind: Service
# error: key is $when, not when
```

</td><td>

```yaml
# $On = true
!emit?
$when: !ref $On
$then:
  kind: Service
  name: !ref $Values.name  # name: api
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!emit
name: !format
  - "%s-svc"
  - !ref $Values.name
# error: !format is bind-only
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
---
!emit
name: !ref $Name  # name: api-svc
```

</td></tr>
<tr><td>

```yaml
# $On = false
!emit
$when: !ref $On
$then:
  kind: Service
$else: null
# error: null ≡ no $else
```

</td><td>

```yaml
# $On = false
!emit?
$when: !ref $On
$then:
  kind: Service
  name: !ref $Values.name
# stdout empty
```

</td></tr>
</table>

## Omit

`!emit?` may print **no** document (`$when` false). Omit `$when` is still an error. `$else: ""` on `!emit` skips. `key?:` inside `$then` still needs a `?` path.

```yaml
# $Values = {service: {enabled: false}, name: api}
!emit?
$when: !is-not-empty $Values.service?.enabled?
$then:
  kind: Service
  name: !ref $Values.name
# stdout empty
```

## See also

- [`$when`](when.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!emit-range`](emit-range.md)
- [`!match`](match.md) for field-level if

## Comparison with Helm

Each `!emit` is one output document (one file under `templates/`).

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
kind: Deployment
name: {{ required "name" .Values.name }}
# kind: Deployment / name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "name"
---
!emit
kind: Deployment
name: !ref $Values.name  # name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}, name: api}
{{- if .Values.service.enabled }}
kind: Service
name: {{ .Values.name }}
{{- end }}
# kind: Service / name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}, name: api}
!emit?
$when: !is-not-empty $Values.service?.enabled?
$then:
  kind: Service
  name: !ref $Values.name  # name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. Missing `service` / `enabled` → omit → no document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {useJob: false}
{{- if .Values.useJob }}
kind: Job
{{- else }}
kind: Deployment
{{- end }}
# kind: Deployment
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {useJob: false}
!emit
$when: !ref $Values.useJob ?? false
$then:
  kind: Job
$else:
  kind: Deployment
# kind: Deployment
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `useJob` is bool or missing.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {affinity: {node: x}}
affinity:
{{ toYaml .Values.affinity | nindent 2 }}
# affinity: {node: x}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {affinity: {node: x}}
!emit
affinity?: !ref $Values.affinity?
# affinity: {node: x}
```

</td></tr>
<tr><th>Difference</th><td>

Same presence: Helm `affinity: null` ≡ no `affinity`. `nindent` is Helm text indent.

</td></tr>
</table>
