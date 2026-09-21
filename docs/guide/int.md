# `!int`

Coerce to **int** at evaluation. Not YAML `!!int`, not `int()` in `!expr`.

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

- [`!str`](str.md)
- [`!format`](format.md)

## Comparison with Helm

`!int` does not truncate floats. No `int()` in `!expr`.

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
containerPort: {{ int .Values.port }}
```

</td><td>

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

</td><td>

—

</td></tr>
<tr><td>

```gotemplate
port: {{ atoi .Values.port }}
```

</td><td>

```yaml
---
!bind
$Port: !int $Values.port
```

</td><td>

Helm `atoi` and knarr `!int` both parse decimal strings; knarr `"+1"` is an error (`"08"` → 8).

</td></tr>
<tr><td>

```gotemplate
name: {{ printf "%s-%d" .Values.env (int .Values.port) }}
```

</td><td>

```yaml
---
!bind
$Port: !int $Values.port
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
```

</td><td>

Helm `int()` in `printf`; knarr no `int()` in `!expr` — `!int` in bind, then `!format`.

</td></tr>
<tr><td>

```gotemplate
n: {{ int 1.9 }}
```

</td><td>

```yaml
---
!bind
$N: !int 1
# !int 1.9 is an error
```

</td><td>

Helm `int` truncates `1.9` → `1`; knarr `!int` of a float is an error.

</td></tr>
</table>
