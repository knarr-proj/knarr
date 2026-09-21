# `!emit`

An **emit document** is exactly one Kubernetes manifest on stdout (unless `$when` is false and `$else` is `""`).

**Helm:** a file under `templates/` — [vs Helm](emit-vs-helm.md).

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

- [vs Helm](emit-vs-helm.md)
- [`$when`](when.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!match`](match.md) for field-level if
