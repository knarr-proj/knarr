# `!int`

Coerce to **int** at evaluation. Not YAML `!!int`, not `int()` in `!expr`.

**Helm:** `int` / `atoi` — [vs Helm](int-vs-helm.md).

## Syntax

```yaml
$Port: !int $Values.port
containerPort: !int $Values.port
```

- Already int: unchanged.
- String: optional `-`, then decimal digits (`"08"` → `8`).
- Errors: `""`, `"+1"`, float, hex, bool, seq, map.
- Does **not** truncate floats (`1.9` is an error).

## Examples

### containerPort from string values

```yaml
---
!bind
$Port: !int $Values.port
---
!emit
spec:
  ports:
    - containerPort: !ref $Port
```

### `%d` needs int

```yaml
---
!bind
$Port: !int $Values.port
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
```

### Optional

```yaml
$Port?: !int $Values?.port
```

## Common mistakes

**Wrong — function or YAML core tag**

```yaml
port: !expr "int($Values.port)"
port: !!int $Values.port
port: !int !expr "$Values.port"
```

**Right — one tag on a path**

```yaml
$Port: !int $Values.port
containerPort: !ref $Port
```

**Wrong — adding a string**

```yaml
$N: !expr "$Values.replicas + \"1\""
```

**Right**

```yaml
$One: !int "1"
$N: !expr "$Values.replicas + $One"
```

## See also

- [vs Helm](int-vs-helm.md)
- [`!str`](str.md)
- [`!format`](format.md)
