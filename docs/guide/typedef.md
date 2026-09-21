# `!typedef` and `!$Type`

Declare a **schema** once, apply it to a bind (or to each `!foreach` element via `$yield: !$T`). Defaults live in the schema.

## Syntax

```yaml
---
!typedef
$ValuesType:
  name: string
  replicas: { type: int, default: 1 }
  image: string
  ports:
    - containerPort: int
---
!bind
$Values: !$ValuesType
  name: api
  image: ghcr.io/acme/api:0.1.0
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
---
!typedef
$ValuesType:
  name: string
  resources:
    requests:
      cpu: string
      memory: string
```

Use strings for Kubernetes quantities (`"100m"`, `"128Mi"`).

### Typed loop element

```yaml
$Containers: !foreach
  $over: !ref $Values.sidecars
  $as: $S
  $yield: !$SidecarType
    name: !ref $S.name
    image: !ref $S.image
```

### Schema from a file

Inside `!typedef`, a type body may be `!read types.yaml` (plain YAML schema, not knarr tags).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!bind
$Values:
  $type: !ref $ValuesType
# $type is not how you apply a typedef
```

</td><td>

```yaml
---
!bind
$Values: !$ValuesType
  name: api
# apply with $Name: !$Type
```

</td></tr>
<tr><td>

```yaml
---
!bind
$Values: !ValuesType
  name: api
# the tag needs $: !$ValuesType
```

</td><td>

```yaml
---
!bind
$Values: !$ValuesType
  name: api
# !$Name is the apply tag
```

</td></tr>
<tr><td>

```yaml
---
!bind
$Values: !$ValuesType !read values.yaml
# two tags on one node is an error
```

</td><td>

```yaml
---
!bind
$Values: !$ValuesType
  name: api
# type a mapping you list, or !import a !bind document
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
# values.yaml
replicas: 1
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!typedef
$ValuesType:
  replicas: { type: int, default: 1 }
---
!bind
$Values: !$ValuesType
  name: api
```

</td></tr>
<tr><th>Difference</th><td>

Helm default is a value in `values.yaml`; knarr default is in `!typedef` and applied by `!$Type`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
resources:
  requests:
    cpu: 100m
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!typedef
$ValuesType:
  resources:
    requests:
      cpu: string
      memory: string
```

</td></tr>
<tr><th>Difference</th><td>

`!typedef` declares types; it does not emit a resource.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
containers:
{{- range .Values.sidecars }}
  - name: {{ .name }}
    image: {{ .image }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Containers: !foreach
  $over: !ref $Values.sidecars
  $as: $S
  $yield: !$SidecarType
    name: !ref $S.name
    image: !ref $S.image
```

</td></tr>
<tr><th>Difference</th><td>

Helm `range` is in the template; knarr `!$SidecarType` applies per item in bind.

</td></tr>
</table>
