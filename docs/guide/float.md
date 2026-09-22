# `!float`

Coerce to IEEE **float64**. YAML `0.5` / `1.0` is already float; YAML `1` is int.

## Syntax

```yaml
$Cpu: !float $Values.cpuStr
```

- Already float: unchanged.
- Int → that number as f64.
- String → Go `ParseFloat` 64 (`"0.5"`, `"1e-3"`).
- Errors: `""`, `"500m"`, Inf/NaN, bool, seq, map.

`.nan` / `.inf` in YAML are errors even before `!float`.

## Examples

### CPU limit 0.5

```yaml
!bind
$Values:
  cpu: 0.5
---
!emit
resources:
    cpu: !ref $Values.cpu
```

### String values to float for `%f`

```yaml
$Cpu: !float $Values.cpu
$Label: !format
  - "%.1f"
  - !ref $Cpu
```

### Int + float in `!expr`

```yaml
$Limit: !expr "$Values.replicas + 0.5"
```

No `!float` needed: int promotes. Result is float.

### Quantity stays a string

```yaml
cpu: "500m"
```

`!float` of `"500m"` is an error. There is no Quantity type in v1.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Ok: !expr "0.1 + 0.2 == 0.3"
# IEEE float64; 0.1 + 0.2 is not 0.3
```

</td><td>

```yaml
!bind
$Sum: !expr "0.1 + 0.2"
# same rounding as Go float64; do not compare with == 0.3
```

</td></tr>
<tr><td>

```yaml
!bind
$Cpu: !int $Values.cpu
# cpu 0.5 cannot truncate; !int of a float is an error
```

</td><td>

```yaml
!bind
$Cpu: !float $Values.cpu
# keep the float, or use !float
```

</td></tr>
<tr><td>

```yaml
!bind
$Cpu: !expr "float64($Values.cpuStr)"
# no float64() in !expr
```

</td><td>

```yaml
!bind
$Cpu: !float $Values.cpuStr
# coerce with !float
```

</td></tr>
<tr><td>

```yaml
!bind
$Cpu: !float "500m"
# millicores are not a float
```

</td><td>

```yaml
!emit
cpu: "500m"
# leave Quantity as a quoted string
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
cpu: {{ required "cpu" .Values.cpu }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !not-empty $Values.cpu?
$fail: "cpu"
---
!emit
cpu: !ref $Values.cpu
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
cpu: {{ float64 .Values.cpuStr }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Cpu: !float $Values.cpuStr
---
!emit
cpu: !ref $Cpu
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `cpuStr` is a decimal string. No `float64()` in `!expr`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
limit: {{ add .Values.replicas 0.5 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Limit: !expr "$Values.replicas + 0.5"
---
!emit
limit: !ref $Limit
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is present.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
cpu: 500m
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible as `!float "500m"`.

</td></tr>
<tr><th>Difference</th><td>

`!float "500m"` is an error. Keep Quantity quoted as a string.

</td></tr>
</table>
