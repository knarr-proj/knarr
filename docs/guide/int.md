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
!bind
$Port: !int $Values.port
!emit
containerPort: !ref $Port
```

### `%d` needs int

```yaml
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

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
containerPort: !expr "int($Values.port)"
# no int() in !expr
```

</td><td>

```yaml
!bind
$Port: !int $Values.port
!emit
containerPort: !ref $Port
# coerce with !int in bind, then !ref
```

</td></tr>
<tr><td>

```yaml
!emit
containerPort: !!int $Values.port
# YAML core !!int is rejected
```

</td><td>

```yaml
!bind
$Port: !int $Values.port
!emit
containerPort: !ref $Port
# one knarr tag on a path
```

</td></tr>
<tr><td>

```yaml
!bind
$Port: !int !expr "$Values.port"
# two tags on one node is an error
```

</td><td>

```yaml
!bind
$Port: !int $Values.port
# !int takes a path (or a string/int scalar)
```

</td></tr>
<tr><td>

```yaml
!bind
$N: !expr "$Values.replicas + \"1\""
# + does not coerce a string
```

</td><td>

```yaml
!bind
$One: !int "1"
$N: !expr "$Values.replicas + $One"
# !int the string, then add
```

</td></tr>
</table>

## See also

- [`!str`](str.md)
- [`!format`](format.md)

## Comparison with Helm

`!int` does not truncate floats. No `int()` in `!expr`.

<table>
<tr><th>Helm</th><td>

```gotemplate
containerPort: {{ int .Values.port }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Port: !int $Values.port
!emit
containerPort: !ref $Port
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
port: {{ atoi .Values.port }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Port: !int $Values.port
```

</td></tr>
<tr><th>Difference</th><td>

Helm `atoi` and knarr `!int` both parse decimal strings; knarr `"+1"` is an error (`"08"` → 8).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ printf "%s-%d" .Values.env (int .Values.port) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Port: !int $Values.port
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
```

</td></tr>
<tr><th>Difference</th><td>

Helm `int()` in `printf`; knarr no `int()` in `!expr` — `!int` in bind, then `!format`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
n: {{ int 1.9 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$N: !int 1
# !int 1.9 is an error
```

</td></tr>
<tr><th>Difference</th><td>

Helm `int` truncates `1.9` → `1`; knarr `!int` of a float is an error.

</td></tr>
</table>
