# `!skip-empty`

If the path is **empty** (same set as [`!is-empty`](is-empty.md)), the value is **omit**. Otherwise the value is unchanged.

Not a bool. Not a predicate. [`!is-empty`](is-empty.md) asks; `!skip-empty` drops the key.

Allowed **only** as the whole value of a key that may omit: `имя?:` in a mapping, `$Name?:` in bind, `$yield?:`. Anywhere else is an error (`имя:`, `$when`, `$then`, `$over`, a sequence item, a [`!pick`](pick.md) child).

No `!skip-not-empty`. `!omit-empty` is not a tag.

## Syntax

```yaml
tls?: !skip-empty $Values.tls?
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
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
# $then is not an omit key
```

</td><td>

```yaml
!emit
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !match
    $if: !is-not-empty $Values.image?
    $then: !ref $Values.image
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

## See also

- [Omit](omit.md)
- [`!is-empty`](is-empty.md)
- [`!is-not-empty`](is-not-empty.md)

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
