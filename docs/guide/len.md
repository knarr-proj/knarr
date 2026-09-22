# `!len`

Length as **int**: sequence length, mapping key count, or string **UTF-8 byte** count (not runes).

## Syntax

```yaml
# $Values = {workers: [a, b]}
$N: !len $Values.workers
replicas: !len $Values.workers
$N?: !len $Values.workers?
# $N = 2 / replicas: 2
```

Not a bool: `$when: !len` is an error. Use [`!is-not-empty`](is-not-empty.md).

## Examples

### replicas = number of workers

```yaml
# $Values = {workers: [{name: w1}, {name: w2}]}
replicas: !len $Values.workers
# replicas: 2
```

### Last list element

```yaml
# $Values = {workers: [{image: nginx}]}
$N: !len $Values.workers
$I: !expr "$N - 1"
image: !expr "$Values.workers[$I].image"
# image: nginx
```

Empty list → index error (no `[-1]`).

### Optional length

```yaml
# $Values = {}
$N?: !len $Values.workers?
!emit
replicas?: !ref $N?
# no replicas
```

### Labels count in an annotation

```yaml
# $Values = {labels: {app: a, env: p}}
$N: !len $Values.labels
$Ann: !format
  - "%d-labels"
  - !ref $N
# $Ann = "2-labels"
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {workers: [a]}
!bind
$n: !expr "len($Values.workers)"
# error: no len() in !expr
```

</td><td>

```yaml
# $Values = {workers: [a]}
!bind
$n: !len $Values.workers
# $n = 1
```

</td></tr>
<tr><td>

```yaml
# $Values = {workers: [a]}
!emit?
$when: !len $Values.workers
$yield:
  kind: ConfigMap
# error: !len is an int, not a bool
```

</td><td>

```yaml
# $Values = {workers: [a]}
!emit?
$when: !is-not-empty $Values.workers?
$yield:
  kind: ConfigMap
  name: workers
# kind: ConfigMap / name: workers
```

</td></tr>
<tr><td>

```yaml
# $Values = {label: ж}
!bind
$N: !len $Values.label
# error: "ж" is 2 bytes, not 1 rune
```

</td><td>

```yaml
# $Values = {label: ж}
!bind
$N: !len $Values.label
# $N = 2
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$N: !len $Values.workers?
# error: omit !len without ?: on the key
```

</td><td>

```yaml
# $Values = {}
!bind
$N?: !len $Values.workers?
# no $N
```

</td></tr>
</table>

## See also

- [`!is-not-empty`](is-not-empty.md)
- [`!expr`](expr.md)

## Comparison with Helm

`!len` is a tag (seq / map keys / string **bytes**). Not a bool; not `len()` in `!expr`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [a, b]}
replicas: {{ len (required "workers" .Values.workers) }}
# replicas: 2
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {workers: [a, b]}
!validation
$rules:
  - !is-not-empty $Values.workers?
$fail: "workers"
---
!emit
replicas: !len $Values.workers
# replicas: 2
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [{image: nginx}]}
image: {{ last .Values.workers }}
# image: {image: nginx}
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
# $Values = {workers: [a]}
{{- if gt (len .Values.workers) 0 }}
kind: ConfigMap
{{- end }}
# kind: ConfigMap
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {workers: [a]}
!emit?
$when: !is-not-empty $Values.workers?
$yield:
  kind: ConfigMap
# kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result for a list. Helm `gt (len .) 0` ≡ `!is-not-empty`. `$yield` is the whole document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {labels: {app: a, env: p}}
ann: {{ printf "%d-labels" (len .Values.labels) }}
# ann: 2-labels
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {labels: {app: a, env: p}}
!bind
$N: !len $Values.labels
$Ann: !format
  - "%d-labels"
  - !ref $N
---
!emit
ann: !ref $Ann
# ann: 2-labels
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `labels` is present.

</td></tr>
</table>
