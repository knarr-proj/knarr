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
replicas: !str $Values.replicas
```

### Annotation from bool

```yaml
ha: !str $Values.ha
```

### Float CPU as text

```yaml
cpu: !str $Values.cpu
```

### Indexed Job name

```yaml
name: !str $I
```

Job names and labels must be strings. Loop indexes from [`!range`](range.md) are ints.

### Service port as annotation

```yaml
prometheus.io/port: !str $Values.port
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
replicas: !expr "string($Values.replicas)"
# no string() in !expr
```

</td><td>

```yaml
!emit
replicas: !str $Values.replicas
# stringify with !str
```

</td></tr>
<tr><td>

```yaml
!bind
$S: !str $Values.config
# !str of a mapping is an error
```

</td><td>

```yaml
!emit
config.json: !to-json-str $Values.config
# JSON text is !to-json-str; or emit the mapping as YAML
```

</td></tr>
<tr><td>

```yaml
!bind
$Name: !format
  - "%s"
  - !ref $Values.replicas
# %s with an int is an error
```

</td><td>

```yaml
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
replicas: {{ required "replicas" .Values.replicas | toString | quote }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
replicas: !str $Values.replicas
```

</td></tr>
<tr><th>Difference</th><td>

Same string value. Helm `quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ha: {{ required "ha" .Values.ha | toString }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
ha: !str $Values.ha
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range until .Values.completions }}
name: {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `name:` is an int. Knarr `!str` is a string.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
prometheus.io/port: {{ required "port" .Values.port | quote }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
prometheus.io/port: !str $Values.port
```

</td></tr>
<tr><th>Difference</th><td>

Same string value. Helm `quote` is text quotes.

</td></tr>
</table>
