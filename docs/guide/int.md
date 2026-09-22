# `!int`

Coerce to **int** at evaluation. Not YAML `!!int`, not `int()` in `!expr`.

## Syntax

```yaml
# $Values = {port: "8080"}
$Port: !int $Values.port
# 8080
```

- Already int: unchanged.
- String: optional `-`, then decimal digits (`"08"` → `8`).
- Errors: `""`, `"+1"`, float, hex, bool, seq, map.
- Does **not** truncate floats (`1.9` is an error).

## Examples

### containerPort from string values

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int $Values.port
---
!emit
containerPort: !ref $Port
# containerPort: 8080
```

### `%d` needs int

```yaml
# $Values = {port: "8080", env: prod}
!bind
$Port: !int $Values.port
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
# $Name = prod-8080
```

### Optional

```yaml
# $Values = {}
$Port?: !int $Values.port?
# no $Port
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {port: "8080"}
!emit
containerPort: !expr "int($Values.port)"
# error: no int() in !expr
```

</td><td>

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int $Values.port
---
!emit
containerPort: !ref $Port
# containerPort: 8080
```

</td></tr>
<tr><td>

```yaml
# $Values = {port: "8080"}
!emit
containerPort: !!int $Values.port
# error: YAML core !!int is rejected
```

</td><td>

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int $Values.port
---
!emit
containerPort: !ref $Port
# containerPort: 8080
```

</td></tr>
<tr><td>

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int !expr "$Values.port"
# error: two tags on one node
```

</td><td>

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int $Values.port
# $Port = 8080
```

</td></tr>
<tr><td>

```yaml
# $Values = {replicas: 3}
!bind
$N: !expr "$Values.replicas + \"1\""
# error: + does not coerce a string
```

</td><td>

```yaml
# $Values = {replicas: 3}
!bind
$One: !int "1"
$N: !expr "$Values.replicas + $One"
# $N = 4
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
# $Values = {port: "8080"}
containerPort: {{ int (required "port" .Values.port) }}
# containerPort: 8080
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int $Values.port
---
!validation
$rules:
  - !is-not-empty $Values.port?
$fail: "port"
---
!emit
containerPort: !ref $Port
# containerPort: 8080
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {port: "8080"}
port: {{ atoi .Values.port }}
# port: 8080
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

knarr `!int` of `"+1"` is an error. Bind-only snippet is not Helm stdout.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {env: prod, port: "8080"}
name: {{ printf "%s-%d" .Values.env (int .Values.port) }}
# name: prod-8080
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {env: prod, port: "8080"}
!bind
$Port: !int $Values.port
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
---
!emit
name: !ref $Name
# name: prod-8080
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `env` and `port` are present.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
n: {{ int 1.9 }}
# n: 1
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `int` truncates `1.9` → `1`. Knarr `!int` of a float is an error.

</td></tr>
</table>
