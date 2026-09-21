# `!ref`

Read a path. No operators. Sugar over the same paths as [`!expr`](expr.md).

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

### Nested optional path

```yaml
cert?: !ref $Values?.tls?.cert
host: !expr "$Values?.env?.database?.host ?? 'localhost'"
```

A missing step with `?.` is omit, not an error. `??` fills a default and keeps the key.

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

- [`!expr`](expr.md)
- [Omit](omit.md)

## Comparison with Helm

`!ref` is a path. Missing without `?.` is an error, not empty. Sprig `dig` is nested `?.`; a default argument is `??` in [`!expr`](expr.md).

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
name: {{ .Values.name }}
```

</td><td>

```yaml
---
!emit
metadata:
  name: !ref $Values.name
```

</td><td>

Missing `.Values.name` is empty in Helm; knarr `!ref` without `?.` is an error.

</td></tr>
<tr><td>

```gotemplate
host: {{ .Values.env.database.host }}
```

</td><td>

```yaml
---
!emit
spec:
  host: !ref $Values.env.database.host
```

</td><td>

A missing intermediate key is empty in Helm; knarr is an error unless each step is `?.`.

</td></tr>
<tr><td>

```gotemplate
cert: {{ dig "tls" "cert" "" .Values }}
```

</td><td>

```yaml
---
!emit
spec:
  cert?: !ref $Values?.tls?.cert
```

</td><td>

`dig` with default `""` still emits `cert:` as an empty string; knarr `?:` omits the key.

</td></tr>
<tr><td>

```gotemplate
host: {{ dig "env" "database" "host" "localhost" .Values }}
```

</td><td>

```yaml
---
!emit
spec:
  host: !expr "$Values?.env?.database?.host ?? 'localhost'"
```

</td><td>

—

</td></tr>
<tr><td>

```gotemplate
tag: {{ dig "image" "tag" "latest" .Values }}
```

</td><td>

```yaml
---
!emit
spec:
  tag: !expr "$Values?.image?.tag ?? 'latest'"
```

</td><td>

—

</td></tr>
<tr><td>

```gotemplate
secretName: {{ dig "server" "tls" "secretName" "" .Values.config }}
```

</td><td>

```yaml
---
!emit
spec:
  secretName?: !ref $Values.config?.server?.tls?.secretName
```

</td><td>

Empty-string `dig` default keeps the key; knarr `?:` omits it.

</td></tr>
<tr><td>

```gotemplate
name: {{ index .Values.workers 0 "name" }}
```

</td><td>

```yaml
---
!emit
metadata:
  name: !ref "$Workers[0].name"
```

</td><td>

Helm `index` of a missing key is empty; knarr `[0]` without `?.` is an error.

</td></tr>
<tr><td>

```gotemplate
app: {{ index .Values.labels "app.kubernetes.io/name" }}
```

</td><td>

```yaml
---
!emit
metadata:
  labels:
    app: !ref "$Values.labels['app.kubernetes.io/name']"
```

</td><td>

—

</td></tr>
<tr><td>

```gotemplate
{{- with .Values.livenessProbe }}
livenessProbe:
{{ toYaml . | nindent 2 }}
{{- end }}
```

</td><td>

```yaml
---
!emit
spec:
  livenessProbe?: !ref $Values?.livenessProbe
```

</td><td>

Helm `with` skips empty/nil; knarr `?:` omits missing/omit only.

</td></tr>
</table>
