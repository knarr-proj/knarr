# `!pick`

N-way **omit** default: first child that is present wins. An empty string does **not** fall through. Two candidates: [`!ref`](ref.md) `??`. Do not replace `!pick` with `||` or a stack of `??`.

## Syntax

```yaml
# $Values = {name: api}
name: !pick
  - !ref $Values.name?
  - !ref $Values.fullnameOverride?
  - app
# name: api
```

- Tagged sequence, ≥2 elements (two is legal; the shorter 2-way is still `??`). No warning. A planned golden checks 2-way `!pick` and `??` print the same stdout.
- All but the last must be omit-capable (`?.` / `$Name?`).
- Last is a concrete value (not omit).
- First non-omit wins. Always a value: `$Name?: !pick` / `$Res?: !pick` is an error (the last child is concrete, so `?:` cannot fire).
- Non-omit children share one YAML sort.
- `??` is one default on the whole [`!ref`](ref.md) / [`!expr`](expr.md). Use `!pick` instead of `a ?? b ?? c`.

## Examples

### Resource name

```yaml
# $Values = {name: api}
name: !pick
  - !ref $Values.fullnameOverride?
  - !ref $Values.name?
  - knarr-app
# name: api
```

### Image

```yaml
# $Values = {}
image: !pick
  - !ref $Values.image?.full
  - !ref $Values.image?.repository
  - ghcr.io/acme/app:latest
# image: ghcr.io/acme/app:latest
```

The last element must be a concrete fallback, not omit.

### Optional vs default port

```yaml
# $Values = {}
containerPort: !pick
  - !ref $Values.port?
  - 8080                    # 8080
containerPort?: !ref $Values.port?
# no containerPort
```

If `port` is `0`, you get `0` — not 8080. Zero is a value.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!emit
name: !pick
  - ""
  - app
# name: ""
```

</td><td>

```yaml
# $Values = {}
!emit
name: !pick
  - !ref $Values.fullnameOverride?
  - app
# name: app
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!bind
$Res?: !pick
  - !ref $Values.name?
  - app
# error: !pick always has a value; ?: cannot fire
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Res: !pick
  - !ref $Values.name?
  - app
# $Res = api
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!emit
name: !expr "$Values.fullnameOverride? || $Values.name? ?? 'app'"
# error: || is bool, not coalesce
```

</td><td>

```yaml
# $Values = {name: api}
!emit
name: !pick
  - !ref $Values.fullnameOverride?
  - !ref $Values.name?
  - app
# name: api
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!emit
name: !ref "$Values.fullname? ?? $Values.name? ?? 'app'"
# error: ?? is one default on the whole scalar
```

</td><td>

```yaml
# $Values = {name: api}
!emit
name: !pick
  - !ref $Values.fullname?
  - !ref $Values.name?
  - app
# name: api
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit
name: !pick
  - !ref $Values.fullname?
  - !ref $Values.name?
# error: last child must exist (not omit)
```

</td><td>

```yaml
# $Values = {}
!emit
name: !pick
  - !ref $Values.fullname?
  - !ref $Values.name?
  - app
# name: app
```

</td></tr>
</table>

## Omit

N-way omit default. Always a value: `$Name?: !pick` is an error. `??` is one default on [`!ref`](ref.md) / [`!expr`](expr.md); more than two candidates is `!pick`.

```yaml
# $Values = {name: api}
name: !pick
  - !ref $Values.fullnameOverride?
  - !ref $Values.name?
  - knarr-app
# api
```

```yaml
# $Values = {}
name: !pick
  - !ref $Values.fullnameOverride?
  - !ref $Values.name?
  - knarr-app
# knarr-app
```

`""` / `0` / `false` do not fall through.

## See also

- [`!ref`](ref.md) / [`!expr`](expr.md) `??`

## Comparison with Helm

`!pick` skips **omit** only. `""` / `0` / `false` win and do not fall through (`coalesce` would skip them).

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ coalesce .Values.fullnameOverride .Values.name "app" }}
# name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
!emit
name: !match
  $if: !is-not-empty $Values.fullnameOverride?
  $then: !ref $Values.fullnameOverride
  $else: !match
    $if: !is-not-empty $Values.name?
    $then: !ref $Values.name
    $else: app
# name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `coalesce` ≡ nested `!match` + `!is-not-empty`. `!pick` skips omit only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
image: {{ .Values.image.full | default .Values.image.repository | default "ghcr.io/acme/app:latest" }}
# image: ghcr.io/acme/app:latest
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit
image: !match
  $if: !is-empty $Values.image?.full?
  $then: !match
    $if: !is-empty $Values.image?.repository?
    $then: ghcr.io/acme/app:latest
    $else: !ref $Values.image.repository
  $else: !ref $Values.image.full
# image: ghcr.io/acme/app:latest
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Chained `| default` ≡ nested `!match` + `!is-empty`. `!pick` is omit only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
containerPort: {{ .Values.port | default 8080 }}
# containerPort: 8080
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit
containerPort: !match
  $if: !is-empty $Values.port?
  $then: 8080
  $else: !ref $Values.port
# containerPort: 8080
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `| default` treats `0` as empty; so does `!is-empty`. `??` / `!pick` keep `0`.

</td></tr>
</table>
