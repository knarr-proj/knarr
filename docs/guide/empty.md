# `!empty`

**Empty** test → bool.

**True** for: omit (`?.` / `$Name?` with no value), `""`, `[]`, `{}`, `false`, `0`.  
**False** for: non-empty string/seq/map, `true`, non-zero int.

Missing **without** `?.` is a path error, not empty.

Inverse: [`!not-empty`](not-empty.md).

## Syntax

```yaml
$when: !empty $Values?.tls
```

Tagged scalar `RefScalar`. Result is bool — not omit (so `$Name?: !empty` is an error).

## Examples

### Skip TLS Secret if no tls

```yaml
!emit
$when: !empty $Values?.tls
$then:
  kind: ConfigMap
  name: no-tls
$else: ""
```

Usually you want the opposite: [`!not-empty`](not-empty.md) to emit when TLS exists.

### Validation: field must be empty

```yaml
!validation
$rules:
  - !empty $Values?.deprecated
$fail: "remove deprecated"
```

### Filter empty hostnames

```yaml
$filter: !empty $E?.optionalNote
```

### Do not put `!empty` on a field

`[]` stays in output. `!empty` is a bool. To drop an empty list, use [`!not-empty`](not-empty.md) with [`!match`](match.md):

```yaml
initContainers?: !match
  $if: !not-empty $Values?.init
  $then: !ref $Values.init
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
$when: !expr "empty($Values.tls)"
$then:
  kind: ConfigMap
$else: ""
# no empty() in !expr
```

</td><td>

```yaml
!emit
$when: !empty $Values?.tls
$then:
  kind: ConfigMap
  name: no-tls
$else: ""
# emptiness is the !empty tag
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !nempty $Values?.sidecars
$then:
  kind: ConfigMap
$else: ""
# !nempty is not a tag
```

</td><td>

```yaml
!emit
$when: !not-empty $Values?.sidecars
$then:
  kind: ConfigMap
  name: sidecars
$else: ""
# use !not-empty
```

</td></tr>
<tr><td>

```yaml
!emit
initContainers?: !empty $Values?.init
# !empty is bool, not omit of []
```

</td><td>

```yaml
!emit
initContainers?: !match
  $if: !not-empty $Values?.init
  $then: !ref $Values.init
# skip missing and []
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !not !empty $Values?.tls
$then:
  kind: ConfigMap
$else: ""
# !not does not wrap !empty
```

</td><td>

```yaml
!emit
$when: !not-empty $Values?.tls
$then:
  kind: ConfigMap
  name: tls
$else: ""
# use !not-empty or !expr
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !empty $Values.tls
$then:
  kind: ConfigMap
$else: ""
# missing tls without ?. is an error, not empty
```

</td><td>

```yaml
!emit
$when: !empty $Values?.tls
$then:
  kind: ConfigMap
  name: no-tls
$else: ""
# ?. turns a missing path into omit, which !empty treats as true
```

</td></tr>
</table>

## See also

- [`!not-empty`](not-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!empty` is true for omit, `""`, `[]`, `{}`, `false`, `0`. Missing without `?.` still errors.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if empty .Values.tls }}
kind: ConfigMap
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm prints only `kind`. Extra `$then` keys change the document.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Empty range: Helm `env:` null; knarr `env: []`.

</td></tr>
</table>
