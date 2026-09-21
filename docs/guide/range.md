# `!range`

Build a sequence of **ints**. Bind-only. Use it as `$over` via `!ref`.

**Helm:** `until`, `untilStep`, `seq` — [vs Helm](range-vs-helm.md).

## Syntax

```yaml
$Idx: !range
  $from: 0          # omit → 0
  $to: 3            # inclusive  XOR  $until
  $step: 1          # omit → 1
```

Helm-style exclusive end:

```yaml
$Idx: !range
  $until: 3         # 0, 1, 2
```

- XOR `$to` (inclusive) or `$until` (exclusive, like Helm `until`).
- Bounds and `$step` are **int**.
- `$step: 0` is an error. Impossible direction → `[]`.
- Not used as `$over` directly: bind first.

## Examples

### Inclusive `0..2`

```yaml
$Idx: !range
  $from: 0
  $to: 2
# [0, 1, 2]
```

### `until` like Helm `until 3`

```yaml
$Idx: !range
  $until: !ref $Values.replicas
```

### Indexed Jobs / ordinals

```yaml
---
!bind
$Idx: !range
  $from: 0
  $until: !ref $Values.completions
---
!emit-foreach
$over: !ref $Idx
$as: $I
$yield:
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: !str $I
  spec:
    template:
      spec:
        containers:
          - name: worker
            image: ghcr.io/acme/job:1
```

`!format` cannot sit in `$yield`. Prefixed names (`w-0`) belong in **values**, or a dedicated `$Name: !format` per static index.

### Downwards

```yaml
$Idx: !range
  $from: 5
  $to: 0
  $step: -1
```

## Common mistakes

**Wrong — `$to` and `$until` together**

Pick one.

**Wrong — `$over: !range` on `!foreach`**

**Right —** `$Idx: !range` in bind, `$over: !ref $Idx`.

**Wrong — float bounds**

`!int` first.

## See also

- [vs Helm](range-vs-helm.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!str`](str.md)
