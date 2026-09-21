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
<tr><th>Helm</th><td>

```gotemplate
name: {{ printf "%s-%s" .Values.env .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

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
<tr><th>Difference</th><td>

Helm `printf` is in the template; knarr `!format` is bind-only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
addr: {{ printf "%s:%d" .Values.host .Values.port }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Addr: !format
  - "%s:%d"
  - !ref $Values.host
  - !ref $Port
```

</td></tr>
<tr><th>Difference</th><td>

Helm `printf` is in the template; knarr `!format` is bind-only. Wrong operand type is `%!s` in Helm, an error in knarr.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ann: {{ printf "app=%q" .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Ann: !format
  - "app=%q"
  - !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ printf "w-%04d" $i }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$WorkerId: !format
  - "w-%04d"
  - !ref $I
```

</td></tr>
<tr><th>Difference</th><td>

Helm `$i` comes from `range`; knarr `$I` comes from `!range`.

</td></tr>
</table>
