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
<tr><th>Helm</th><th>Knarr</th></tr>
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

</td></tr>
<tr><td>

```gotemplate
{{ atoi .Values.port }}
```

</td><td>

```yaml
$Port: !int $Values.port
# "08" → 8; "+1" errors
```

</td></tr>
<tr><td>

```gotemplate
{{ printf "%s-%d" .Values.env (int .Values.port) }}
```

</td><td>

```yaml
$Port: !int $Values.port
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
```

</td></tr>
<tr><td>

```gotemplate
{{ int 1.9 }}
```

</td><td>

```yaml
# !int of 1.9 is an error (no truncation)
```

</td></tr>
</table>
