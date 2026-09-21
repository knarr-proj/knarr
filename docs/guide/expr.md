# `!expr`

A formula: operators, dyn-index, or `$Name` inside a list/map literal. **No function calls.** Constants without computation are YAML (or [`!ref`](ref.md)). A field with no operator is [`!ref`](ref.md) — both tags stay.

## Syntax

```yaml
$Show: !expr "$Values.service.enabled && $Values.replicas > 1"
```

Tagged **scalar** only (not `{ }` / `[ ]` as the tag body). Quotes are **YAML 1.2**: `[` `{` `,` `: ` need quotes anywhere in the scalar, not only at line start. `/` and `||` / `?? false` do not.

The lexer strips `$` from binding names outside quotes. You still **write** `$Values`.

The formula (left of `??`, or the whole scalar) must contain **at least one of**: an operator (`&&` `||` `!` `==` `!=` `<` `>` `<=` `>=` `+ - * /`), dyn-index `$Map[$Key]`, or `$Name` inside a list/map literal. Otherwise it is an error — no computation. The CLI says the tag should be [`!ref`](ref.md) (or a YAML literal). An operator or dyn-index in [`!ref`](ref.md) says the tag should be `!expr`.

Allowed inside a formula: number/bool/string literals, `[80, $Port]`, `{'app': $Values.name}`, `$Name` paths including `?.`, those operators. One top-level `??` defaults the **whole** formula if it has no result (omit). Do not bind optional fields first just to hide `?.`. A path with no operator (even with `??`) is an error — use [`!ref`](ref.md). `true` / `1` / `[80, 443]` / `{'k': 1}` as the whole `!expr` are errors — use YAML.

Forbidden: `ident(`, ternary `c ? t : f`, string/list `+`.

Dynamic index: `$Map[$Key]` where the index is `$Name` or `$Name.ident` — not a formula inside `[ ]`.

## Examples

### Enable a Service

```yaml
$ShowSvc: !expr "$Values.service.enabled && $Values.replicas > 1"
```

### replicas + 1

```yaml
replicas: !expr "$Values.replicas + 1"
```

### Default if a value is missing

`??` applies to the **entire** formula. `+` needs both sides. `||` / `&&` only demand what they need: `true || omit` is `true`, and the default is not used. That demand is fixed. `||` is **bool**, not a string coalesce — names are [`!pick`](pick.md) or [`!ref`](ref.md) `??`. Different defaults per operand: two [`!ref`](ref.md) binds, then add.

`replicas: !expr "$Values?.n + 1"` is the same pair error as `replicas: !ref $Values?.n`. Use `replicas?:` or `?? 1`. Do not forbid `?.` just because there is no `??`.

```yaml
$sum: !expr "$Values?.a + $Values?.b ?? 0"
$when: !expr "$Values?.ingress.enabled || $Values?.mesh.enabled ?? false"
$when: !expr "$Values?.a || $Values?.b || $Values?.c ?? false"
$A: !ref $Values?.a ?? 0
$B: !ref $Values?.b ?? 1
$sum: !expr "$A + $B"
```

A path with no operator and `??` is an error. Write [`!ref`](ref.md). `??` on [`!not`](not.md) is an error: default the path with `!ref`, then negate.

### Labels map literal

A map or list in `!expr` must mention `$Name` (or sit next to an operator). A constant list is YAML.

```yaml
$Labels: !expr "{'app': $Values.name, 'env': $Values.env}"
$Ports: [80, 443]
```

Keys in map literals must be quoted strings.

### Image by worker name

```yaml
image: !expr "$Values.images[$Worker.name]"
```

### Int + float (CPU)

```yaml
$Limit: !expr "$Values.replicas + 0.5"
```

Result is float. `0.1 + 0.2` is IEEE, not decimal `0.3`. An operator counts as computation even without `$`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$n: !expr "len($Values.workers)"
# no len() in !expr
```

</td><td>

```yaml
!bind
$n: !len $Values.workers
# length is the !len tag
```

</td></tr>
<tr><td>

```yaml
!emit
name: !expr "$Values?.fullnameOverride || $Values?.name ?? 'app'"
# || is bool, not a name coalesce; string → type error
```

</td><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullnameOverride
  - !ref $Values?.name
  - app
# two candidates: !ref … ?? ; three+: !pick
```

