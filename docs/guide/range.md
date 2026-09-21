# `!range`

Build a sequence of **ints**. Bind-only. Use it as `$over` via `!ref`.

## Syntax

```yaml
$Idx: !range
  $from: 0
  $to: 3            # inclusive  XOR  $until
  $step: 1          # optional; missing key → 1
```

Exclusive end:

```yaml
$Idx: !range
  $from: 0
  $until: 3         # 0, 1, 2
```

- `$from` is always written (a value). No key / omit → error, not `0`.
- `$step` key absent → `1` (the only implicit default). If `$step:` is written, it must be a value (`?? 1` or a required path). Written `$step` that omits is an error, not `1`.
- XOR `$to` (inclusive) or `$until` (exclusive).
- Bounds and `$step` are **int**. `$step: 0` is an error. Impossible direction → `[]`.
- `$Name?: !range` ↔ at least one of `$from` / `$to` / `$until` is omit-capable (`?.`, no `??`). `$step` is not in the pair. Any omit among those three → omit the whole bind.
- All three bounds are values on `$Name?:` → pair error (`?:` cannot fire).
- `$from?:` / `$step?:` / `$to?:` / `$until?:` are errors.
- Not used as `$over` directly: bind first.

## Examples

### Inclusive `0..2`

```yaml
$Idx: !range
  $from: 0
  $to: 2
# [0, 1, 2]
```

### Exclusive `$until: 3` → `[0, 1, 2]`

```yaml
$Idx: !range
  $from: 0
  $until: !ref $Values.replicas
```

### Indexed Jobs / ordinals

```yaml
!bind
$Idx: !range
  $from: 0
  $until: !ref $Values.completions
!emit-foreach
$over: !ref $Idx
$as: $I
$yield:
  kind: Job
  name: !str $I
```

`!format` cannot sit in `$yield`. Prefixed names (`w-0`) belong in **values**, or a dedicated `$Name: !format` per static index.

### Optional count

```yaml
!bind
$Idx?: !range
  $from: 0
  $until: !ref $Values?.replicas
!emit-foreach
$over: !ref $Idx?
$as: $I
$yield:
  kind: Job
  name: !str $I
```

Missing `replicas` → no `$Idx` → zero documents. `replicas: 0` → `$Idx: []` (a value). Always keep a list:

```yaml
!bind
$Idx: !range
  $from: 0
  $until: !ref "$Values?.replicas ?? 0"
```

### Downwards

```yaml
$Idx: !range
  $from: 5
  $to: 0
  $step: -1
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Idx: !range
  $until: 3
# $from is required; missing is not 0
```

</td><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: 3
# write the start
```

</td></tr>
<tr><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $to: 3
  $until: 3
# $to and $until together is an error
```

</td><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: 3
# pick $to (inclusive) or $until (exclusive)
```

</td></tr>
<tr><td>

```yaml
!emit
env: !foreach
  $over: !range
    $from: 0
    $until: 3
  $as: $I
  $yield:
    name: !str $I
# !range cannot be $over directly
```

</td><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: 3
!emit
env: !foreach
  $over: !ref $Idx
  $as: $I
  $yield:
    name: !str $I
# bind !range, then $over: !ref
```

</td></tr>
<tr><td>

```yaml
!bind
$Idx?: !range
  $from: 0
  $until: 5
# all bounds are values; ?: cannot fire
```

</td><td>

```yaml
!bind
$Idx?: !range
  $from: 0
  $until: !ref $Values?.replicas
# at least one of $from / $to / $until omits
```

</td></tr>
<tr><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $step: !ref $Values?.step
  $until: 5
# a written $step that omits is an error, not 1
```

</td><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: 5
# no $step key → 1
```

```yaml
!bind
$Idx: !range
  $from: 0
  $step: !ref "$Values?.step ?? 1"
  $until: 5
# written $step must be a value
```

</td></tr>
<tr><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: !ref $Values.cpu
# bounds must be int; a float is an error
```

</td><td>

```yaml
!bind
$N: !int $Values.completions
$Idx: !range
  $from: 0
  $until: !ref $N
# !int first, then !range
```

</td></tr>
</table>

## See also

- [`!emit-foreach`](emit-foreach.md)
- [`!str`](str.md)
- [`!concat`](concat.md)
- [Omit](omit.md)

## Comparison with Helm

`$until` is exclusive (like `until`). `$to` is **inclusive**. Bind, then `!ref`. Write `$from`. A missing `$step` key is `1`.

<table>
<tr><th>Helm</th><td>

```gotemplate
idx:
{{- range until 3 }}
  - {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: 3
```

</td></tr>
<tr><th>Difference</th><td>

Helm `until` starts at 0 without writing it. Knarr requires `$from: 0`. Both exclusive: `0,1,2`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
idx:
{{- range untilStep 0 3 1 }}
  - {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $to: 2
  $step: 1
```

</td></tr>
<tr><th>Difference</th><td>

Helm `untilStep` end is exclusive (`0,1,2`); knarr `$to` is inclusive (`$until` is exclusive).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range until .Values.completions }}
kind: Job
name: {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Idx: !range
  $from: 0
  $until: !ref $Values.completions
!emit-foreach
$over: !ref $Idx
$as: $I
$yield:
  kind: Job
  name: !str $I
```

</td></tr>
<tr><th>Difference</th><td>

Helm prints the int as the name; knarr needs `!str` for a name string. Knarr writes `$from: 0`.

</td></tr>
</table>
