# `!emit`

An **emit document** is exactly one YAML document on stdout. **`!emit?`** may print **none**. The document may be a Kubernetes manifest or any other YAML mapping.

## Syntax

**Unconditional** — the mapping *is* the manifest. No `$when`:

```yaml
!emit
kind: ConfigMap
name: !ref $Values.name
```

**If, no else** — tag **`!emit?`**: only `$when` and `$then`. False `$when` → no document. Omit `$when` is still an error. `$else` on `!emit?` is a pair error.

```yaml
!emit?
$when: !ref $Values.service.enabled
$then:
  kind: Service
  name: !ref $Values.name
```

**If / else** — tag **`!emit`**: only `$when`, `$then`, `$else` (no other keys):

```yaml
!emit
$when: !ref $Values.useJob
$then:
  kind: Job
$else:
  kind: Deployment
```

- `$when` is a bool predicate (`!ref`, `!not`, `!expr`, `!empty`, `!not-empty`, `!and`, `!or`, or YAML `true` / `false`).
- `$then` is a mapping (the manifest).
- On `!emit`, `$else: ""` skips the document; `$else:` may be another mapping.
- `$Name: !emit` / `$Name: !emit?` is an error.

Several `!emit` documents print in **source order**.

## Examples

### Deployment

```yaml
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
```

### Optional Service

```yaml
!emit?
$when: !ref $Values.service.enabled
$then:
  kind: Service
  name: !ref $Values.name
```

### Else branch is a different kind

```yaml
!emit
$when: !ref $Values.useJob
$then:
  kind: Job
  name: !ref $Values.name
$else:
  kind: Deployment
  name: !ref $Values.name
```

### Optional field inside an emitted spec

```yaml
!emit
kind: Deployment
name: !ref $Values.name
affinity?: !ref $Values.affinity?
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
$when: !ref $On
kind: Service
# $when cannot mix with a raw manifest
```

</td><td>

```yaml
!emit?
$when: !ref $On
$then:
  kind: Service
  name: !ref $Values.name
# exclusive shapes: raw manifest, !emit? if, or !emit if/else
```

</td></tr>
<tr><td>

```yaml
!emit?
when: !ref $On
$then:
  kind: Service
# the key is $when, not when
```

</td><td>

```yaml
!emit?
$when: !ref $On
$then:
  kind: Service
  name: !ref $Values.name
# $when is the document gate
```

</td></tr>
<tr><td>

```yaml
!emit
name: !format
  - "%s-svc"
  - !ref $Values.name
# !format is bind-only
```

</td><td>

```yaml
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
---
!emit
name: !ref $Name
# format in bind, then !ref in the manifest
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !ref $On
$then:
  kind: Service
$else: null
# null ≡ no $else; $when false then errors
```

</td><td>

```yaml
!emit?
$when: !ref $On
$then:
  kind: Service
  name: !ref $Values.name
# !emit? skips when $when is false
```

</td></tr>
</table>

## See also

- [`$when`](when.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!match`](match.md) for field-level if

## Comparison with Helm

Each `!emit` is one output document (one file under `templates/`).

<table>
<tr><th>Helm</th><td>

```gotemplate
# templates/deploy.yaml
kind: Deployment
name: {{ required "name" .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !not-empty $Values.name?
$fail: "name"
---
!emit
kind: Deployment
name: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.service.enabled }}
kind: Service
name: {{ .Values.name }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !not-empty $Values.service?.enabled?
$then:
  kind: Service
  name: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!not-empty`. Missing `service` / `enabled` → omit → no document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.useJob }}
kind: Job
{{- else }}
kind: Deployment
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
$when: !ref $Values.useJob ?? false
$then:
  kind: Job
$else:
  kind: Deployment
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `useJob` is bool or missing.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
affinity:
{{ toYaml .Values.affinity | nindent 2 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
affinity?: !ref $Values.affinity?
```

</td></tr>
<tr><th>Difference</th><td>

Same presence: Helm `affinity: null` ≡ no `affinity`. `nindent` is Helm text indent.

</td></tr>
</table>
