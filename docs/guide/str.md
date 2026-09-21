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

**Wrong — `string()` in `!expr`**

```yaml
replicas: !expr "string($Values.replicas)"
```

**Right**

```yaml
replicas: !str $Values.replicas
```

**Wrong — `!str` of a mapping**

Use [`!to-json-str`](to-json-str.md) if you need JSON text, or emit the mapping as YAML.

**Wrong — `%s` in `!format` with an int**

`!str` first, or use `%d`.

## See also

- [`!int`](int.md)
- [`!to-json-str`](to-json-str.md)

## Comparison with Helm

`!str` stringifies scalars. Seq/map is an error (not `toYaml`).

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
replicas: {{ .Values.replicas | toString | quote }}
```

</td><td>

```yaml
labels:
  replicas: !str $Values.replicas
```

</td></tr>
<tr><td>

```gotemplate
ha: {{ .Values.ha | toString }}
```

</td><td>

```yaml
annotations:
  ha: !str $Values.ha
```

</td></tr>
<tr><td>

```gotemplate
name: {{ . }}
```

</td><td>

```yaml
metadata:
  name: !str $I
```

</td></tr>
<tr><td>

```gotemplate
prometheus.io/port: {{ .Values.port | quote }}
```

</td><td>

```yaml
prometheus.io/port: !str $Values.port
```

</td></tr>
</table>
