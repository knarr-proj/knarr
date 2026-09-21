# `$when`

Document-level condition. On **`!emit`**, `$when` requires `$then` and `$else`. On **`!emit-foreach`**, `$when` is an optional pack gate with **no** `$then` / `$else`.

**Helm:** `{{- if }}` around a whole resource — [vs Helm](when-vs-helm.md).

## Syntax (`!emit`)

```yaml
---
!emit
$when: <bool>
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

Predicate: `!ref`, `!not`, `!expr`, `!empty`, `!not-empty`, `!and`, `!or`. Not `!len` (that is int).

`$else: ""` → emit nothing. `$else:` may be another mapping.

No other keys next to `$when`. `when:` without `$` is an error.

## Syntax (`!emit-foreach`)

```yaml
---
!emit-foreach
$when: !expr "$Values.deployWorkers ?? false"
$over: !ref $Values.workers
$as: $Worker
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
    name: !ref $Worker.name
```

False → **zero** documents; `$over` is not evaluated. `$as` is not visible in `$when`.

## Examples

### Service if enabled

```yaml
$when: !ref $Values.service.enabled
```

### Sidecars present (Helm `empty`)

```yaml
$when: !not-empty $Values?.sidecars
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: sidecars
$else: ""
```

### Compound

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

## Common mistakes

**Wrong — `if` on a field using `$when`**

`$when` is not allowed on random keys. Use [`!match`](match.md) or [omit](omit.md).

**Wrong — `$when: !len $Xs`**

**Right —** `$when: !not-empty $Xs` or `!expr "$N > 0"` after `!len`.

**Wrong — omit `$when` without `??`**

```yaml
$when: !ref $Values?.enabled
```

If `enabled` is missing, omit is not a bool. Use `?? false`.

## See also

- [vs Helm](when-vs-helm.md)
- [`!emit`](emit.md)
- [`!match`](match.md)
- [`!and`](and.md)
