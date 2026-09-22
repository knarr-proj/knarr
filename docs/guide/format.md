# `!format`

Format a string with **Go `fmt`** verbs (not Rust `{}`). Bind-only.

## Syntax

```yaml
# $Env = prod; $App = api
$Name: !format
  - "%s-%s"
  - !ref $Env
  - !ref $App
# $Name = prod-api
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
# $Values = {env: prod, name: api}
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
!emit
name: !ref $FullName
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
# $I = 3
$WorkerId: !format
  - "w-%04d"
  - !ref $I
# $WorkerId = w-0003
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
!emit
name: !format
  - "%s-svc"
  - !ref $Values.name
# error: !format is bind-only
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
---
!emit
name: !ref $Name
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

`$Name?: !format` ↔ an omit-capable argument. One omit argument drops the whole bind (like [`!concat`](concat.md)).

```yaml
# $Values = {}
$Fmt?: !format
  - "%s-app"
  - !ref $Values.name?
# no $Fmt
```

## See also

- [`!join`](join.md)
- [`!int`](int.md)
- [`!float`](float.md)

## Comparison with Helm

`!format` is bind-only Go `fmt`. Type mismatch is an error, not `%!s`.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Wrong operand type is `%!s` in Helm, an error in knarr. Bind-only `!format` is not this Helm stdout unless types already match.

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
