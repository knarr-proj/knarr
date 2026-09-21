# `!emit`

An **emit document** is exactly one YAML document on stdout (unless `$when` is false and `$else` is `""`). The document may be a Kubernetes manifest or any other YAML mapping.

## Syntax

**Unconditional** — the mapping *is* the manifest. No `$when`:

```yaml
---
!emit
apiVersion: v1
kind: ConfigMap
metadata:
  name: !ref $Values.name
```

**Conditional** — only `$when`, `$then`, `$else` (no other keys):

```yaml
---
!emit
$when: !expr "$Values.service.enabled"
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

- `$when` is a bool predicate (`!ref`, `!not`, `!expr`, `!empty`, `!not-empty`, `!and`, `!or`).
- `$then` is a mapping (the manifest).
- `$else: ""` skips the document. `$else:` may instead be another mapping.
- `$Name: !emit` is an error.

Several `!emit` documents print in **source order**.

## Examples

### Deployment

```yaml
---
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
---
!emit
$when: !ref $Values.service.enabled
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
  spec:
    selector:
      app: !ref $Values.name
$else: ""
```

### Else branch is a different kind

```yaml
---
!emit
$when: !expr "$Values.useJob"
$then:
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: !ref $Values.name
$else:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: !ref $Values.name
```

### Optional field inside an emitted spec

```yaml
---
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: !ref $Values.name
spec:
  template:
    spec:
      affinity?: !ref $Values?.affinity
```

## Common mistakes

**Wrong — `$when` without `$then` / `$else`**

```yaml
---
!emit
$when: !ref $On
apiVersion: v1
kind: Service
```

**Right — exclusive shapes:** either a raw manifest **or** `$when`+`$then`+`$else`.

**Wrong — `when:`**

```yaml
when: !ref $On
```

**Right**

```yaml
$when: !ref $On
```

**Wrong — `!format` in the manifest**

```yaml
metadata:
  name: !format
    - "%s-svc"
    - !ref $Values.name
```

**Right — bind, then `!ref`.** See [`!format`](format.md).

**Wrong — `$else: null`**

Use `$else: ""` to skip.

## See also

- [`$when`](when.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!match`](match.md) for field-level if

## Comparison with Helm

Each `!emit` is one output document (one file under `templates/`).

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
# templates/deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.name }}
```

</td><td>

```yaml
---
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: !ref $Values.name
```

</td><td>

—

</td></tr>
<tr><td>

```gotemplate
{{- if .Values.service.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.name }}
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !ref $Values.service.enabled
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

</td><td>

Helm `if` with no else just skips; knarr `$when` requires `$then` and `$else` (`$else: ""` to skip).

</td></tr>
<tr><td>

```gotemplate
{{- if .Values.useJob }}
kind: Job
{{- else }}
kind: Deployment
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !expr "$Values.useJob"
$then:
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: !ref $Values.name
$else:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: !ref $Values.name
```

</td><td>

Helm can swap one field; knarr `$then` / `$else` are whole documents. Field-level if is `!match`.

</td></tr>
<tr><td>

```gotemplate
affinity:
{{ toYaml .Values.affinity | nindent 2 }}
```

</td><td>

```yaml
---
!emit
spec:
  affinity?: !ref $Values?.affinity
```

</td><td>

Helm `toYaml` keeps the `affinity:` key (null/empty); knarr `?:` omits the key.

</td></tr>
</table>
