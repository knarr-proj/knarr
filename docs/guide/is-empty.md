# `!is-empty`

**Empty** test → bool.

**True** for: omit (`?` on the field / `$Name?` with no value), `""`, `[]`, `{}`, `false`, `0`, `0.0` / `-0.0`.  
**False** for: non-empty string/seq/map, `true`, non-zero int or float.

Missing **without** `?` on that field is a path error, not empty.

Inverse: [`!is-not-empty`](is-not-empty.md). To drop an empty **field** (not a bool), use [`!skip-empty`](skip-empty.md) on a `?:` key.

`!empty` is not a tag (error, not a synonym).

## Syntax

```yaml
# $Values = {tls: false}
$when: !is-empty $Values.tls?
# true
```

Tagged scalar `RefScalar`. Result is bool — not omit (so `$Name?: !is-empty` is an error).

## Examples

### Skip TLS Secret if no tls

```yaml
# $Values = {}
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
# kind: ConfigMap
```

Usually you want the opposite: [`!is-not-empty`](is-not-empty.md) to emit when TLS exists.

### Validation: field must be empty

```yaml
# $Values = {}
!validation
$rules:
  - !is-empty $Values.deprecated?
$fail: "remove deprecated"
# stdout empty
```

### Filter empty hostnames

```yaml
# $E = {optionalNote: ""}
$filter: !is-empty $E.optionalNote?
# true
```

### Do not put `!is-empty` on a field

`[]` stays in output. `!is-empty` is a bool. To drop an empty list, use [`!skip-empty`](skip-empty.md):

```yaml
# $Values = {init: []}
initContainers?: !skip-empty $Values.init?
# no initContainers
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {tls: false}
!emit?
$when: !expr "empty($Values.tls)"
$then:
  kind: ConfigMap
# error: no empty() in !expr
```

</td><td>

```yaml
# $Values = {tls: false}
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
# kind: ConfigMap
```

</td></tr>
<tr><td>

```yaml
# $Values = {sidecars: [x]}
!emit?
$when: !nempty $Values.sidecars?
$then:
  kind: ConfigMap
# error: !nempty is not a tag
```

</td><td>

```yaml
# $Values = {sidecars: [x]}
!emit?
$when: !is-not-empty $Values.sidecars?
$then:
  kind: ConfigMap
  name: sidecars
# kind: ConfigMap
```

</td></tr>
<tr><td>

```yaml
# $Values = {init: []}
!emit
initContainers?: !is-empty $Values.init?
# error: !is-empty is bool, not omit of []
```

</td><td>

```yaml
# $Values = {init: []}
!emit
initContainers?: !skip-empty $Values.init?
# no initContainers
```

</td></tr>
<tr><td>

```yaml
# $Values = {tls: {host: a}}
!emit?
$when: !not !is-empty $Values.tls?
$then:
  kind: ConfigMap
# error: !not does not wrap !is-empty
```

</td><td>

```yaml
# $Values = {tls: {host: a}}
!emit?
$when: !is-not-empty $Values.tls?
$then:
  kind: ConfigMap
  name: tls
# kind: ConfigMap
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit?
$when: !is-empty $Values.tls
$then:
  kind: ConfigMap
# error: missing tls without ?
```

</td><td>

```yaml
# $Values = {}
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
# kind: ConfigMap
```

</td></tr>
<tr><td>

```yaml
# $Values = {tls: false}
!emit?
$when: !empty $Values.tls?
$then:
  kind: ConfigMap
# error: !empty is not a tag
```

</td><td>

```yaml
# $Values = {tls: false}
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
  name: no-tls
# kind: ConfigMap
```

</td></tr>
</table>

## Omit

`!is-empty` of omit (`path?`) is **true**. Result is bool — `$Name?: !is-empty` is an error. Missing **without** `?` is a path error.

```yaml
# $Values = {}
$when: !is-empty $Values.tls?
# true
```

## See also

- [`!is-not-empty`](is-not-empty.md)
- [`!skip-empty`](skip-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!is-empty` is true for omit, `""`, `[]`, `{}`, `false`, `0`, `0.0`. Missing without `?` on that field still errors.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
{{- if empty .Values.tls }}
kind: ConfigMap
{{- end }}
# kind: ConfigMap
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit?
$when: !is-empty $Values.tls?
$then:
  kind: ConfigMap
# kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `$then` is the whole document. Helm `empty` ≡ `!is-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {deprecated: ""}
deprecated: {{ .Values.deprecated }}
{{- if empty .Values.deprecated }}
{{- fail "remove deprecated" }}
{{- end }}
# error: remove deprecated
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
# $Values = {env: [{name: N, optionalNote: ""}]}
env:
{{- range .Values.env }}
{{- if empty .optionalNote }}
  - name: {{ .name }}
{{- end }}
{{- end }}
# env: [{name: N}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {env: [{name: N, optionalNote: ""}]}
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $filter: !is-empty $E.optionalNote?
  $yield?:
    name: !ref $E.name
# env: [{name: N}]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if empty` ≡ `!is-empty`.

</td></tr>
</table>
