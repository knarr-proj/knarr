# `!float`

Coerce to IEEE **float64**. YAML `0.5` / `1.0` is already float; YAML `1` is int.

## Syntax

```yaml
# $Values = {cpuStr: "0.5"}
$Cpu: !float $Values.cpuStr
# $Cpu = 0.5
```

- Already float: unchanged.
- Int → that number as f64.
- String → Go `ParseFloat` 64 (`"0.5"`, `"1e-3"`).
- Errors: `""`, `"500m"`, Inf/NaN, bool, seq, map.

`.nan` / `.inf` in YAML are errors even before `!float`.

## Examples

### CPU limit 0.5

```yaml
# $Values = {cpu: 0.5}
!bind
$Values:
  cpu: 0.5
---
!emit
resources:
    cpu: !ref $Values.cpu
# cpu: 0.5
```

### String values to float for `%f`

```yaml
# $Values = {cpu: "0.5"}
$Cpu: !float $Values.cpu
$Label: !format
  - "%.1f"
  - !ref $Cpu
# $Label = "0.5"
```

### Int + float in `!expr`

```yaml
# $Values = {replicas: 2}
$Limit: !expr "$Values.replicas + 0.5"
# $Limit = 2.5
```

No `!float` needed: int promotes. Result is float.

### Quantity stays a string

```yaml
# $Values = {}
cpu: "500m"
# cpu: "500m"
```

`!float` of `"500m"` is an error. There is no Quantity type in v1.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Ok: !expr "0.1 + 0.2 == 0.3"
# error: 0.1 + 0.2 is not 0.3
```

</td><td>

```yaml
# $Values = {}
!bind
$Sum: !expr "0.1 + 0.2"
# $Sum = 0.30000000000000004
```

</td></tr>
<tr><td>

```yaml
# $Values = {cpu: 0.5}
!bind
$Cpu: !int $Values.cpu
# error: !int of a float
```

</td><td>

```yaml
# $Values = {cpu: 0.5}
!bind
$Cpu: !float $Values.cpu
# $Cpu = 0.5
```

</td></tr>
<tr><td>

```yaml
# $Values = {cpuStr: "0.5"}
!bind
$Cpu: !expr "float64($Values.cpuStr)"
# error: no float64() in !expr
```

</td><td>

```yaml
# $Values = {cpuStr: "0.5"}
!bind
$Cpu: !float $Values.cpuStr
# $Cpu = 0.5
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Cpu: !float "500m"
# error: millicores are not a float
```

</td><td>

```yaml
# $Values = {}
!emit
cpu: "500m"
# cpu: "500m"
```

</td></tr>
</table>

## See also

- [`!expr`](expr.md)
- [`!format`](format.md)
- [`!int`](int.md)

## Comparison with Helm

YAML `0.5` is float; `"500m"` stays a string. Int+float in `!expr` promotes.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {cpu: 0.5}
cpu: {{ required "cpu" .Values.cpu }}
# cpu: 0.5
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {cpu: 0.5}
!validation
$rules:
  - !is-not-empty $Values.cpu?
$fail: "cpu"
---
!emit
cpu: !ref $Values.cpu
# cpu: 0.5
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {cpuStr: "0.5"}
cpu: {{ float64 .Values.cpuStr }}
# cpu: 0.5
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {cpuStr: "0.5"}
!bind
$Cpu: !float $Values.cpuStr
---
!emit
cpu: !ref $Cpu
# cpu: 0.5
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `cpuStr` is a decimal string. No `float64()` in `!expr`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {replicas: 2}
limit: {{ add .Values.replicas 0.5 }}
# limit: 2.5
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {replicas: 2}
!bind
$Limit: !expr "$Values.replicas + 0.5"
---
!emit
limit: !ref $Limit
# limit: 2.5
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is present.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
# $Values = {}
cpu: 500m
# cpu: 500m
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible as `!float "500m"`.

</td></tr>
<tr><th>Difference</th><td>

`!float "500m"` is an error. Keep Quantity quoted as a string.

</td></tr>
</table>
