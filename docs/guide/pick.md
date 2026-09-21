# `!pick`

N-way **omit** default: first child that is present wins. Not Helm `coalesce` (empty string does **not** fall through).

**Helm:** `coalesce`, chained `default` — [vs Helm](pick-vs-helm.md).

## Syntax

```yaml
name: !pick
  - !ref $Values?.name
  - !ref $Values?.fullnameOverride
  - app
```

- Tagged sequence, ≥2 elements.
- All but the last must be omit-capable (`?.` / `$Name?`).
- Last is a concrete value (not omit).
- First non-omit wins. Always a value: `$Name?: !pick` is an error.
- Non-omit children share one YAML sort.
- `??` in `!expr` stays **binary**. Use `!pick` instead of `a ?? b ?? c`.

## Examples

### Resource name

```yaml
metadata:
  name: !pick
    - !ref $Values?.fullnameOverride
    - !ref $Values?.name
    - knarr-app
```

### Image

```yaml
image: !pick
  - !ref $Values?.image.full
  - !ref $Values?.image.repository
  - ghcr.io/acme/app:latest
```

The last element must be a concrete fallback, not omit.

### Optional vs default port

```yaml
containerPort: !pick
  - !ref $Values?.port
  - 8080
```

If `port` is `0`, you get `0` — not 8080. Zero is a value.

## Common mistakes

**Wrong — treating `""` as missing**

Helm `coalesce` skips empty. knarr `!pick` does not.

**Wrong — n-ary `??`**

```yaml
!expr "$A ?? $B ?? 'x'"
```

**Right — `!pick`.**

**Wrong — all children optional**

The last must exist.

## See also

- [vs Helm](pick-vs-helm.md)
- [Omit](omit.md)
- [`!expr`](expr.md) `??`
