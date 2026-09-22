# `!policy`

Schema mode for **`!$Type`** only. It does **not** change missing `!ref` without `?.` (that is always an error).

## Syntax

```yaml
!policy strict
```

or

```yaml
!policy soft
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
```

`replicas` becomes `1`. Omitting `name` is an error.

### Soft extras for unknown keys

```yaml
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
```

`experimentalFlag` is kept.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!policy soft
---
!emit
image: !ref $Values.image
# missing image still errors; soft does not change !ref
```

</td><td>

```yaml
!emit
image?: !ref $Values.image?
# missing path needs ?.; policy applies only to !$Type
```

</td></tr>
<tr><td>

```yaml
!bind
$Values:
  name: api
---
!policy strict
# !policy must be the first document
```

</td><td>

```yaml
!policy strict
---
!typedef
$ValuesType:
  name: string
# first document (after !import flatten)
```

</td></tr>
<tr><td>

```yaml
!policy strict
---
!bind
$Values:
  name: api
# policy without !$Type does nothing useful
```

</td><td>

```yaml
!policy strict
---
!typedef
$ValuesType:
  name: string
---
!bind
$Values: !$ValuesType
  name: api
# either drop !policy or type a bind
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

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
# extra keys in values.yaml are kept
name: api
extra: true
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `values.yaml` is not knarr stdout. `strict` vs `soft` is knarr policy, not a Helm render pair.

</td></tr>
</table>
