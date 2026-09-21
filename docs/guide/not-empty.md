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

**Wrong — `!len` as `$when`**

**Wrong — `!empty` in `$rules` meaning “required”**

`$rules` are must-true: `!empty` means “must be empty”.

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
