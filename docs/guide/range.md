# `!range`

Loop over an **int** sequence. Same slots as [`!foreach`](foreach.md): bind **or** a field. Each iteration appends `$yield`. Documents: [`!emit-range`](emit-range.md).

## Syntax

```yaml
# $Values = {a: 1}
$Idx: !range
  $from: 0
  $to: 2              # inclusive  XOR  $until
  $step: 1            # optional; missing key → 1
  $as: $I
  $when: true         # optional; false → empty result
  $filter: true       # optional
  $yield: !ref $I
# $Idx = [0, 1, 2]
```

Exclusive end:

```yaml
# $Values = {a: 1}
$Idx: !range
  $from: 0
  $until: 3           # indexes 0, 1, 2
  $as: $I
  $yield: !ref $I
# $Idx = [0, 1, 2]
```

- Result is **only** `$yield` (or `$yield?:`). No `$as` / no `$yield` is an error. Not `[0, 1, 2]` from bounds alone.
- `$from` is always written. No key / omit → error, not `0`.
- `$step` key absent → `1`. Written `$step` that omits is an error, not `1`. `$step: 0` is an error.
- XOR `$to` (inclusive) or `$until` (exclusive). Bounds and `$step` are **int**.
- `$as` / `$when` / `$filter` / `$yield` — same roles as [`!emit-foreach`](emit-foreach.md). `$yield` may be scalar / seq / map (like [`!foreach`](foreach.md)).
- `$when` false → bounds are not evaluated; result like an empty `!foreach`. `$as` is not in `$when`.
- No `$over` / `$key`. Not a document. A field of `!emit` is allowed (like `!foreach`).
- `$Name?:` / `имя?:` ↔ omit-capable `$from` / `$to` / `$until` (no `??`) **or** `$yield?:`. Omit a bound → omit the bind / key.
- `$from?:` / `$to?:` / `$until?:` / `$step?:` are errors.

## Examples

### Inclusive `0..2`

```yaml
# $Values = {}
!bind
$Idx: !range
  $from: 0
  $to: 2
  $as: $I
  $yield: !ref $I
# $Idx = [0, 1, 2]
```

### Exclusive `$until`

```yaml
# $Values = {replicas: 3}
$Idx: !range
  $from: 0
  $until: !ref $Values.replicas
  $as: $I
  $yield: !ref $I
# $Idx = [0, 1, 2]
```

### Names as strings

```yaml
# $Values = {completions: 2}
!emit
names: !range
  $from: 0
  $until: !ref $Values.completions
  $as: $I
  $yield: !format
    - "w-%04d"
    - !ref $I
# names: ["w-0000", "w-0001"]
```

Prefixed names use [`!format`](format.md) in `$yield`.

### Optional count

```yaml
# $Values = {}
!emit
idx?: !range
  $from: 0
  $until: !ref $Values.replicas?
  $as: $I
  $yield: !ref $I
# no idx
```

`replicas: 0` → `$Idx: []`. Always keep a list:

```yaml
# $Values = {}
$Idx: !range
  $from: 0
  $until: !ref "$Values.replicas? ?? 0"
  $as: $I
  $yield: !ref $I
# $Idx = []
```

### Downwards

```yaml
# $Values = {}
$Idx: !range
  $from: 5
  $to: 0
  $step: -1
  $as: $I
  $yield: !ref $I
# $Idx = [5, 4, 3, 2, 1, 0]
```

### Skip zero

```yaml
# $Values = {n: 3}
$Idx: !range
  $from: 0
  $until: !ref $Values.n
  $as: $I
  $filter: !expr "$I != 0"
  $yield: !ref $I
# $Idx = [1, 2]
```

## Omit

`$Name?:` needs an omit-capable bound **or** `$yield?:`. Leaf omit still needs **both** `?:` and a `?` path.

```yaml
# $Values = {}
$Idx?: !range
  $from: 0
  $until: !ref $Values.replicas?
  $as: $I
  $yield: !ref $I
# no $Idx
```

```yaml
# $Values = {replicas: 0}
$Idx?: !range
  $from: 0
  $until: !ref $Values.replicas
  $as: $I
  $yield?: !ref $I
# $Idx = []  ($yield: would also be [])
```

`$when` false is an empty loop (not a missing bound): `$Name:` + `$yield:` → `[]`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {a: 1}
$Idx: !range
  $from: 0
  $until: 3
# error: no $as / $yield
```

</td><td>

```yaml
# $Values = {a: 1}
$Idx: !range
  $from: 0
  $until: 3
  $as: $I
  $yield: !ref $I
# $Idx = [0, 1, 2]
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
$Idx: !range
  $until: 3
  $as: $I
  $yield: !ref $I
# error: $from is required
```

</td><td>

```yaml
# $Values = {a: 1}
$Idx: !range
  $from: 0
  $until: 3
  $as: $I
  $yield: !ref $I
# $Idx = [0, 1, 2]
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
env: !foreach
  $over: !range
    $from: 0
    $until: 3
    $as: $I
    $yield: !ref $I
# error: !range cannot be $over
```

</td><td>

```yaml
# $Values = {}
!emit
env: !range
  $from: 0
  $until: 3
  $as: $I
  $yield:
    name: !str $I
# env: [{name: "0"}, {name: "1"}, {name: "2"}]
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
$Idx?: !range
  $from: 0
  $until: 5
  $as: $I
  $yield: !ref $I
# error: all bounds are values; ?: cannot fire
```

</td><td>

```yaml
# $Values = {}
$Idx?: !range
  $from: 0
  $until: !ref $Values.replicas?
  $as: $I
  $yield: !ref $I
# no $Idx
```

</td></tr>
</table>

## See also

- [`!emit-range`](emit-range.md)
- [`!foreach`](foreach.md)
- [`!emit-foreach`](emit-foreach.md)
- [`!str`](str.md)

## Comparison with Helm

`$until` is exclusive (like `until`). `$to` is **inclusive**. Write `$from`. Missing `$step` key is `1`. Output is `$yield`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {a: 1}
idx:
{{- range until 3 }}
  - {{ . }}
{{- end }}
# idx: [0, 1, 2]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit
idx: !range
  $from: 0
  $until: 3
  $as: $I
  $yield: !ref $I
# idx: [0, 1, 2]
```

</td></tr>
<tr><th>Difference</th><td>

Same list `0,1,2`. Knarr writes `$from: 0` and `$yield`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {a: 1}
idx:
{{- range untilStep 0 3 1 }}
  - {{ . }}
{{- end }}
# idx: [0, 1, 2]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit
idx: !range
  $from: 0
  $to: 2
  $step: 1
  $as: $I
  $yield: !ref $I
# idx: [0, 1, 2]
```

</td></tr>
<tr><th>Difference</th><td>

Same list `0,1,2`. Helm end exclusive; knarr `$to` inclusive.

</td></tr>
</table>
