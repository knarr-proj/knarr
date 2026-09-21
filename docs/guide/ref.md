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

`!ref` is a path. Missing without `?.` is an error, not empty.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
name: {{ .Values.name }}
```

</td><td>

```yaml
name: !ref $Values.name
```

</td></tr>
<tr><td>

```gotemplate
host: {{ .Values.env.database.host }}
```

</td><td>

```yaml
host: !ref $Values.env.database.host
```

</td></tr>
<tr><td>

```gotemplate
name: {{ index .Values.workers 0 "name" }}
```

</td><td>

```yaml
name: !ref "$Workers[0].name"
```

</td></tr>
<tr><td>

```gotemplate
{{ index .Values.labels "app.kubernetes.io/name" }}
```

</td><td>

```yaml
app: !ref "$Values.labels['app.kubernetes.io/name']"
```

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
livenessProbe?: !ref $Values?.livenessProbe
```

</td></tr>
</table>
