# `!is-empty`

**Empty** test → bool.

**True** for: omit (`?` on the field / `$Name?` with no value), `""`, `[]`, `{}`, `false`, `0`, `0.0` / `-0.0`.  
**False** for: non-empty string/seq/map, `true`, non-zero int or float.

Missing **without** `?` on that field is a path error, not empty.

Inverse: [`!is-not-empty`](is-not-empty.md). To drop an empty **field** (not a bool), use [`!skip-empty`](skip-empty.md) on a `?:` key.

`!empty` is not a tag (error, not a synonym).

## Syntax

```yaml
$when: !is-empty $Values.tls?
```

Tagged scalar `RefScalar`. Result is bool — not omit (so `$Name?: !is-empty` is an error).

## Examples

### Skip TLS Secret if no tls

```yaml
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
```

Usually you want the opposite: [`!is-not-empty`](is-not-empty.md) to emit when TLS exists.

### Validation: field must be empty

```yaml
!validation
$rules:
  - !is-empty $Values.deprecated?
$fail: "remove deprecated"
```

### Filter empty hostnames

```yaml
$filter: !is-empty $E.optionalNote?
```

### Do not put `!is-empty` on a field

`[]` stays in output. `!is-empty` is a bool. To drop an empty list, use [`!skip-empty`](skip-empty.md):

```yaml
initContainers?: !skip-empty $Values.init?
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit?
$when: !expr "empty($Values.tls)"
$then:
  kind: ConfigMap
# no empty() in !expr
```

</td><td>

```yaml
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
# emptiness is the !is-empty tag
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !nempty $Values.sidecars?
$then:
  kind: ConfigMap
# !nempty is not a tag
```

</td><td>

```yaml
!emit?
$when: !is-not-empty $Values.sidecars?
$then:
  kind: ConfigMap
  name: sidecars
# use !is-not-empty
```

</td></tr>
<tr><td>

```yaml
!emit
initContainers?: !is-empty $Values.init?
# !is-empty is bool, not omit of []
```

</td><td>

```yaml
!emit
initContainers?: !skip-empty $Values.init?
# skip missing and []
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !not !is-empty $Values.tls?
$then:
  kind: ConfigMap
# !not does not wrap !is-empty
```

</td><td>

```yaml
!emit?
$when: !is-not-empty $Values.tls?
$then:
  kind: ConfigMap
  name: tls
# use !is-not-empty or !expr
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !is-empty $Values.tls
$then:
  kind: ConfigMap
# missing tls without ? on the field is an error, not empty
```

</td><td>

```yaml
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
# ? turns a missing path into omit, which !is-empty treats as true
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !empty $Values.tls?
$then:
  kind: ConfigMap
# !empty is not a tag
```

</td><td>

```yaml
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
```

</td></tr>
</table>

## See also

- [`!is-not-empty`](is-not-empty.md)
- [`!skip-empty`](skip-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!is-empty` is true for omit, `""`, `[]`, `{}`, `false`, `0`, `0.0`. Missing without `?` on that field still errors.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if empty .Values.tls }}
kind: ConfigMap
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `$then` is the whole document. Helm `empty` ≡ `!is-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
deprecated: {{ .Values.deprecated }}
{{- if empty .Values.deprecated }}
{{- fail "remove deprecated" }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm prints `deprecated:` then may `fail`. Knarr `!validation` does not print the field.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.env }}
{{- if empty .optionalNote }}
  - name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $filter: !is-empty $E.optionalNote?
  $yield?:
    name: !ref $E.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if empty` ≡ `!is-empty`.

</td></tr>
</table>
