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
- Only `$Name` or `$Name?:` in `!bind` (omit children require `$Name?:`). A literal format string on `$Name?:` is allowed; one omit argument drops the whole bind (unlike [`!merge`](merge.md)).
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
!emit
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

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
name: !format
  - "%s-svc"
  - !ref $Values.name
# !format is bind-only
```

</td><td>

```yaml
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
---
!emit
name: !ref $Name
# format in bind, then !ref
```

</td></tr>
<tr><td>

```yaml
!bind
$Name: !expr "printf('%s-svc', $Values.name)"
# no printf() in !expr; no !printf tag
```

</td><td>

```yaml
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
# Go fmt is !format
```

</td></tr>
<tr><td>

```yaml
!bind
$Name: !format
  - "%s"
  - !ref $Values.replicas
# %s with an int is an error
```

</td><td>

```yaml
!bind
$Name: !format
  - "%d"
  - !ref $Values.replicas
# use %d, or !str first
```

</td></tr>
<tr><td>

```yaml
!bind
$Name: !format
  - "%s-%s"
  - $Values.env
  - $Values.name
# bare $X in the sequence is the string "$X"
```

</td><td>

```yaml
!bind
$Name: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
# operands are !ref (or other tags), not bare identifiers
```

</td></tr>
</table>

## See also

- [`!join`](join.md)
- [`!int`](int.md)
- [`!float`](float.md)

## Comparison with Helm

`!format` is bind-only Go `fmt`. Type mismatch is an error, not `%!s`.

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ printf "%s-%s" (required "env" .Values.env) (required "name" .Values.name) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!validation
$rules:
  - !is-not-empty $Values.env?
  - !is-not-empty $Values.name?
$fail: "env"
---
!emit
name: !ref $FullName
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
addr: {{ printf "%s:%d" .Values.host .Values.port }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Wrong operand type is `%!s` in Helm, an error in knarr. Bind-only `!format` is not this Helm stdout unless types already match.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ann: {{ printf "app=%q" (required "name" .Values.name) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Ann: !format
  - "app=%q"
  - !ref $Values.name
---
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "name"
---
!emit
ann: !ref $Ann
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ printf "w-%04d" $i }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `$i` is a `range` local. Knarr `$I` is a bind from `!range`. The snippets are not whole programs.

</td></tr>
</table>
