# `!ref`

Read a path. Optional steps (`?` on the field, including the last). Binary default (`??`) keeps the key. Arithmetic and `&&` / `||` / `!` are [`!expr`](expr.md). Both tags stay: do not put operators on `!ref`.

## Syntax

Tagged scalar, `RefScalar`:

```text
!ref $Name
!ref $Name.field
!ref "$Name[0].field"
!ref "$Name.labels['app.kubernetes.io/name']"
!ref $Name.optional?
!ref $Name['dotted.key']?
!ref $Name.flag? ?? false
!ref "$Name.host? ?? 'localhost'"
!ref "$Name.ports? ?? [80, 443]"
```

- Leading `$BindingName` (capital).
- `.ident` steps, `[n]` indexes, `['key']` for non-idents.
- Quotes follow **YAML 1.2**, not “start of line”. Quote when the scalar contains `[` `{` `]` `}` `,`, `: ` (colon+space), a nested quoted string, or `#` after a space. `/` and `?? false` need no quotes.
- One `??` for the **whole** scalar. N-way is [`!pick`](pick.md). The same `??` exists on [`!expr`](expr.md) for a formula.
- A path with `??` and no operator is **`!ref`**. The same text in `!expr` is an error (no computation); the CLI says to use `!ref`. An operator or `$Map[$Key]` in `!ref` is an error; the CLI says to use `!expr`.
- A constant (`true`, `[80, 443]`) is YAML, not `!expr`.
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
livenessProbe?: !ref $Values.livenessProbe?
```

### Nested optional path

```yaml
# default — key stays
host: !ref "$Values.env?.database?.host? ?? 'localhost'"
# omit
host?: !ref $Values.env?.database?.host?
```

```yaml
# default — key stays
cert: !ref "$Values.tls?.cert? ?? ''"
# omit
cert?: !ref $Values.tls?.cert?
```

A missing step with `?` on that field is omit, not an error. `??` fills a default and keeps the key. Do not put `?:` on a key that uses `??`.

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
host: !expr "$Values.tls?.host? ?? 'localhost'"
# no computation: use !ref
```

</td><td>

```yaml
!emit
host: !ref "$Values.tls?.host? ?? 'localhost'"
# path + default is !ref
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
$Ports: !ref $Values.ports? ?? [80, 443]
# [ ] , are YAML flow indicators anywhere, not only at line start
```

</td><td>

```yaml
!emit
name: !ref "$Workers[0].name"
$Ports: !ref "$Values.ports? ?? [80, 443]"
# quote the YAML 1.2 scalar
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

## Omit

Absence is written. YAML `a: null` ≡ no `a`. Stdout never prints `null`.

| Marker | Meaning |
|--------|---------|
| `key?:` | This stdout key may be absent |
| `?` on a path field | That field may be absent → omit value. No `?.` operator |
| `??` | One default on the whole scalar; the key stays |

Leaf omit needs **both** `?:` on the key and an omit-capable path.

```yaml
# $Values = {}
affinity?: !ref $Values.affinity?
# no affinity
```

```yaml
# $Values = {tls: {host: a}}
host: !ref "$Values.tls?.host ?? 'localhost'"   # a
host?: !ref $Values.tls?.host                   # a
```

```yaml
# $Values = {}
host: !ref "$Values.tls?.host ?? 'localhost'"   # localhost
host?: !ref $Values.tls?.host                   # no host
```

Do not put `?:` on a key that uses `??`. Optional mapping: every child is `?:` iff the parent is.

## See also

- [`!expr`](expr.md)
- [`!pick`](pick.md)

## Comparison with Helm

`!ref` is field access: path, `?.`, one `??` on the whole scalar. Missing without `?.` is an error, not empty. Sprig `dig` is nested `?.`; a non-empty default is `??`. The same path in `!expr` is an error — no computation.

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ required "name" .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "name"
---
!emit
name: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail` (no stdout). Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Values.name }}
```

(missing `.Values.name` → `name:` empty)

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Knarr never treats a missing required path as empty. Write `?.` and `?? ''` or omit the key with `?:`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ .Values.env.database.host }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm missing intermediate → empty. Knarr without `?.` is an error. Required nest: `required` + `!ref $Values.env.database.host`.

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
cert: !ref "$Values.tls?.cert? ?? ''"
```

</td></tr>
<tr><th>Difference</th><td>

Same result: missing path → `cert:` empty string. `?:` is omit, not this pair.

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
host: !ref "$Values.env?.database?.host? ?? 'localhost'"
```

</td></tr>
<tr><th>Difference</th><td>

Same result.

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
tag: !ref "$Values.image?.tag? ?? 'latest'"
```

</td></tr>
<tr><th>Difference</th><td>

Same result.

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
secretName: !ref "$Values.config?.server?.tls?.secretName ?? ''"
```

</td></tr>
<tr><th>Difference</th><td>

Same result.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ index .Values.workers 0 "name" }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm missing `index` → empty. Knarr `[0]` without `?.` is an error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
app: {{ required "label" (index .Values.labels "app.kubernetes.io/name") }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !is-not-empty "$Values.labels['app.kubernetes.io/name']?"
$fail: "label"
---
!emit
app: !ref "$Values.labels['app.kubernetes.io/name']"
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `with` skips nil **and** a present empty `{}`. Knarr `?:` omits missing/omit only.

</td></tr>
</table>
