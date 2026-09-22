# `!typedef` and `!$Type`

Declare a **schema** once, apply it to a bind (or to each `!foreach` element via `$yield: !$T`). Defaults live in the schema.

## Syntax

```yaml
# $Values = {name: api, image: ghcr.io/acme/api:0.1.0}
!typedef
$ValuesType:
  name: string
  replicas: { type: int, default: 1 }
  image: string
  containerPort: int
---
!bind
$Values: !$ValuesType
  name: api
  image: ghcr.io/acme/api:0.1.0
# error: missing containerPort
```

- `!typedef` is a document (after optional `!policy`).
- Field types: `string` \| `int` \| `bool` \| `float`, nested mappings, list-of-T as a one-element list in the schema.
- `default` is a **YAML literal**, not `!ref`.
- Instance tag: **`!$` + BindingName** matching the typedef key. Not `!ValuesType`, not `$type:`.
- Only on **root** `$Name` or on **`$yield`**. Not on nested fields, not on `!emit`.
- `$Name?: !$T` is an error.

After evaluation the tag is gone; the bind holds the instance (with defaults filled).

`!ref $ValuesType` is the **schema object**, not an instance. Do not confuse the two.

## Examples

### Default replicas

Instance omits `replicas`; schema supplies `1`.

### Nested object

```yaml
# $Values = {}
!typedef
$ValuesType:
  name: string
  resources:
    requests:
      cpu: string
      memory: string
# stdout empty
```

Use strings for Kubernetes quantities (`"100m"`, `"128Mi"`).

### Typed loop element

```yaml
# $Values = {sidecars: [{name: s, image: c}]}
$Containers: !foreach
  $over: !ref $Values.sidecars
  $as: $S
  $yield: !$SidecarType
    name: !ref $S.name
    image: !ref $S.image
# $Containers = [{name: s, image: c}]
```

### Schema from a file

Inside `!typedef`, a type body may be `!read types.yaml` (plain YAML schema, not knarr tags).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $ValuesType = {name: string}
!bind
$Values:
  $type: !ref $ValuesType
# error: $type is not how you apply a typedef
```

</td><td>

```yaml
# $ValuesType = {name: string}
!bind
$Values: !$ValuesType
  name: api
# $Values = {name: api}
```

</td></tr>
<tr><td>

```yaml
# $ValuesType = {name: string}
!bind
$Values: !ValuesType
  name: api
# error: the tag needs $: !$ValuesType
```

</td><td>

```yaml
# $ValuesType = {name: string}
!bind
$Values: !$ValuesType
  name: api
# $Values = {name: api}
```

</td></tr>
<tr><td>

```yaml
# values.yaml = {name: api}
!bind
$Values: !$ValuesType !read values.yaml
# error: two tags on one node
```

</td><td>

```yaml
# $ValuesType = {name: string}
!bind
$Values: !$ValuesType
  name: api
# $Values = {name: api}
```

</td></tr>
</table>

## See also

- [`!policy`](policy.md)
- [`!bind`](bind.md)

## Comparison with Helm

Defaults live in `!typedef`. Apply with `$Name: !$Type`.

<table>
<tr><th>Helm</th><td>

```yaml
# $Values = {replicas: 1}
# values.yaml
replicas: 1
# replicas: 1
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm default is a key in `values.yaml`. Knarr `!typedef` default is not that file.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
# $Values = {resources: {requests: {cpu: 100m}}}
resources:
  requests:
    cpu: 100m
# resources: {requests: {cpu: 100m}}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

`!typedef` declares types. It does not emit `resources:`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {sidecars: [{name: s, image: c}]}
containers:
{{- range .Values.sidecars }}
  - name: {{ .name }}
    image: {{ .image }}
{{- end }}
# containers: [{name: s, image: c}]
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Empty `sidecars`: Helm `containers: null` ≡ no `containers`; knarr bind `!foreach` + `$over: []` is `[]`. Bind-only is not Helm stdout.

</td></tr>
</table>
