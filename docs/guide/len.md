# `!len`

Length as **int**: sequence length, mapping key count, or string **UTF-8 byte** count (not runes).

## Syntax

```yaml
$N: !len $Values.workers
replicas: !len $Values.workers
$N?: !len $Values?.workers
```

Not a bool: `$when: !len` is an error. Use [`!not-empty`](not-empty.md).

## Examples

### replicas = number of workers

```yaml
spec:
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
$N?: !len $Values?.workers
---
!emit
spec:
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
---
!bind
$n: !expr "len($Values.workers)"
# no len() in !expr
```

</td><td>

```yaml
---
!bind
$n: !len $Values.workers
# length is the !len tag
```

</td></tr>
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
# $when needs a bool: !not-empty, or !len then !expr "$N > 0"
```

</td></tr>
<tr><td>

```yaml
---
!bind
$N: !len $Values.label
# "ж" is 2 bytes, not 1 rune
```

</td><td>

```yaml
---
!bind
$N: !len $Values.label
# !len of a string is UTF-8 byte length
```

</td></tr>
<tr><td>

```yaml
---
!bind
$N: !len $Values?.workers
# omit !len without ?: on the key is an error
```

</td><td>

```yaml
---
!bind
$N?: !len $Values?.workers
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
replicas: {{ len .Values.workers }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
spec:
  replicas: !len $Values.workers
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
image: {{ last .Values.workers }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$N: !len $Values.workers
$I: !expr "$N - 1"
---
!emit
spec:
  image: !expr "$Values.workers[$I].image"
```

</td></tr>
<tr><th>Difference</th><td>

Helm `last` is one function; knarr indexes via `!len` + `!expr`. Helm `last` of a list of maps is the last map; this knarr example takes `.image`.

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
---
!emit
$when: !not-empty $Values?.workers
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: workers
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `gt (len) 0` is in `if`; knarr `$when` needs a bool (`!not-empty`). `len()` is not valid in `!expr`.

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
---
!bind
$N: !len $Values.labels
$Ann: !format
  - "%d-labels"
  - !ref $N
```

</td></tr>
<tr><th>Difference</th><td>

Helm `printf` + `len` in the template; knarr `!len` then bind-only `!format`.

</td></tr>
</table>
