# `!float`

Coerce to IEEE **float64**. YAML `0.5` / `1.0` is already float; YAML `1` is int.

**Helm:** `float64` — [vs Helm](float-vs-helm.md).

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
---
!bind
$Values:
  cpu: 0.5
---
!emit
spec:
  containers:
    - resources:
        limits:
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

**Wrong — `0.1 + 0.2` expecting `0.3`**

IEEE, same as Helm/Go.

**Wrong — `!int $Values.cpu` when cpu is `0.5`**

No truncation. Keep the float or use `!float`.

**Wrong — `float64()` in `!expr`**

```yaml
$Cpu: !expr "float64($Values.cpuStr)"
```

**Right**

```yaml
$Cpu: !float $Values.cpuStr
```

**Wrong — millicores as float**

```yaml
$Cpu: !float "500m"
```

**Right — leave Quantity as a string**

```yaml
cpu: "500m"
```

## See also

- [vs Helm](float-vs-helm.md)
- [`!expr`](expr.md)
- [`!format`](format.md)
- [`!int`](int.md)
