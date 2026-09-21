# `!range`

Build a sequence of **ints**. Bind-only. Use it as `$over` via `!ref`.

## Syntax

```yaml
$Idx: !range
  $from: 0          # omit → 0
  $to: 3            # inclusive  XOR  $until
  $step: 1          # omit → 1
```

Exclusive end:

```yaml
$Idx: !range
  $until: 3         # 0, 1, 2
```

- XOR `$to` (inclusive) or `$until` (exclusive).
- Bounds and `$step` are **int**.
- `$step: 0` is an error. Impossible direction → `[]`.
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
  $until: !ref $Values.replicas
```

### Indexed Jobs / ordinals

```yaml
---
!bind
$Idx: !range
  $from: 0
  $until: !ref $Values.completions
---
!emit-foreach
$over: !ref $Idx
$as: $I
$yield:
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: !str $I
  spec:
    template:
      spec:
        containers:
          - name: worker
            image: ghcr.io/acme/job:1
```

`!format` cannot sit in `$yield`. Prefixed names (`w-0`) belong in **values**, or a dedicated `$Name: !format` per static index.

### Downwards

```yaml
$Idx: !range
  $from: 5
  $to: 0
  $step: -1
```

## Common mistakes

**Wrong — `$to` and `$until` together**

Pick one.

**Wrong — `$over: !range` on `!foreach`**

**Right —** `$Idx: !range` in bind, `$over: !ref $Idx`.

**Wrong — float bounds**

`!int` first.

## See also

- [`!emit-foreach`](emit-foreach.md)
- [`!str`](str.md)

## Comparison with Helm

`$until` is exclusive (like `until`). `$to` is **inclusive**. Bind, then `!ref`.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{- range until 3 }}  {{/* 0,1,2 */}}
```

</td><td>

```yaml
$Idx: !range
  $until: 3
```

</td></tr>
<tr><td>

```gotemplate
{{- range untilStep 0 3 1 }}
```

</td><td>

```yaml
$Idx: !range
  $from: 0
  $to: 2
  $step: 1
```

</td></tr>
<tr><td>

```gotemplate
{{- range until .Values.completions }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ . }}
{{- end }}
```

</td><td>

```yaml
---
!bind
$Idx: !range
  $until: !ref $Values.completions
---
!emit-foreach
$over: !ref $Idx
$as: $I
$yield:
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: !str $I
```

</td></tr>
</table>
