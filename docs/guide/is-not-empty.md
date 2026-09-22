# `!is-not-empty`

Boolean: not [`!is-empty`](is-empty.md) of the same path. Use this for “required” and `$when` “has sidecars”.

`!not-empty` is not a tag (error, not a synonym).

## Syntax

```yaml
# $Values = {sidecars: [x]}
$when: !is-not-empty $Values.sidecars?
# true
```

## Examples

### Emit when sidecars exist

```yaml
# $Values = {sidecars: [x]}
!emit?
$when: !is-not-empty $Values.sidecars?
$yield:
  kind: ConfigMap
  name: sidecars
# kind: ConfigMap
```

### Required values.name

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
# stdout empty
```

### Filter workers with a port list

```yaml
# $W = {ports: [80]}
$filter: !is-not-empty $W.ports?
# true
```

### Drop a field when the list is empty

This tag and [`!is-empty`](is-empty.md) are **bool**, not omit. On a `?:` key use [`!skip-empty`](skip-empty.md):

```yaml
# $Values = {init: []}
initContainers?: !skip-empty $Values.init?
# no initContainers
```

Missing or `[]` / `""` / `false` / `0` → no key. Non-empty → the value. For a loop, [`!foreach`](foreach.md) on `имя?:` with `$yield?:` omits the key when there is nothing to print.

`!match` + `$if: !is-not-empty` on a `?:` key is the same stdout; [`!skip-empty`](skip-empty.md) is the short form.

### replicas from a non-empty map

```yaml
# $Values = {nodeSelector: {disk: ssd}}
!emit?
$when: !is-not-empty $Values.nodeSelector?
$yield:
  nodeSelector: !ref $Values.nodeSelector
# nodeSelector: {disk: ssd}
```

For a **field** omit of empty, `nodeSelector?: !skip-empty $Values.nodeSelector?`. For missing-only, `nodeSelector?: !ref $Values.nodeSelector?`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {workers: [a]}
!emit?
$when: !len $Values.workers
$yield:
  kind: ConfigMap
# error: !len is an int, not a bool
```

</td><td>

```yaml
# $Values = {workers: [a]}
!emit?
$when: !is-not-empty $Values.workers?
$yield:
  kind: ConfigMap
  name: workers
# kind: ConfigMap
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-empty $Values.name?
$fail: "set name"
# error: set name
```

</td><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
# stdout empty
```

</td></tr>
<tr><td>

```yaml
# $Values = {sidecars: [x]}
!emit?
$when: !not-empty $Values.sidecars?
$yield:
  kind: ConfigMap
# error: !not-empty is not a tag
```

</td><td>

```yaml
# $Values = {sidecars: [x]}
!emit?
$when: !is-not-empty $Values.sidecars?
$yield:
  kind: ConfigMap
  name: sidecars
# kind: ConfigMap
```

</td></tr>
</table>

## See also

- [`!is-empty`](is-empty.md)
- [`!skip-empty`](skip-empty.md)
- [`!validation`](validation.md)

## Comparison with Helm

`!is-not-empty` is the usual `if .Values.foo` / `required` test.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {sidecars: [x]}
{{- if .Values.sidecars }}
kind: ConfigMap
{{- end }}
# kind: ConfigMap
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {sidecars: [x]}
!emit?
$when: !is-not-empty $Values.sidecars?
$yield:
  kind: ConfigMap
# kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `$yield` is the whole document. Helm `if` ≡ `!is-not-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ required "set name" .Values.name }}
# name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
---
!emit
name: !ref $Values.name
# name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Failed `required` = `$fail` (no stdout). Success prints `name:`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [{name: w, ports: [80]}]}
ports:
{{- range .Values.workers }}
{{- if .ports }}
  - name: {{ .name }}
{{- end }}
{{- end }}
# ports: [{name: w}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {workers: [{name: w, ports: [80]}]}
!emit
ports?: !foreach
  $over: !ref $Values.workers?
  $as: $W
  $filter: !is-not-empty $W.ports?
  $yield?:
    name: !ref $W.name
# ports: [{name: w}]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {nodeSelector: {disk: ssd}}
{{- with .Values.nodeSelector }}
nodeSelector:
{{ toYaml . | nindent 2 }}
{{- end }}
# nodeSelector: {disk: ssd}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {nodeSelector: {disk: ssd}}
!emit
nodeSelector?: !ref $Values.nodeSelector?
# nodeSelector: {disk: ssd}
```

</td></tr>
<tr><th>Difference</th><td>

Same result for missing / empty `{}`. `nindent` is Helm text indent. Helm `with` also skips `false` / `""` / `0` / `[]` — that field is [`!skip-empty`](skip-empty.md).

</td></tr>
</table>
