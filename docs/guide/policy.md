# `!policy`

Schema mode for **`!$Type`** only. It does **not** change missing `!ref` without `?.` (that is always an error).

## Syntax

```yaml
# $Values = {}
!policy strict
# policy: strict
```

or

```yaml
# $Values = {}
!policy soft
# policy: soft
```

- Optional **first** document of the (flattened) input.
- Tagged scalar: `strict` or `soft`.
- At most one per render.
- If any `!$Type` exists and there is **no** `!policy`, mode is **strict**.
- `!policy` with **zero** typed binds is an error.

## What it does

| Mode | Missing required field (no default) | Extra keys on the instance |
|------|-------------------------------------|------------------------------|
| `strict` | Error | Error |
| `soft` | Field omitted | Allowed |

Wrong scalar types are **always** an error, even in `soft`.

## Examples

### Strict chart values

```yaml
# $Values = {name: api}
!policy strict
---
!typedef
$ValuesType:
  name: string
  replicas: { type: int, default: 1 }
---
!bind
$Values: !$ValuesType
  name: api
# $Values = {name: api, replicas: 1}
```

`replicas` becomes `1`. Omitting `name` is an error.

### Soft extras for unknown keys

```yaml
# $Values = {name: api, experimentalFlag: true}
!policy soft
---
!typedef
$ValuesType:
  name: string
---
!bind
$Values: !$ValuesType
  name: api
  experimentalFlag: true
# $Values = {name: api, experimentalFlag: true}
```

`experimentalFlag` is kept.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {}
!policy soft
---
!emit
image: !ref $Values.image
# error: missing image; soft does not change !ref
```

</td><td>

```yaml
# $Values = {}
!emit
image?: !ref $Values.image?
# no image
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!bind
$Values:
  name: api
---
!policy strict
# error: !policy must be the first document
```

</td><td>

```yaml
# $Values = {}
!policy strict
---
!typedef
$ValuesType:
  name: string
# error: !policy with zero typed binds
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!policy strict
---
!bind
$Values:
  name: api
# error: policy without !$Type
```

</td><td>

```yaml
# $Values = {name: api}
!policy strict
---
!typedef
$ValuesType:
  name: string
---
!bind
$Values: !$ValuesType
  name: api
# $Values = {name: api}
```

</td></tr>
</table>

## See also

- [`!typedef`](typedef.md)

## Comparison with Helm

`!policy` is schema mode for `!$Type` only. Missing `!ref` without `?.` always errors.

<table>
<tr><th>Helm</th><td>

```json
{ "required": ["name"] }
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm JSON schema is a sidecar file. Knarr `!policy` is not that file.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ required "name" .Values.name }}
# name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "name"
---
!emit
name: !ref $Values.name
# name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
# $Values = {name: api, extra: true}
# extra keys in values.yaml are kept
name: api
extra: true
# name: api / extra: true
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `values.yaml` is not knarr stdout. `strict` vs `soft` is knarr policy, not a Helm render pair.

</td></tr>
</table>
