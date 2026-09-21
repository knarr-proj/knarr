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

**Wrong**

```yaml
$Values:
  $type: !ref $ValuesType
```

**Right**

```yaml
$Values: !$ValuesType
  name: api
```

**Wrong — `!Type` without `$`**

**Right — `!$ValuesType`.**

**Wrong — two tags**

```yaml
$Values: !$ValuesType !read values.yaml
```

**Right —** type a bind whose fields you list, or `!import` a `!bind` document. Do not stack tags.

## See also

- [`!policy`](policy.md)
- [`!bind`](bind.md)

## Comparison with Helm

Defaults live in `!typedef`. Apply with `$Name: !$Type`.

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```yaml
# values.yaml
replicas: 1
```

</td><td>

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

</td><td>

Helm default is a value in `values.yaml`; knarr default is in `!typedef` and applied by `!$Type`.

</td></tr>
<tr><td>

```yaml
resources:
  requests:
    cpu: 100m
```

</td><td>

```yaml
---
!typedef
$ValuesType:
  resources:
    requests:
      cpu: string
      memory: string
```

</td><td>

`!typedef` declares types; it does not emit a resource.

</td></tr>
<tr><td>

```gotemplate
containers:
{{- range .Values.sidecars }}
  - name: {{ .name }}
    image: {{ .image }}
{{- end }}
```

</td><td>

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

</td><td>

Helm `range` is in the template; knarr `!$SidecarType` applies per item in bind.

</td></tr>
</table>
