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
- `??` is one default on the whole [`!ref`](ref.md) / [`!expr`](expr.md). Use `!pick` instead of `a ?? b ?? c`.

## Examples

### Resource name

```yaml
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
# default — key stays
containerPort: !pick
  - !ref $Values?.port
  - 8080
# omit
containerPort?: !ref $Values?.port
```

If `port` is `0`, you get `0` — not 8080. Zero is a value.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
name: !pick
  - ""
  - app
# "" is present, so the name is "" — not app
```

</td><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullnameOverride
  - app
# only omit falls through; "", 0, and false win. Skip "" with !match if needed
```

</td></tr>
<tr><td>

```yaml
!emit
name: !ref "$Values?.fullname ?? $Values?.name ?? 'app'"
# ?? is one default on the whole scalar
```

</td><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullname
  - !ref $Values?.name
  - app
# n-way omit default is !pick
```

</td></tr>
<tr><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullname
  - !ref $Values?.name
# the last child must exist (not omit)
```

</td><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullname
  - !ref $Values?.name
  - app
# last is a concrete fallback
```

</td></tr>
</table>

## See also

- [Omit](omit.md)
- [`!ref`](ref.md) / [`!expr`](expr.md) `??`

## Comparison with Helm

`!pick` skips **omit** only. `""` / `0` / `false` win and do not fall through (`coalesce` would skip them).

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ coalesce .Values.fullnameOverride .Values.name "app" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullnameOverride
  - !ref $Values?.name
  - app
```

</td></tr>
<tr><th>Difference</th><td>

`coalesce` skips `""` / `false` / `0`; `!pick` skips omit only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
image: {{ .Values.image.full | default .Values.image.repository | default "ghcr.io/acme/app:latest" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
image: !pick
  - !ref $Values?.image.full
  - !ref $Values?.image.repository
  - ghcr.io/acme/app:latest
```

</td></tr>
<tr><th>Difference</th><td>

Helm `| default` skips empty strings; knarr `!pick` keeps `""`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
containerPort: {{ .Values.port | default 8080 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
# default — key stays
containerPort: !pick
  - !ref $Values?.port
  - 8080
# omit
containerPort?: !ref $Values?.port
```

</td></tr>
<tr><th>Difference</th><td>

`0` is empty for Helm `default`; knarr keeps `0`.

</td></tr>
</table>
