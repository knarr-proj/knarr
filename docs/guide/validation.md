# `!validation`

A **check document**. It never emits a manifest. Run after all binds, before emit.

## Syntax

```yaml
---
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
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set Values.name"
```

### Forbid a legacy flag

Rules are **must-true**. When the flag should be absent:

```yaml
---
!validation
$rules:
  - !expr "!($Values?.legacy ?? false)"
$fail: "remove Values.legacy"
```

### Warning, still render

```yaml
---
!bind
$Msg: !format
  - "using default image for %s"
  - !ref $Values.name
---
!validation
$rules:
  - !expr "$Values?.image"
$warning: !ref $Msg
```

If `image` is omit/false, warn and continue. (Presence of a non-empty string is truthy for this rule.)

### Several documents

Multiple `!validation` documents run in file order. `$warning` documents can all fire. The first `$fail` stops the render.

## Common mistakes

**Wrong — `required` inside `!expr`**

```yaml
$rules:
  - !expr "required($Values.name)"
```

**Right — `!not-empty` / `!validation`.**

**Wrong — both `$fail` and `$warning`**

Pick one.

**Wrong — `$rules` must-true vs `!empty` for required**

`!empty` as a rule means “this **must** be empty”. Required values: **`!not-empty`**.

## See also

- [`!not-empty`](not-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!validation` is `required` / `fail` as a document, not a pipeline function.

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
name: {{ required "set name" .Values.name }}
```

</td><td>

```yaml
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set Values.name"
```

</td><td>

Helm fails at that pipe; knarr `!validation` is a document that runs `$rules`.

</td></tr>
<tr><td>

```gotemplate
legacy: {{ .Values.legacy }}
{{- if .Values.legacy }}
{{- fail "remove legacy" }}
{{- end }}
```

</td><td>

```yaml
---
!validation
$rules:
  - !expr "!($Values?.legacy ?? false)"
$fail: "remove Values.legacy"
```

</td><td>

Helm `fail` is inline; knarr `$fail` is on the validation document. Helm `if .Values.legacy` is truthiness; knarr uses a bool `!expr`.

</td></tr>
<tr><td>

```gotemplate
image: {{ .Values.image }}
{{- if not .Values.image }}
{{- /* warn */}}
{{- end }}
```

</td><td>

```yaml
---
!validation
$rules:
  - !expr "$Values?.image"
$warning: "using default image"
```

</td><td>

Helm has no first-class warning from `if`; knarr `$warning` does not fail the render.

</td></tr>
</table>
