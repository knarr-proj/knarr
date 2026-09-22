# `!skip-empty`

If the path is **empty** (same set as [`!is-empty`](is-empty.md)), the value is **omit**. Otherwise the value is unchanged.

Allowed as the whole value of:

- `имя?:` / `$Name?:` / `$yield?:`
- `$then` or `$else` of [`!match`](match.md) when that `!match` is already in one of those slots (or nested `$then` / `$else` of such a match)

Not a bool. Not a predicate. [`!is-empty`](is-empty.md) asks; `!skip-empty` omits the value.

Error anywhere else: `имя:`, `$when`, `$then` of `!emit` / `!emit?`, `$over`, a sequence item, a [`!pick`](pick.md) child.

No `!skip-not-empty`. `!omit-empty` is not a tag.

## Syntax

```yaml
# $Values = {tls: false}
tls?: !skip-empty $Values.tls?
# no tls
```

Tagged scalar `RefScalar`. Missing **without** `?` on that field is a path error.

## Examples

### Helm `if` on a field

```yaml
tls?: !skip-empty $Values.tls?
```

`false` / `""` / `0` / `[]` / `{}` / omit → no `tls`. A non-empty map or string stays.

### Optional bind

```yaml
!bind
$Tls?: !skip-empty $Values.tls?
```

Empty `tls` omits the bind. Elsewhere write `$Tls?`.

### Inside `!match` on a `?:` key

```yaml
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
```

Go `and x y`: if `x` is not empty, then `y` (omit `y` when empty). `$then` of `!emit?` cannot use this tag (body is a mapping).

### Skip a foreach item

```yaml
$yield?: !skip-empty $Worker.sidecar?
```

Empty `sidecar` skips the iteration (the key is `$yield?:`).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
tls: !skip-empty $Values.tls?
# key does not allow omit
```

</td><td>

```yaml
!emit
tls?: !skip-empty $Values.tls?
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !skip-empty $Values.tls?
$then:
  kind: Secret
# $when is bool, not skip-empty
```

</td><td>

```yaml
!emit?
$when: !is-not-empty $Values.tls?
$then:
  kind: Secret
```

</td></tr>
<tr><td>

```yaml
!emit
name: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
# required key: omit $then is a pair error
```

</td><td>

```yaml
!emit
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
```

</td></tr>
<tr><td>

```yaml
!emit
name: !pick
  - !skip-empty $Values.a?
  - app
# !pick is omit only, not empty
```

</td><td>

```yaml
!emit
name: !match
  $if: !is-empty $Values.a?
  $then: app
  $else: !ref $Values.a
```

</td></tr>
<tr><td>

```yaml
!emit
initContainers?: !is-empty $Values.init?
# bool in the field
```

</td><td>

```yaml
!emit
initContainers?: !skip-empty $Values.init?
```

</td></tr>
</table>

## Omit

Allowed only where omit is already legal: `имя?:` / `$Name?:` / `$yield?:`, or `$then`/`$else` of `!match` there.

```yaml
# $Values = {tls: false}
tls?: !skip-empty $Values.tls?
# no tls
```

```yaml
# $Values = {tls: {host: a}}
tls?: !skip-empty $Values.tls?
# tls: {host: a}
```

## See also

- [`!is-empty`](is-empty.md)
- [`!is-not-empty`](is-not-empty.md)
- [`!match`](match.md)

## Comparison with Helm

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.tls }}
tls:
{{ toYaml .Values.tls | nindent 2 }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
tls?: !skip-empty $Values.tls?
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` on the field ≡ `?:` + `!skip-empty`. `toYaml` / `nindent` are text. Do not pair this with `tls?: !ref` (that prints `false` / `""` / `[]`).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.init }}
initContainers:
{{ toYaml .Values.init | nindent 2 }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
initContainers?: !skip-empty $Values.init?
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Empty `[]` / missing → no key.

</td></tr>
</table>
