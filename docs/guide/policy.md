# `!policy`

Schema mode for **`!$Type`** only. It does **not** change missing `!ref` without `?.` (that is always an error).

## Syntax

```yaml
---
!policy strict
```

or

```yaml
---
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
---
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
---
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

**Wrong — using policy to allow `!ref $Values.image` when `image` is missing**

Missing paths without `?.` always fail. Soft only applies to **schema** fields on `!$Type`.

**Wrong — `!policy` not first**

**Right — first document** (after `!import` flatten).

**Wrong — policy without any `!$Type`**

Either drop `!policy` or type a bind.

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

```yaml
---
!policy strict
---
!typedef
$ValuesType:
  name: string
```

</td></tr>
<tr><th>Difference</th><td>

Helm schema is often a sidecar `values.schema.json`; knarr `!policy` + `!typedef` live in the program.

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
---
!emit
metadata:
  name: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Helm `required` is a function; knarr missing `!ref` without `?.` is always an error (no `!policy` needed).

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

```yaml
---
!policy soft
---
!bind
$Values: !$ValuesType
  name: api
  extra: true
```

</td></tr>
<tr><th>Difference</th><td>

Helm keeps extra keys unless a JSON schema forbids them; knarr `strict` rejects them, `soft` keeps them.

</td></tr>
</table>