</td></tr>
<tr><td>

```yaml
!emit
replicas: !expr "$Values?.n + 1"
# omit on a required key is a pair error (same as !ref)
```

</td><td>

```yaml
!emit
replicas?: !expr "$Values?.n + 1"
replicas: !expr "$Values?.n + 1 ?? 1"
# ?: omits; ?? keeps a number
```

</td></tr>
<tr><td>

```yaml
!bind
$Ports: !expr "$Values?.ports ?? [80, 443]"
# no computation: use !ref
```

</td><td>

```yaml
!bind
$Ports: !ref "$Values?.ports ?? [80, 443]"
# path + default is !ref
```

</td></tr>
<tr><td>

```yaml
!bind
$sum: !expr "($Values?.a ?? 0) + ($Values?.b ?? 1)"
# ?? is not inside the formula
```

</td><td>

```yaml
!bind
$A: !ref $Values?.a ?? 0
$B: !ref $Values?.b ?? 1
$sum: !expr "$A + $B"
# one ?? per !ref; then add
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !expr "true"
# no computation: use YAML
```

</td><td>

```yaml
!emit
$when: true
# a constant bool is YAML
```

</td></tr>
<tr><td>

```yaml
!bind
$Kind: !expr $Values.kind: Deployment
$Ports: !expr $Values.x || $Values.y ?? [80]
# : space, [ ] , need YAML quotes anywhere
```

</td><td>

```yaml
!bind
$Kind: !expr '$Values.kind == "Deployment"'
$Show: !expr $Values.x || $Values.y
$Ports: !expr "$Values.x || $Values.y ?? [80]"
# quotes = YAML 1.2, not line start
```

</td></tr>
<tr><td>

```yaml
!bind
$Ports: !expr "[80, 443]"
# constant list is YAML
```

</td><td>

```yaml
!bind
$Ports: [80, 443]
# no $ and no operator → YAML
```

</td></tr>
<tr><td>

```yaml
!bind
$name: !expr "$Values.name + '-svc'"
# + is not string concat
```

</td><td>

```yaml
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
# string format is bind-only !format
```

</td></tr>
<tr><td>

```yaml
!bind
$x: !expr "$On ? 1 : 0"
# no ternary in !expr
```

</td><td>

```yaml
!emit
replicas: !match
  $if: !ref $On
  $then: 1
  $else: 0
# branch on a value with !match
```

</td></tr>
<tr><td>

```yaml
!bind
$bad: !expr "{app: $Values.name}"
# unquoted key app: is not valid in !expr
```

</td><td>

```yaml
!bind
$Labels: !expr "{'app': $Values.name}"
# object keys in !expr are quoted
```

</td></tr>
<tr><td>

```yaml
!emit
replicas: !expr "Values.replicas"
# identifiers in !expr need $
```

</td><td>

```yaml
!emit
replicas: !ref $Values.replicas
# a path with no operator is !ref
```

</td></tr>
</table>

## See also

- [`!ref`](ref.md)
- [Omit](omit.md)
- [`!format`](format.md)
- [`!len`](len.md)
- [`!float`](float.md)

## Comparison with Helm

`!expr` is operators, dyn-index, or a list/map that mentions `$`. One `??` may default the whole formula. A bare path is [`!ref`](ref.md). A constant is YAML. No `len()`, `printf()`, `int()`.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `and` / `gt` of missing is false/empty. Knarr `&&` of omit is an error. No `len()` / `printf()` in `!expr`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ add (required "replicas" .Values.replicas) 1 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
replicas: !expr "$Values.replicas + 1"
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `or` of missing is empty/false. Knarr omit is not false. `true || omit` is true and does not take `?? false`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
image: {{ required "image" (index .Values.images .name) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
image: !expr "$Values.images[$Worker.name]"
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ required "name" .Values.name }}-svc
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
---
!emit
name: !ref $Name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Knarr `+` is not string concat — `!format` in bind.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Values.name }}-svc
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible as `!expr "$Values.name + '-svc'"`.

</td></tr>
<tr><th>Difference</th><td>

No string `+` in `!expr`. Use `!format` (bind-only).

</td></tr>
</table>
