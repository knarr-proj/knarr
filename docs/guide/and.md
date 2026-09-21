# `!and`

Boolean AND of a **sequence** of predicates. Evaluates **all** children (no short-circuit).

**Helm:** `and` — [vs Helm](and-vs-helm.md).

## Syntax

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

Children: `!ref` / `!not` / `!empty` / `!not-empty` / `!and` / `!or` / `!expr` (bool) / bool literal. ≥1 element. Omit child is an error.

Prefer `&&` in [`!expr`](expr.md) when both sides are already bool paths.

## Examples

### Service when enabled and HA

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

### Filter ready workers

```yaml
$filter: !and
  - !not-empty $W?.ports
  - !ref $W.enabled
```

### Validation bundle

```yaml
$rules:
  - !and
    - !not-empty $Values?.name
    - !not-empty $Values?.image
```

(Or two `$rules` items — first failure wins anyway.)

### Nested

```yaml
$when: !and
  - !or
    - !empty $Values?.tls
    - !not-empty $Values?.cert
  - !ref $Values.service.enabled
```

## Common mistakes

**Wrong — empty `!and []`**

**Wrong — omit child**

```yaml
- !ref $Values?.enabled
```

Use `?? false` in `!expr` or a required path.

**Wrong — `and()` in `!expr`**

Use `&&`.

## See also

- [vs Helm](and-vs-helm.md)
- [`!or`](or.md)
- [`!expr`](expr.md)
