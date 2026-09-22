# Getting Started

This page is enough to emit YAML from values. The walkthrough uses a Deployment and a Service; the same tags work for any schema. Everything else lives in the [guide](README.md#language-guide).

## What knarr is

A knarr file is **YAML 1.2** with several documents (`---`). Each document has a **local tag**:

| Tag | Role |
|-----|------|
| `!bind` | Name values (`$Values`, `$AppName`, …). Not printed. |
| `!emit` | One YAML document on stdout (any schema). |
| `!emit?` | Same, or nothing if `$when` is false or `$yield?:` omits. |

Look up a value with **`!ref $Name`**. There is no `{{ }}`.

Render:

```text
knarr render app.knarr
```

No `-f` / `--set`. Put values in the file or load them with [`!read`](guide/read.md).

## 1. Bind values

```yaml
# $Values = {name: demo, image: ghcr.io/acme/demo:1.2.3, replicas: 2, port: 8080}
---
!bind
$Values:
  name: demo
  image: ghcr.io/acme/demo:1.2.3
  replicas: 2
  port: 8080
# no stdout
```

- Keys that you invent start with **`$` and a capital letter**: `$Values`, `$AppName`.
- `$when`, `$over`, `$yield` are **language** keys, also with `$`.
- `$Release`, `$Chart`, and `$Capabilities` are reserved. Do not declare them.

## 2. Emit a Deployment

```yaml
# $Values = {name: demo, image: ghcr.io/acme/demo:1.2.3, replicas: 2, port: 8080}
---
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: !ref $Values.name
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
          ports:
            - containerPort: !ref $Values.port
# kind: Deployment / name: demo / replicas: 2
```

`!ref` is a tagged **scalar**. Quotes follow YAML 1.2: `[` `{` `,` and `: ` need quotes **anywhere** in the scalar, not only at line start. `/` does not.

```yaml
# $Workers = [{name: w1}]
name: !ref "$Workers[0].name"  # name: w1
```

## 3. Emit a Service

A second `!emit` is a second document on stdout (order = source order).

```yaml
# $Values = {name: demo, port: 8080}
---
!emit
apiVersion: v1
kind: Service
metadata:
  name: !ref $Values.name
spec:
  selector:
    app: !ref $Values.name
  ports:
    - port: !ref $Values.port
      targetPort: !ref $Values.port
# kind: Service / name: demo / port: 8080
```

## 4. Optional field (no silent empty maps)

A missing path is an error unless you mark **both** the key and the path:

```yaml
# $Values = {}
# omit
affinity?: !ref $Values.affinity?  # no affinity
# default — key stays
host: !ref "$Values.tls?.host? ?? 'localhost'"  # host: localhost
```

- `affinity?:` — the **stdout key** may be absent.
- `$Values.affinity?` — missing `affinity` is omit, not an error.
- `host: !ref … ?? 'localhost'` — the key stays; missing host becomes `"localhost"`.

A required key with a missing path is always an error. See [`!ref`](guide/ref.md) (Omit).

## 5. A formula

Use [`!expr`](guide/expr.md) for operators. There are **no functions** in the string (`len()`, `printf()`, `size()` are errors). A field default is [`!ref`](guide/ref.md) `??`. A formula default is `??` on that `!expr`. A path with no operator in `!expr` is an error. A constant (`true`, `[80, 443]`) is YAML, not `!expr`.

```yaml
# $Values = {service: {enabled: true}, replicas: 2}
---
!bind
$ShowSvc: !expr "$Values.service.enabled && $Values.replicas > 1"
# $ShowSvc: true
```

Service on/off is a document [`$when`](guide/when.md), not an `if` inside YAML text:

```yaml
# $Values = {name: demo}
---
!emit?
$when: !ref $ShowSvc
$yield?:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
# kind: Service / name: demo
```

**`!emit?`** means **emit nothing** when `$when` is false or `$yield?:` omits. On `!emit`, `$else-yield: ""` does the same.

## 6. Names you will reuse

| Need | Construct |
|------|-----------|
| Path, `?` on a field, `??` | [`!ref`](guide/ref.md) |
| `&&` `>` `+` `||`; formula `??` | [`!expr`](guide/expr.md) |
| `printf` / `%s-%s` | [`!format`](guide/format.md) in `!bind`, then `!ref` |
| Loop **fields** (env, ports) | [`!foreach`](guide/foreach.md) |
| Loop **resources** (one Pod per worker) | [`!emit-foreach`](guide/emit-foreach.md) |
| Loop **ints** (one Job per index) | [`!emit-range`](guide/emit-range.md) |
| `b64enc` for Secrets | [`!b64enc`](guide/b64enc.md) |
| Schema + defaults | [`!typedef`](guide/typedef.md) |

## Wrong vs right

**Wrong — Go templates in YAML**

```yaml
# $Values = {name: demo}
name: {{ .Values.name }}
# error: no {{ }}
```

**Right**

```yaml
# $Values = {name: demo}
name: !ref $Values.name  # name: demo
```

**Wrong — untagged document**

```yaml
# $Values = {a: 1}
apiVersion: v1
kind: ConfigMap
# error: untagged document
```

**Right — every document has a knarr tag**

```yaml
# $Values = {name: demo}
---
!emit
apiVersion: v1
kind: ConfigMap
metadata:
  name: !ref $Values.name
# kind: ConfigMap / name: demo
```

**Wrong — `when:` without `$`**

```yaml
# $ShowSvc = true
!emit
when: !ref $ShowSvc
# error: key is $when, not when
```

**Right**

```yaml
# $ShowSvc = true
!emit?
$when: !ref $ShowSvc
$yield?: { ... }
# $yield mapping
```

Next: [Tips and Tricks](tips-and-tricks.md) and [General Conventions](best-practices/general-conventions.md).
