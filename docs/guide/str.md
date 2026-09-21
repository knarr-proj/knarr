# `!str`

Coerce to **string**.

## Syntax

```yaml
replicas: !str $Values.replicas
```

- String: unchanged.
- Int → decimal (`-3` → `"-3"`).
- Bool → `"true"` / `"false"`.
- Float → Go `strconv.FormatFloat(..., 'g', -1, 64)`.
- seq/map → error (not `toYaml`).

## Examples

### Label from replica count

```yaml
metadata:
  labels:
    replicas: !str $Values.replicas
```

### Annotation from bool

```yaml
annotations:
  ha: !str $Values.ha
```

### Float CPU as text

```yaml
annotations:
  cpu: !str $Values.cpu
```

### Indexed Job name

```yaml
metadata:
  name: !str $I
```

Job names and labels must be strings. Loop indexes from [`!range`](range.md) are ints.

### Service port as annotation

```yaml
metadata:
  annotations:
    prometheus.io/port: !str $Values.port
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!emit
metadata:
  labels:
    replicas: !expr "string($Values.replicas)"
# no string() in !expr
```

</td><td>

```yaml
---
!emit
metadata:
  labels:
    replicas: !str $Values.replicas
# stringify with !str
```

</td></tr>
<tr><td>

```yaml
---
!bind
$S: !str $Values.config
# !str of a mapping is an error
```

</td><td>

```yaml
---
!emit
data:
  config.json: !to-json-str $Values.config
# JSON text is !to-json-str; or emit the mapping as YAML
```

</td></tr>
<tr><td>

```yaml
---
!bind
$Name: !format
  - "%s"
  - !ref $Values.replicas
# %s with an int is an error
```

</td><td>

```yaml
---
!bind
$Name: !format
  - "%d"
  - !ref $Values.replicas
# use %d, or !str first
```

</td></tr>
</table>

## See also

- [`!int`](int.md)
- [`!to-json-str`](to-json-str.md)

## Comparison with Helm

`!str` stringifies scalars. Seq/map is an error (not `toYaml`).

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ .Values.replicas | toString | quote }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
metadata:
  labels:
    replicas: !str $Values.replicas
```

</td></tr>
<tr><th>Difference</th><td>

Helm `quote` adds quotes in the rendered text; knarr `!str` is a typed string in YAML.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ha: {{ .Values.ha | toString }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
metadata:
  annotations:
    ha: !str $Values.ha
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range until .Values.completions }}
metadata:
  name: {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit-foreach
$over: !ref $Idx
$as: $I
$yield:
  metadata:
    name: !str $I
```

</td></tr>
<tr><th>Difference</th><td>

Helm prints the int; knarr needs `!str` for a name string.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
prometheus.io/port: {{ .Values.port | quote }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
metadata:
  annotations:
    prometheus.io/port: !str $Values.port
```

</td></tr>
<tr><th>Difference</th><td>

Helm `quote` adds quotes in the rendered text; knarr `!str` is a typed string.

</td></tr>
</table>
