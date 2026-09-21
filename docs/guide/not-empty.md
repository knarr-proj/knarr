# `!not-empty`

Boolean: not [`!empty`](empty.md) of the same path. Use this for “required” and `$when` “has sidecars”.

## Syntax

```yaml
$when: !not-empty $Values?.sidecars
```

## Examples

### Emit when sidecars exist

```yaml
---
!emit
$when: !not-empty $Values?.sidecars
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: sidecars
$else: ""
```

### Required values.name

```yaml
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
```

### Filter workers with a port list

```yaml
$filter: !not-empty $W?.ports
```

### replicas from a non-empty map

```yaml
$when: !not-empty $Values?.nodeSelector
$then:
  spec:
    nodeSelector: !ref $Values.nodeSelector
$else: ""
```

For a **field** omit, `nodeSelector?: !ref $Values?.nodeSelector` is simpler.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!emit
$when: !len $Values.workers
$then:
  kind: ConfigMap
$else: ""
# !len is an int, not a bool
```

</td><td>

```yaml
---
!emit
$when: !not-empty $Values?.workers
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: workers
$else: ""
# $when needs a bool — !not-empty
```

</td></tr>
<tr><td>

```yaml
---
!validation
$rules:
  - !empty $Values?.name
$fail: "set name"
# !empty as a rule means the value must be empty
```

</td><td>

```yaml
---
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

```yaml
---
!emit
$when: !not-empty $Values?.sidecars
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: sidecars
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `if .Values.sidecars` is truthiness; knarr `$when` needs a bool (`!not-empty`).

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
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
```

</td></tr>
<tr><th>Difference</th><td>

Helm `required` is a pipe; knarr `!validation` is a document.

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
---
!emit
spec:
  containers:
    - ports: !foreach
        $over: !ref $Values.workers
        $as: $W
        $filter: !not-empty $W?.ports
        $yield:
          name: !ref $W.name
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

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
---
!emit
spec:
  nodeSelector?: !ref $Values?.nodeSelector
```

</td></tr>
<tr><th>Difference</th><td>

Helm `with` skips empty/nil; knarr `?:` omits missing/omit only.

</td></tr>
</table>
