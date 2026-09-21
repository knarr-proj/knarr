# `!ref`

Read a path. Optional steps (`?.`). Binary default (`??`) keeps the key. Arithmetic and `&&` / `||` / `!` are [`!expr`](expr.md).

## Syntax

Tagged scalar, `RefScalar`:

```text
!ref $Name
!ref $Name.field
!ref "$Name[0].field"
!ref "$Name.labels['app.kubernetes.io/name']"
!ref $Name?.optional
!ref $Name?.['dotted.key']
!ref $Name?.flag ?? false
!ref "$Name?.host ?? 'localhost'"
!ref "$Name?.ports ?? [80, 443]"
```

- Leading `$BindingName` (capital).
- `.ident` steps, `[n]` indexes, `['key']` for non-idents.
- Quote the YAML scalar when it contains `[`, `{`, or a quoted string default.
- One `??` for the **whole** scalar. N-way is [`!pick`](pick.md). The same `??` exists on [`!expr`](expr.md) for a formula.
- A path with `??` and no operator: write **`!ref`**, even though `!expr` would match.
- Dynamic `$Map[$Key]` is **`!expr` only**, not `!ref`.
- One tag per node. Not `!!ref`.

## Examples

### Deployment name

```yaml
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
# default — key stays
host: !ref "$Values?.env?.database?.host ?? 'localhost'"
# omit
host?: !ref $Values?.env?.database?.host
```

```yaml
# default — key stays
cert: !ref "$Values?.tls?.cert ?? ''"
# omit
cert?: !ref $Values?.tls?.cert
```

A missing step with `?.` is omit, not an error. `??` fills a default and keeps the key. Do not put `?:` on a key that uses `??`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
replicas: !ref $Values.replicas + 1
# !ref is a path; operators belong in !expr
```

</td><td>

```yaml
!emit
replicas: !expr "$Values.replicas + 1"
# arithmetic is !expr
```

</td></tr>
<tr><td>

```yaml
!emit
host: !expr "$Values?.tls?.host ?? 'localhost'"
# legal, but a field default is !ref
```

</td><td>

```yaml
!emit
host: !ref "$Values?.tls?.host ?? 'localhost'"
# no operator → !ref
```

</td></tr>
<tr><td>

```yaml
!emit
image: !ref $Values.images[$Worker.name]
# dynamic index is not a !ref path
```

</td><td>

```yaml
!emit
image: !expr "$Values.images[$Worker.name]"
# computed index is !expr
```

</td></tr>
<tr><td>

```yaml
!emit
name: !ref $Workers[0].name
# unquoted [ is two YAML tokens
```

</td><td>

```yaml
!emit
name: !ref "$Workers[0].name"
# quote the path when it contains [
```

</td></tr>
<tr><td>

```yaml
!emit
name: !path $Values.name
# !path was removed
```

</td><td>

```yaml
!emit
name: !ref $Values.name
# use !ref / !expr
```

</td></tr>
</table>

## See also

- [`!expr`](expr.md)
- [Omit](omit.md)

## Comparison with Helm

`!ref` is field access: path, `?.`, one `??` on the whole scalar. Missing without `?.` is an error, not empty. Sprig `dig` is nested `?.`; a non-empty default is `??`. The same path+`??` in `!expr` matches; write `!ref`.

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
name: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Missing `.Values.name` is empty in Helm; knarr `!ref` without `?.` is an error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ .Values.env.database.host }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
host: !ref $Values.env.database.host
```

</td></tr>
<tr><th>Difference</th><td>

A missing intermediate key is empty in Helm; knarr is an error unless each step is `?.`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
cert: {{ dig "tls" "cert" "" .Values }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
# default — key stays
cert: !ref "$Values?.tls?.cert ?? ''"
# omit
cert?: !ref $Values?.tls?.cert
```

</td></tr>
<tr><th>Difference</th><td>

`dig` with default `""` still emits `cert:` as an empty string. Knarr `?? ''` keeps the key; `?:` omits it.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ dig "env" "database" "host" "localhost" .Values }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
# default — key stays
host: !ref "$Values?.env?.database?.host ?? 'localhost'"
# omit
host?: !ref $Values?.env?.database?.host
```

</td></tr>
<tr><th>Difference</th><td>

`dig` with `"localhost"` matches knarr `??`. `?:` omits the key instead.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
tag: {{ dig "image" "tag" "latest" .Values }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
# default — key stays
tag: !ref "$Values?.image?.tag ?? 'latest'"
# omit
tag?: !ref $Values?.image?.tag
```

</td></tr>
<tr><th>Difference</th><td>

`dig` with `"latest"` matches knarr `??`. `?:` omits the key instead.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
secretName: {{ dig "server" "tls" "secretName" "" .Values.config }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
# default — key stays
secretName: !ref "$Values.config?.server?.tls?.secretName ?? ''"
# omit
secretName?: !ref $Values.config?.server?.tls?.secretName
```

</td></tr>
<tr><th>Difference</th><td>

Empty-string `dig` default keeps the key (`?? ''`). Knarr `?:` omits it.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ index .Values.workers 0 "name" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
name: !ref "$Workers[0].name"
```

</td></tr>
<tr><th>Difference</th><td>

Helm `index` of a missing key is empty; knarr `[0]` without `?.` is an error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
app: {{ index .Values.labels "app.kubernetes.io/name" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
app: !ref "$Values.labels['app.kubernetes.io/name']"
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- with .Values.livenessProbe }}
livenessProbe:
{{ toYaml . | nindent 2 }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
livenessProbe?: !ref $Values?.livenessProbe
```

</td></tr>
<tr><th>Difference</th><td>

Helm `with` skips empty/nil; knarr `?:` omits missing/omit only.

</td></tr>
</table>
