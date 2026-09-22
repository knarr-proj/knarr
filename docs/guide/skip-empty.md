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
# $Values = {tls: false}
tls?: !skip-empty $Values.tls?
# no tls
```

`false` / `""` / `0` / `[]` / `{}` / omit → no `tls`. A non-empty map or string stays.

### Optional bind

```yaml
# $Values = {tls: false}
!bind
$Tls?: !skip-empty $Values.tls?
# no $Tls
```

Empty `tls` omits the bind. Elsewhere write `$Tls?`.

### Inside `!match` on a `?:` key

```yaml
# $Values = {name: api, image: img}
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
# name: img
```

Go `and x y`: if `x` is not empty, then `y` (omit `y` when empty). `$then` of `!emit?` cannot use this tag (body is a mapping).

### Skip a foreach item

```yaml
# $Worker = {sidecar: {}}
$yield?: !skip-empty $Worker.sidecar?
# no $yield
```

Empty `sidecar` skips the iteration (the key is `$yield?:`).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {tls: false}
!emit
tls: !skip-empty $Values.tls?
# error: key does not allow omit
```

</td><td>

```yaml
# $Values = {tls: false}
!emit
tls?: !skip-empty $Values.tls?
# no tls
```

</td></tr>
<tr><td>

```yaml
# $Values = {tls: {host: a}}
!emit?
$when: !skip-empty $Values.tls?
$then:
  kind: Secret
# error: $when is bool, not skip-empty
```

</td><td>

```yaml
# $Values = {tls: {host: a}}
!emit?
$when: !is-not-empty $Values.tls?
$then:
  kind: Secret
# kind: Secret
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!emit
name: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
# error: required key: omit $then is a pair error
```

</td><td>

```yaml
# $Values = {name: api}
!emit
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
# no name
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: ""}
!emit
name: !pick
  - !skip-empty $Values.a?
  - app
# error: !skip-empty is not a !pick child
```

</td><td>

```yaml
# $Values = {a: ""}
!emit
name: !match
  $if: !is-empty $Values.a?
  $then: app
  $else: !ref $Values.a
# name: app
```

</td></tr>
<tr><td>

```yaml
# $Values = {init: []}
!emit
initContainers?: !is-empty $Values.init?
# error: bool in the field
```

</td><td>

```yaml
# $Values = {init: []}
!emit
initContainers?: !skip-empty $Values.init?
# no initContainers
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
# $Values = {tls: {host: a}}
{{- if .Values.tls }}
tls:
{{ toYaml .Values.tls | nindent 2 }}
{{- end }}
# tls: {host: a}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {tls: {host: a}}
!emit
tls?: !skip-empty $Values.tls?
# tls: {host: a}
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` on the field ≡ `?:` + `!skip-empty`. `toYaml` / `nindent` are text. Do not pair this with `tls?: !ref` (that prints `false` / `""` / `[]`).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {init: [{name: c}]}
{{- if .Values.init }}
initContainers:
{{ toYaml .Values.init | nindent 2 }}
{{- end }}
# initContainers: [{name: c}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {init: [{name: c}]}
!emit
initContainers?: !skip-empty $Values.init?
# initContainers: [{name: c}]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Empty `[]` / missing → no key.

</td></tr>
</table>
