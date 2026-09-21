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
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{- if .Values.sidecars }}
kind: ConfigMap
{{- end }}
```

</td><td>

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
<tr><td>

```gotemplate
{{ required "set name" .Values.name }}
```

</td><td>

```yaml
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
```

</td></tr>
<tr><td>

```gotemplate
{{- if .ports }}
```

</td><td>

```yaml
$filter: !not-empty $W?.ports
```

</td></tr>
<tr><td>

```gotemplate
{{- with .Values.nodeSelector }}
nodeSelector:
{{ toYaml . | nindent 2 }}
{{- end }}
```

</td><td>

```yaml
nodeSelector?: !ref $Values?.nodeSelector
```

</td></tr>
</table>
