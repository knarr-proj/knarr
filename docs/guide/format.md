# `!format`

Format a string with **Go `fmt`** verbs (not Rust `{}`). Bind-only.

## Syntax

```yaml
$Name: !format
  - "%s-%s"
  - !ref $Env
  - !ref $App
```

- Tagged **sequence**: first element is the format **string**; the rest are arguments in order.
- Only `$Name` or `$Name?:` in `!bind` (omit children require `$Name?:`).
- Dialect ≡ Go `fmt.Sprintf` for knarr scalars (string, int64, bool, float64).
- Type mismatch is a **render error**, not a `%!s(int=…)` insertion.
- seq/map arguments are errors (JSON-string first).
- `%n` `%p` `%T` `%w` and Rust `{:.2}` are errors.
- Tag name is `!format`, not `!printf`.

## Examples

### Resource name

```yaml
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
metadata:
  name: !ref $FullName
```

### Host:port

```yaml
$Addr: !format
  - "%s:%d"
  - !ref $Values.host
  - !ref $Port
```

`$Port` must be int (`!int` if values had a string).

### Quoted annotation (`%q`)

```yaml
$Ann: !format
  - "app=%q"
  - !ref $Values.name
```

Go quotes, not JSON (`!to-json-str`).

### Zero-padded index

```yaml
$WorkerId: !format
  - "w-%04d"
  - !ref $I
```

### CPU float

```yaml
$Cpu: !format
  - "%.1f"
  - !ref $Values.cpu
```

Operand must be **float**.

## Common mistakes

**Wrong — in metadata**

```yaml
name: !format
  - "%s-svc"
  - !ref $Values.name
```

**Right — bind, `!ref`.**

**Wrong — `!printf` or `printf()` in `!expr`**

**Wrong — `%s` with an int**

Use `%d` or `!str` first.

**Wrong — `"%s-%s"` with bare `$X` in the sequence**

That is the string `"$X"`. Use `!ref $X`.

## See also

- [`!join`](join.md)
- [`!int`](int.md)
- [`!float`](float.md)

## Comparison with Helm

`!format` is bind-only Go `fmt`. Type mismatch is an error, not `%!s`.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
name: {{ printf "%s-%s" .Values.env .Values.name }}
```

</td><td>

```yaml
---
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
metadata:
  name: !ref $FullName
```

</td></tr>
<tr><td>

```gotemplate
{{ printf "%s:%d" .Values.host .Values.port }}
```

</td><td>

```yaml
$Addr: !format
  - "%s:%d"
  - !ref $Values.host
  - !ref $Port
```

</td></tr>
<tr><td>

```gotemplate
{{ printf "app=%q" .Values.name }}
```

</td><td>

```yaml
$Ann: !format
  - "app=%q"
  - !ref $Values.name
```

</td></tr>
<tr><td>

```gotemplate
{{ printf "w-%04d" $i }}
```

</td><td>

```yaml
$WorkerId: !format
  - "w-%04d"
  - !ref $I
```

</td></tr>
</table>
