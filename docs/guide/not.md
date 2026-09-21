# `!not`

Boolean negation of a **path**. Same `RefScalar` as [`!ref`](ref.md).

**Helm:** `not` / `if not` — [vs Helm](not-vs-helm.md).

## Syntax

```yaml
$when: !not $Values.service.enabled
$Hide: !not $ShowSvc
```

One tag, one scalar path. Does **not** wrap `!empty` / `!and` / `!or` (those have [`!not-empty`](not-empty.md) / De Morgan / `!expr`).

## Examples

### Invert a flag

```yaml
---
!emit
$when: !not $Values.service.enabled
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: no-svc
$else: ""
```

### Optional bool

```yaml
$when: !not $Values?.debug
```

Need a bool: missing without `??` is omit, not false. Prefer `!expr "!($Values?.debug ?? false)"` if the flag may be absent.

### Hide workers

```yaml
$filter: !not $Worker.disabled
```

## Common mistakes

**Wrong — two tags**

```yaml
$when: !not !ref $On
$when: !not !empty $X
```

**Right —** `!not $On` or `!not-empty` / `!expr`.

## See also

- [vs Helm](not-vs-helm.md)
- [`!not-empty`](not-empty.md)
- [`$when`](when.md)
