# `!is-not-empty`

Boolean: not [`!is-empty`](is-empty.md) of the same path. Use this for “required” and `$when` “has sidecars”.

`!not-empty` is not a tag (error, not a synonym).

## Syntax

```yaml
$when: !is-not-empty $Values.sidecars?
```

## Examples

### Emit when sidecars exist

```yaml
!emit?
$when: !is-not-empty $Values.sidecars?
$then:
  kind: ConfigMap
  name: sidecars
```

### Required values.name

```yaml
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
```

### Filter workers with a port list

```yaml
$filter: !is-not-empty $W.ports?
```

### Drop a field when the list is empty

This tag and [`!is-empty`](is-empty.md) are **bool**, not omit. On a `?:` key use [`!skip-empty`](skip-empty.md):

```yaml
initContainers?: !skip-empty $Values.init?
```

Missing or `[]` / `""` / `false` / `0` → no key. Non-empty → the value. For a loop, [`!foreach`](foreach.md) on `имя?:` with `$yield?:` omits the key when there is nothing to print.

`!match` + `$if: !is-not-empty` on a `?:` key is the same stdout; [`!skip-empty`](skip-empty.md) is the short form.

### replicas from a non-empty map

```yaml
!emit?
$when: !is-not-empty $Values.nodeSelector?
$then:
  nodeSelector: !ref $Values.nodeSelector
```

For a **field** omit of empty, `nodeSelector?: !skip-empty $Values.nodeSelector?`. For missing-only, `nodeSelector?: !ref $Values.nodeSelector?`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit?
$when: !len $Values.workers
$then:
  kind: ConfigMap
# !len is an int, not a bool
```

</td><td>

```yaml
!emit?
$when: !is-not-empty $Values.workers?
$then:
  kind: ConfigMap
  name: workers
# $when needs a bool — !is-not-empty
```

</td></tr>
<tr><td>

```yaml
!validation
$rules:
  - !is-empty $Values.name?
$fail: "set name"
# !is-empty as a rule means the value must be empty
```

</td><td>

```yaml
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
# required values use !is-not-empty
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !not-empty $Values.sidecars?
$then:
  kind: ConfigMap
# !not-empty is not a tag
```

</td><td>

```yaml
!emit?
$when: !is-not-empty $Values.sidecars?
$then:
  kind: ConfigMap
  name: sidecars
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
{{- if .Values.sidecars }}
kind: ConfigMap
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !is-not-empty $Values.sidecars?
$then:
  kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `$then` is the whole document. Helm `if` ≡ `!is-not-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ required "set name" .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
---
!emit
name: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Failed `required` = `$fail` (no stdout). Success prints `name:`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ports:
{{- range .Values.workers }}
{{- if .ports }}
  - name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
ports?: !foreach
  $over: !ref $Values.workers?
  $as: $W
  $filter: !is-not-empty $W.ports?
  $yield?:
    name: !ref $W.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- with .Values.nodeSelector }}
nodeSelector:
{{ toYaml . | nindent 2 }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
nodeSelector?: !ref $Values.nodeSelector?
```

</td></tr>
<tr><th>Difference</th><td>

Same result for missing / empty `{}`. `nindent` is Helm text indent. Helm `with` also skips `false` / `""` / `0` / `[]` — that field is [`!skip-empty`](skip-empty.md).

</td></tr>
</table>
