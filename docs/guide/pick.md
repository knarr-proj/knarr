# `!pick`

N-way **omit** default: first child that is present wins. An empty string does **not** fall through.

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

Zero, `false`, and `""` are values and win.

**Wrong — n-ary `??`**

```yaml
!expr "$A ?? $B ?? 'x'"
```

**Right — `!pick`.**

**Wrong — all children optional**

The last must exist.

## See also

- [Omit](omit.md)
- [`!expr`](expr.md) `??`

## Comparison with Helm

`!pick` skips **omit** only. `""` / `0` / `false` win and do not fall through (`coalesce` would skip them).

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
name: {{ coalesce .Values.fullnameOverride .Values.name "app" }}
```

</td><td>

```yaml
---
!emit
metadata:
  name: !pick
    - !ref $Values?.fullnameOverride
    - !ref $Values?.name
    - app
```

</td><td>

`coalesce` skips `""` / `false` / `0`; `!pick` skips omit only.

</td></tr>
<tr><td>

```gotemplate
image: {{ .Values.image.full | default .Values.image.repository | default "ghcr.io/acme/app:latest" }}
```

</td><td>

```yaml
---
!emit
spec:
  image: !pick
    - !ref $Values?.image.full
    - !ref $Values?.image.repository
    - ghcr.io/acme/app:latest
```

</td><td>

Helm `| default` skips empty strings; knarr `!pick` keeps `""`.

</td></tr>
<tr><td>

```gotemplate
containerPort: {{ .Values.port | default 8080 }}
```

</td><td>

```yaml
---
!emit
spec:
  ports:
    - containerPort: !pick
        - !ref $Values?.port
        - 8080
```

</td><td>

`0` is empty for Helm `default`; knarr keeps `0`.

</td></tr>
</table>
