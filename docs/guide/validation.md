# `!validation`

A **check document**. It never emits a manifest. Run after all binds, before emit.

## Syntax

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set Values.name"
# stdout empty
```

XOR: **either** `$fail` **or** `$warning`, not both, not neither.

| Key | On violation |
|-----|----------------|
| `$fail` | stderr message, **no stdout**, exit **1**, later validation/emit skipped |
| `$warning` | stderr message, emit continues, exit **0** if nothing else fails |

`$rules` is a non-empty sequence of predicates. Each rule is **must-true**: omit or `false` is a violation; `true` or any other concrete value (including `""`) passes.

Use [`!is-not-empty`](is-not-empty.md) for “required string”, not `!is-empty`.

## Examples

### Required name

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set Values.name"
# stdout empty
```

### Forbid a legacy flag

Rules are **must-true**. When the flag should be absent:

```yaml
# $Values = {}
!bind
$Legacy: !ref $Values.legacy? ?? false
---
!validation
$rules:
  - !not $Legacy
$fail: "remove Values.legacy"
# stdout empty
```

### Warning, still render

```yaml
# $Values = {name: api}
!bind
$Msg: !format
  - "using default image for %s"
  - !ref $Values.name
---
!validation
$rules:
  - !ref $Values.image?
$warning: !ref $Msg
# stdout empty
```

If `image` is omit/false, warn and continue. (Presence of a non-empty string is truthy for this rule.)

### Several documents

Multiple `!validation` documents run in file order. `$warning` documents can all fire. The first `$fail` stops the render.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !expr "required($Values.name)"
$fail: "set name"
# error: no required() in !expr
```

</td><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
# stdout empty
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
$warning: "missing name"
# error: $fail and $warning cannot both be set
```

</td><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
# stdout empty
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-empty $Values.name?
$fail: "set name"
# error: !is-empty as a rule means the value must be empty
```

</td><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
# stdout empty
```

</td></tr>
</table>

## See also

- [`!is-not-empty`](is-not-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!validation` is Helm `required` / `fail` as a document: on `$fail`, no stdout, stderr only. A successful `required` still prints in Helm — knarr prints with `!emit` / `!ref`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ required "set name" .Values.name }}
# name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set name"
---
!emit
name: !ref $Values.name
# name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Failed `required` = `$fail` (no stdout). Success prints `name:`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {legacy: true}
legacy: {{ .Values.legacy }}
{{- if .Values.legacy }}
{{- fail "remove legacy" }}
{{- end }}
# error: remove legacy
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm prints `legacy:` then may `fail` on truthiness. Knarr `!validation` does not print the field.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {image: ""}
image: {{ .Values.image }}
{{- if not .Values.image }}
{{- /* warn */}}
{{- end }}
# image:
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm has no first-class warning. Knarr `$warning` does not print `image:`.

</td></tr>
</table>
