# `!len`

Length as **int**: sequence length, mapping key count, or string **UTF-8 byte** count (not runes).

**Helm:** `len` — [vs Helm](len-vs-helm.md).

## Syntax

```yaml
$N: !len $Values.workers
replicas: !len $Values.workers
$N?: !len $Values?.workers
```

Not a bool: `$when: !len` is an error. Use [`!not-empty`](not-empty.md).

## Examples

### replicas = number of workers

```yaml
spec:
  replicas: !len $Values.workers
```

### Last list element

```yaml
$N: !len $Values.workers
$I: !expr "$N - 1"
image: !expr "$Values.workers[$I].image"
```

Empty list → index error (no `[-1]`).

### Optional length

```yaml
$N?: !len $Values?.workers
---
!emit
spec:
  replicas?: !ref $N?
```

### Labels count in an annotation

```yaml
$N: !len $Values.labels
$Ann: !format
  - "%d-labels"
  - !ref $N
```

## Common mistakes

**Wrong — `len()` in `!expr`**

**Wrong — `$when: !len $Xs`**

**Right —** `!not-empty` or `$N: !len` then `!expr "$N > 0"`.

**Wrong — expecting rune count**

`"ж"` → `2` bytes.

**Wrong — `$N: !len $X?.y`**

Need `$N?:`.

## See also

- [vs Helm](len-vs-helm.md)
- [`!not-empty`](not-empty.md)
- [`!expr`](expr.md)
