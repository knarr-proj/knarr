# `!emit-range`

Emit **N YAML documents** — one per int in a [`!range`](range.md). For a collection, use [`!emit-foreach`](emit-foreach.md). **`!emit-range?`** skips an index when `$yield?:` omits.

## Syntax

```yaml
# $Values = {completions: 2, jobs: true}
!emit-range
$from: 0
$until: !ref $Values.completions
$as: $I
$filter: !expr "$I != 0"          # optional
$when: !is-not-empty $Values.jobs?  # optional pack gate
$yield:
  kind: Job
  name: !str $I
# kind: Job / name: "1"
```

| Key | Meaning |
|-----|---------|
| `$from` / `$to` xor `$until` / `$step` | Same as [`!range`](range.md). **`$from?:` is an error.** Omit a bound → **zero documents**. |
| `$as` | Binding for the int. |
| `$yield` | On **`!emit-range`**: mapping = one manifest. Omit is an error. |
| `$yield?:` | On **`!emit-range?` only**: mapping; omit → **no document** for that index. |
| `$filter` | Bool; false → no document for that index. |
| `$when` | Bool gate for the **whole** pack. Optional on both tags. False → zero documents; bounds are not evaluated. **No** `$else-yield` (not if/else). `$yield` is the loop body. |

No `$over` / `$key` / `$index`. `$yield` / `$yield?:` must be a **mapping**. Pair: `!emit-range` ↔ `$yield:`; `!emit-range?` ↔ `$yield?:`. `$Name: !emit-range` / `$Name: !emit-range?` is an error.

## Examples

### One Job per index

```yaml
# $Values = {completions: 2}
!emit-range
$from: 0
$until: !ref $Values.completions
$as: $I
$yield:
  kind: Job
  name: !str $I
# ---
# kind: Job
# name: "0"
# ---
# kind: Job
# name: "1"
```

### Gate the pack

```yaml
# $Values = {jobs: true, completions: 2}
!emit-range
$when: !is-not-empty $Values.jobs?
$from: 0
$until: !ref $Values.completions
$as: $I
$yield:
  kind: Job
  name: !str $I
# two Job documents
```

`$Values = {}` → zero documents (`$when` false; bounds not read).

### Filter an index

```yaml
# $Values = {completions: 3}
!emit-range
$from: 0
$until: !ref $Values.completions
$as: $I
$filter: !expr "$I != 0"
$yield:
  kind: Job
  name: !str $I
# Jobs name "1" and "2"
```

### Skip an index when the body omits

```yaml
# $Values = {n: 2, extra: {1: {kind: Job}}}
!emit-range?
$from: 0
$until: !ref $Values.n
$as: $I
$yield?: !ref $Values.extra[$I]?
# kind: Job
```

Index `0` omits → no document. Index `1` prints. `$yield?:` on `!emit-range` is a pair error.

## Omit

Same markers as [`!emit-foreach`](emit-foreach.md): omit `$when` is an error; omit a bound (`$until: !ref $Values.n?`) → zero documents; on **`!emit-range?`**, omit `$yield?:` skips one index.

```yaml
# $Values = {}
!emit-range
$from: 0
$until: !ref $Values.completions?
$as: $I
$yield:
  kind: Job
  name: !str $I
# stdout empty
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!range
$from: 0
$until: 2
$as: $I
$yield:
  kind: Job
# error: !range is bind, not a document
```

</td><td>

```yaml
# $Values = {a: 1}
!emit-range
$from: 0
$until: 2
$as: $I
$yield:
  kind: Job
  name: !str $I
# kind: Job / name: "0" / name: "1"
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!emit-range
$over: !ref $Idx
$as: $I
$yield:
  kind: Job
# error: no $over — that is !emit-foreach
```

</td><td>

```yaml
# $Values = {a: 1}
!emit-range
$from: 0
$until: 2
$as: $I
$yield:
  kind: Job
  name: !str $I
# kind: Job / name: "0" / name: "1"
```

</td></tr>
</table>

## See also

- [`!range`](range.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!str`](str.md)
- [`$when`](when.md)

## Comparison with Helm

`!emit-range` is `range until` around a **whole resource**. Helm Comparison snippets include `---`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {completions: 2}
{{- range until .Values.completions }}
---
kind: Job
name: {{ . }}
{{- end }}
# kind: Job / name: 0 / name: 1
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
  kind: Job
  name: !str $I
# kind: Job / name: "0" / name: "1"
```

</td></tr>
<tr><th>Difference</th><td>

Same documents when `completions` is an int. Helm `name:` is an int; knarr `!str` is a string. Without `---` Helm is one stream, not documents.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {n: 2}
{{- range until .Values.n }}
---
name: {{ printf "w-%04d" . }}
{{- end }}
# name: w-0000 / name: w-0001
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {n: 2}
!emit-range
$from: 0
$until: !ref $Values.n
$as: $I
$yield:
  name: !format
    - "w-%04d"
    - !ref $I
# name: w-0000
# ---
# name: w-0001
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Without `---` Helm is one stream, not documents.

</td></tr>
</table>
