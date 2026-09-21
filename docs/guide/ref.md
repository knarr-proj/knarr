# `!ref`

Read a path. No operators. Sugar over the same paths as [`!expr`](expr.md).

**Helm:** `{{ .Values.name }}`, `index` — [vs Helm](ref-vs-helm.md).

## Syntax

Tagged scalar, `RefScalar`:

```text
!ref $Name
!ref $Name.field
!ref "$Name[0].field"
!ref "$Name.labels['app.kubernetes.io/name']"
!ref $Name?.optional
!ref $Name?.['dotted.key']
```

- Leading `$BindingName` (capital).
- `.ident` steps, `[n]` indexes, `['key']` for non-idents.
- Quote the YAML scalar when it contains `[`.
- Dynamic `$Map[$Key]` is **`!expr` only**, not `!ref`.
- One tag per node. Not `!!ref`.

## Examples

### Deployment name

```yaml
metadata:
  name: !ref $Values.name
```

### Nested database host

```yaml
host: !ref $Values.env.database.host
```

### First worker

```yaml
name: !ref "$Workers[0].name"
```

### Kubernetes label key

```yaml
app: !ref "$Values.labels['app.kubernetes.io/name']"
```

### Optional probe

```yaml
livenessProbe?: !ref $Values?.livenessProbe
```

## Common mistakes

**Wrong — operators in `!ref`**

```yaml
replicas: !ref $Values.replicas + 1
```

**Right —** [`!expr`](expr.md).

**Wrong — dynamic index**

```yaml
image: !ref $Values.images[$Worker.name]
```

**Right**

```yaml
image: !expr "$Values.images[$Worker.name]"
```

**Wrong — unquoted `[`**

```yaml
name: !ref $Workers[0].name
```

YAML parses this as two tokens. Quote it.

**Wrong — `!path`**

Removed. Use `!ref` / `!expr`.

## See also

- [vs Helm](ref-vs-helm.md)
- [`!expr`](expr.md)
- [Omit](omit.md)
