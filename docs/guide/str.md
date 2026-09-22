# `!str`

Coerce to **string**.

## Syntax

```yaml
# $Values = {replicas: 3}
replicas: !str $Values.replicas
# "3"
```

- String: unchanged.
- Int → decimal (`-3` → `"-3"`).
- Bool → `"true"` / `"false"`.
- Float → Go `strconv.FormatFloat(..., 'g', -1, 64)`.
- seq/map → error (not `toYaml`).

## Examples

### Label from replica count

```yaml
# $Values = {replicas: 3}
replicas: !str $Values.replicas
# "3"
```

### Annotation from bool

```yaml
# $Values = {ha: true}
ha: !str $Values.ha
# ha: "true"
```

### Float CPU as text

```yaml
# $Values = {cpu: 0.5}
cpu: !str $Values.cpu
# cpu: "0.5"
```

### Indexed Job name

```yaml
# $I = 0
name: !str $I
# name: "0"
```

Job names and labels must be strings. Loop indexes from [`!range`](range.md) are ints.

### Service port as annotation

```yaml
# $Values = {port: 8080}
prometheus.io/port: !str $Values.port
# prometheus.io/port: "8080"
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {replicas: 3}
!emit
replicas: !expr "string($Values.replicas)"
# error: no string() in !expr
```

</td><td>

```yaml
# $Values = {replicas: 3}
!emit
replicas: !str $Values.replicas
# replicas: "3"
```

</td></tr>
<tr><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$S: !str $Values.config
# error: !str of a mapping
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!emit
config.json: !to-json-str $Values.config
# config.json: {"a":1}
```

</td></tr>
<tr><td>

```yaml
# $Values = {replicas: 3}
!bind
$Name: !format
  - "%s"
  - !ref $Values.replicas
# error: %s with an int
```

</td><td>

```yaml
# $Values = {replicas: 3}
!bind
$Name: !format
  - "%d"
  - !ref $Values.replicas
# $Name = "3"
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
# $Values = {replicas: 3}
replicas: {{ required "replicas" .Values.replicas | toString | quote }}
# replicas: "3"
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {replicas: 3}
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
replicas: !str $Values.replicas
# replicas: "3"
```

</td></tr>
<tr><th>Difference</th><td>

Same string value. `required` abort = `$fail`. Helm `quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {ha: true}
ha: {{ required "ha" .Values.ha | toString }}
# ha: true
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {ha: true}
!validation
$rules:
  - !is-not-empty $Values.ha?
$fail: "ha"
---
!emit
ha: !str $Values.ha
# ha: true
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {completions: 2}
{{- range until .Values.completions }}
---
name: {{ . }}
{{- end }}
# name: 0 / name: 1
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {completions: 2}
!emit-range
$from: 0
$until: !ref $Values.completions
$as: $I
$yield:
  name: !str $I
# name: "0" / name: "1"
```

</td></tr>
<tr><th>Difference</th><td>

Same documents when `completions` is an int. Helm `name:` is an int; knarr `!str` is a string. Without `---` Helm is one stream, not documents.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {port: 8080}
prometheus.io/port: {{ required "port" .Values.port | quote }}
# prometheus.io/port: "8080"
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {port: 8080}
!validation
$rules:
  - !is-not-empty $Values.port?
$fail: "port"
---
!emit
prometheus.io/port: !str $Values.port
# prometheus.io/port: "8080"
```

</td></tr>
<tr><th>Difference</th><td>

Same string value. `required` abort = `$fail`. Helm `quote` is text quotes.

</td></tr>
</table>
