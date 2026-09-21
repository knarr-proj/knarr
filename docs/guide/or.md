# `!or`

Boolean OR of a sequence of predicates. All children are evaluated (no short-circuit).

**Helm:** `or` — [vs Helm](or-vs-helm.md).

## Syntax

```yaml
$when: !or
  - !empty $Values?.tls
  - !empty $Values?.cert
```

Same child rules as [`!and`](and.md).

## Examples

### Run if either flag

```yaml
$when: !or
  - !ref $Values.ingress.enabled
  - !ref $Values.mesh.enabled
```

### Skip TLS only if both missing

```yaml
$when: !and
  - !empty $Values?.tls
  - !empty $Values?.cert
```

(`!or` of empties is “at least one missing”.)

### Default-on in expr instead

```yaml
$when: !expr "$Values?.ingress.enabled ?? false || $Values?.mesh.enabled ?? false"
```

## Common mistakes

**Wrong — `or()` in `!expr`**

Use `||`.

**Wrong — `!not` wrapping `!or`**

Rewrite with `!and` + `!not-empty`, or `!expr`.

## See also

- [vs Helm](or-vs-helm.md)
- [`!and`](and.md)
- [`$when`](when.md)
