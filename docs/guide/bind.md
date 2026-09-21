# `!bind`

A **bind document** names values. It never appears in stdout. All `$Name` keys from every `!bind` (plus `!typedef` keys) share one graph: forward references are allowed; duplicate names and cycles are errors.

**Helm:** values.yaml plus `{{ $x := }}` — [vs Helm](bind-vs-helm.md).

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

- [vs Helm](bind-vs-helm.md)
- [`!ref`](ref.md)
- [`!typedef`](typedef.md)
- [General Conventions](../best-practices/general-conventions.md)
