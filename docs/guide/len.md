# `!len`

Length as **int**: sequence length, mapping key count, or string **UTF-8 byte** count (not runes).

## Syntax

```yaml
$N: !len $Values.workers
replicas: !len $Values.workers
$N?: !len $Values.workers?
```

Not a bool: `$when: !len` is an error. Use [`!not-empty`](not-empty.md).

## Examples

### replicas = number of workers

```yaml
replicas: !len $Values.workers
```

### Last list element

```yaml
$N: !len $Values.workers
$I: !expr "$N - 1"
image: !expr "$Values.workers[$I].image"
```

Empty list → index error (no `[-1]`).

### Optional length

```yaml
$N?: !len $Values.workers?
!emit
replicas?: !ref $N?
```

### Labels count in an annotation

```yaml
$N: !len $Values.labels
$Ann: !format
  - "%d-labels"
  - !ref $N
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$n: !expr "len($Values.workers)"
# no len() in !expr
```

</td><td>

```yaml
!bind
$n: !len $Values.workers
# length is the !len tag
```

</td></tr>
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
$when: !not-empty $Values.workers?
$then:
  kind: ConfigMap
  name: workers
# $when needs a bool: !not-empty, or !len then !expr "$N > 0"
```

</td></tr>
<tr><td>

```yaml
!bind
$N: !len $Values.label
# "ж" is 2 bytes, not 1 rune
```

</td><td>

```yaml
!bind
$N: !len $Values.label
# !len of a string is UTF-8 byte length
```

</td></tr>
<tr><td>

```yaml
!bind
$N: !len $Values.workers?
# omit !len without ?: on the key is an error
```

</td><td>

```yaml
!bind
$N?: !len $Values.workers?
# pair omit: $N?: with ?.
```

</td></tr>
</table>

## See also

- [`!not-empty`](not-empty.md)
- [`!expr`](expr.md)

## Comparison with Helm

`!len` is a tag (seq / map keys / string **bytes**). Not a bool; not `len()` in `!expr`.

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ len (required "workers" .Values.workers) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !not-empty $Values.workers?
$fail: "workers"
---
!emit
replicas: !len $Values.workers
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
image: {{ last .Values.workers }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `last` of a list of maps is the last map. This knarr snippet takes `.image`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if gt (len .Values.workers) 0 }}
kind: ConfigMap
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !not-empty $Values.workers?
$then:
  kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result for a list. Helm `gt (len .) 0` ≡ `!not-empty`. `$then` is the whole document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ann: {{ printf "%d-labels" (len .Values.labels) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$N: !len $Values.labels
$Ann: !format
  - "%d-labels"
  - !ref $N
---
!emit
ann: !ref $Ann
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `labels` is present.

</td></tr>
</table>
