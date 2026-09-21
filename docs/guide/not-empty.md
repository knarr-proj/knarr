# `!not-empty`

Boolean: not [`!empty`](empty.md) of the same path. Use this for “required” and `$when` “has sidecars”.

## Syntax

```yaml
$when: !not-empty $Values?.sidecars
```

## Examples

### Emit when sidecars exist

```yaml
!emit
$when: !not-empty $Values?.sidecars
$then:
  kind: ConfigMap
  name: sidecars
$else: ""
```

### Required values.name

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
```

### Filter workers with a port list

```yaml
$filter: !not-empty $W?.ports
```

### Drop a field when the list is empty

`[]` in stdout is a value. This tag and [`!empty`](empty.md) are **bool**, not omit. Pair with [`!match`](match.md) on a `?:` key (no `$else`):

```yaml
initContainers?: !match
  $if: !not-empty $Values?.init
  $then: !ref $Values.init
```

Missing or `[]` → no key. Non-empty → the list. For a loop, [`!foreach`](foreach.md) on `имя?:` with `$yield?:` omits the key when there is nothing to print.

### replicas from a non-empty map

```yaml
$when: !not-empty $Values?.nodeSelector
$then:
  nodeSelector: !ref $Values.nodeSelector
$else: ""
```

For a **field** omit, `nodeSelector?: !ref $Values?.nodeSelector` is simpler.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
$when: !len $Values.workers
$then:
  kind: ConfigMap
$else: ""
# !len is an int, not a bool
```

</td><td>

```yaml
!emit
$when: !not-empty $Values?.workers
$then:
  kind: ConfigMap
  name: workers
$else: ""
# $when needs a bool — !not-empty
```

</td></tr>
<tr><td>

```yaml
!validation
$rules:
  - !empty $Values?.name
$fail: "set name"
# !empty as a rule means the value must be empty
```

</td><td>

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
# required values use !not-empty
```

</td></tr>
</table>

## See also

- [`!empty`](empty.md)
- [`!validation`](validation.md)

## Comparison with Helm

`!not-empty` is the usual `if .Values.foo` / `required` test.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.sidecars }}
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
name: {{ required "set name" .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `required` prints the value or fails. Knarr `!validation` does not print `name`.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Empty range: Helm `ports:` null; knarr `ports: []`.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `with` skips a present empty `{}`. Knarr `?:` does not.

</td></tr>
</table>
