# `!validation`

A **check document**. It never emits a manifest. Run after all binds, before emit.

## Syntax

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set Values.name"
```

XOR: **either** `$fail` **or** `$warning`, not both, not neither.

| Key | On violation |
|-----|----------------|
| `$fail` | stderr message, **no stdout**, exit **1**, later validation/emit skipped |
| `$warning` | stderr message, emit continues, exit **0** if nothing else fails |

`$rules` is a non-empty sequence of predicates. Each rule is **must-true**: omit or `false` is a violation; `true` or any other concrete value (including `""`) passes.

Use [`!not-empty`](not-empty.md) for “required string”, not `!empty`.

## Examples

### Required name

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set Values.name"
```

### Forbid a legacy flag

Rules are **must-true**. When the flag should be absent:

```yaml
!bind
$Legacy: !ref $Values?.legacy ?? false
---
!validation
$rules:
  - !not $Legacy
$fail: "remove Values.legacy"
```

### Warning, still render

```yaml
!bind
$Msg: !format
  - "using default image for %s"
  - !ref $Values.name
---
!validation
$rules:
  - !ref $Values?.image
$warning: !ref $Msg
```

If `image` is omit/false, warn and continue. (Presence of a non-empty string is truthy for this rule.)

### Several documents

Multiple `!validation` documents run in file order. `$warning` documents can all fire. The first `$fail` stops the render.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!validation
$rules:
  - !expr "required($Values.name)"
$fail: "set name"
# no required() in !expr
```

</td><td>

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
# required is !not-empty on $rules
```

</td></tr>
<tr><td>

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
$warning: "missing name"
# $fail and $warning cannot both be set
```

</td><td>

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
# pick $fail or $warning
```

</td></tr>
<tr><td>

```yaml
!validation
$rules:
  - !empty $Values?.name
$fail: "set name"
# !empty as a rule means the value must be empty
```

</td><td>

```yaml
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
# required values use !not-empty
```

</td></tr>
</table>

## See also

- [`!not-empty`](not-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!validation` is `required` / `fail` as a document, not a pipeline function.

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ required "set name" .Values.name }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `required` prints the value or fails. Knarr `!validation` does not print `name`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
legacy: {{ .Values.legacy }}
{{- if .Values.legacy }}
{{- fail "remove legacy" }}
{{- end }}
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
image: {{ .Values.image }}
{{- if not .Values.image }}
{{- /* warn */}}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm has no first-class warning. Knarr `$warning` does not print `image:`.

</td></tr>
</table>
