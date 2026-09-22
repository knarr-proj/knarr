# `!format`

Format a string with **Go `fmt`** verbs (not Rust `{}`). A value, like [`!str`](str.md): bind or a field.

## Syntax

```yaml
# $Env = prod; $App = api
$Name: !format
  - "%s-%s"
  - !ref $Env
  - !ref $App
# $Name = prod-api
```

```yaml
# $Values = {name: api}
!emit
name: !format
  - "%s-svc"
  - !ref $Values.name
# name: api-svc
```

- Tagged **sequence**: first element is the format **string**; the rest are arguments in order.
- Bind `$Name` / `$Name?:`, or a field of `!emit` / `$then` / `$yield` (same omit pair: `?:` ↔ an omit-capable argument). A literal format string on `?:` is allowed; one omit argument drops the whole value (unlike [`!merge`](merge.md)).
- Dialect ≡ Go `fmt.Sprintf` for knarr scalars (string, int64, bool, float64).
- Type mismatch is a **render error**, not a `%!s(int=…)` insertion.
- seq/map arguments are errors (JSON-string first).
- `%n` `%p` `%T` `%w` and Rust `{:.2}` are errors.
- Tag name is `!format`, not `!printf`. Not a document. Nested `!format` is an error.

## Examples

### Resource name

```yaml
# $Values = {env: prod, name: api}
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
name: !ref $FullName
# name: prod-api
```

Or the same `!format` on the field:

```yaml
# $Values = {env: prod, name: api}
!emit
name: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
# name: prod-api
```

### Host:port

```yaml
# $Values = {host: h}; $Port = 80
$Addr: !format
  - "%s:%d"
  - !ref $Values.host
  - !ref $Port
# $Addr = h:80
```

`$Port` must be int (`!int` if values had a string).

### Quoted annotation (`%q`)

```yaml
# $Values = {name: api}
$Ann: !format
  - "app=%q"
  - !ref $Values.name
# $Ann = app="api"
```

Go quotes, not JSON (`!to-json-str`).

### Zero-padded index

```yaml
# $Values = {n: 2}
!emit-range
$from: 0
$until: !ref $Values.n
$as: $I
$yield:
  name: !format
    - "w-%04d"
    - !ref $I
# name: w-0000
# ---
# name: w-0001
```

### CPU float

```yaml
# $Values = {cpu: 0.5}
$Cpu: !format
  - "%.1f"
  - !ref $Values.cpu
# $Cpu = 0.5
```

Operand must be **float**.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {name: api}
!format
  - "%s-svc"
  - !ref $Values.name
# error: !format is not a document
```

</td><td>

```yaml
# $Values = {name: api}
!emit
name: !format
  - "%s-svc"
  - !ref $Values.name
# name: api-svc
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!bind
$Name: !expr "printf('%s-svc', $Values.name)"
# error: no printf() in !expr
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
# $Name = api-svc
```

</td></tr>
<tr><td>

```yaml
# $Values = {replicas: 3}
!bind
$Name: !format
  - "%s"
  - !ref $Values.replicas
# error: %s with an int
```

</td><td>

```yaml
# $Values = {replicas: 3}
!bind
$Name: !format
  - "%d"
  - !ref $Values.replicas
# $Name = 3
```

</td></tr>
<tr><td>

```yaml
# $Values = {env: prod, name: api}
!bind
$Name: !format
  - "%s-%s"
  - $Values.env
  - $Values.name
# $Name = $Values.env-$Values.name
```

</td><td>

```yaml
# $Values = {env: prod, name: api}
!bind
$Name: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
# $Name = prod-api
```

</td></tr>
</table>

## Omit

`$Name?: !format` / `name?: !format` ↔ an omit-capable argument. One omit argument drops the whole bind / key (like [`!concat`](concat.md)). `$yield?: !format` + omit → skip that iteration.

```yaml
# $Values = {}
$Fmt?: !format
  - "%s-app"
  - !ref $Values.name?
# no $Fmt
```

## See also

- [`!join`](join.md)
- [`!emit-range`](emit-range.md)
- [`!int`](int.md)
- [`!float`](float.md)

## Comparison with Helm

`!format` is Go `fmt` as a **value** (bind or a field). Type mismatch is an error, not `%!s`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {env: prod, name: api}
name: {{ printf "%s-%s" (required "env" .Values.env) (required "name" .Values.name) }}
# name: prod-api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {env: prod, name: api}
!validation
$rules:
  - !is-not-empty $Values.env?
  - !is-not-empty $Values.name?
$fail: "env"
---
!emit
name: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
# name: prod-api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {host: h, port: 80}
addr: {{ printf "%s:%d" .Values.host .Values.port }}
# addr: h:80
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {host: h, port: 80}
!emit
addr: !format
  - "%s:%d"
  - !ref $Values.host
  - !ref $Values.port
# addr: h:80
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `port` is int. Wrong operand type is `%!s` in Helm, an error in knarr.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
ann: {{ printf "app=%q" (required "name" .Values.name) }}
# ann: app="api"
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
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
# ann: app="api"
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $i = 3
name: {{ printf "w-%04d" $i }}
# name: w-0003
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `$i` is a `range` local. Knarr `$I` is a bind from `!range`. The snippets are not whole programs.

</td></tr>
</table>
