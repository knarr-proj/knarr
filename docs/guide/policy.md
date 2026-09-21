# `!policy`

Schema mode for **`!$Type`** only. It does **not** change missing `!ref` without `?.` (that is always an error).

**Helm:** `values.schema.json` / chart validation — [vs Helm](policy-vs-helm.md).

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

- [vs Helm](policy-vs-helm.md)
- [`!typedef`](typedef.md)
