# `!expr`

A formula: operators, dyn-index, or `$Name` inside a list/map literal. **No function calls.** Constants without computation are YAML (or [`!ref`](ref.md)). A field with no operator is [`!ref`](ref.md) — both tags stay.

## Syntax

```yaml
# $Values = {service: {enabled: true}, replicas: 2}
$Show: !expr "$Values.service.enabled && $Values.replicas > 1"
# true
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
# $Values = {service: {enabled: true}, replicas: 2}
$ShowSvc: !expr "$Values.service.enabled && $Values.replicas > 1"
# true
```

### replicas + 1

```yaml
# $Values = {replicas: 2}
replicas: !expr "$Values.replicas + 1"  # replicas: 3
```

### Default if a value is missing

`??` applies to the **entire** formula. `+` needs both sides. `||` / `&&` only demand what they need: `true || omit` is `true`, and the default is not used. That demand is fixed. `||` is **bool**, not a string coalesce — names are [`!pick`](pick.md) or [`!ref`](ref.md) `??`. Different defaults per operand: two [`!ref`](ref.md) binds, then add.

`replicas: !expr "$Values.n? + 1"` is the same pair error as `replicas: !ref $Values.n?`. Use `replicas?:` or `?? 1`. Do not forbid `?.` just because there is no `??`.

```yaml
# $Values = {a: 1}
$sum: !expr "$Values.a? + $Values.b? ?? 0"  # 1
$when: !expr "$Values.ingress?.enabled || $Values.mesh?.enabled ?? false"  # false
$when: !expr "$Values.a? || $Values.b? || $Values.c? ?? false"  # true
$A: !ref $Values.a? ?? 0
$B: !ref $Values.b? ?? 1
$sum: !expr "$A + $B"  # 1
```

A path with no operator and `??` is an error. Write [`!ref`](ref.md). `??` on [`!not`](not.md) is an error: default the path with `!ref`, then negate.

### Labels map literal

A map or list in `!expr` must mention `$Name` (or sit next to an operator). A constant list is YAML.

```yaml
# $Values = {name: api, env: prod}
$Labels: !expr "{'app': $Values.name, 'env': $Values.env}"
$Ports: [80, 443]
# $Labels: {app: api, env: prod} / $Ports: [80, 443]
```

Keys in map literals must be quoted strings.

### Image by worker name

```yaml
# $Values = {images: {api: img}}
image: !expr "$Values.images[$Worker.name]"  # image: img
```

### Int + float (CPU)

```yaml
# $Values = {replicas: 2}
$Limit: !expr "$Values.replicas + 0.5"
# 2.5
```

Result is float. `0.1 + 0.2` is IEEE, not decimal `0.3`. An operator counts as computation even without `$`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {workers: [a]}
!bind
$n: !expr "len($Values.workers)"
# error: no len() in !expr
```

</td><td>

```yaml
# $Values = {workers: [a]}
!bind
$n: !len $Values.workers
# 1
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!emit
name: !expr "$Values.fullnameOverride? || $Values.name? ?? 'app'"
# error: || is bool, not a name coalesce
```

</td><td>

```yaml
# $Values = {name: api}
!emit
name: !pick
  - !ref $Values.fullnameOverride?
  - !ref $Values.name?
  - app
# name: api
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit
replicas: !expr "$Values.n? + 1"
# error: omit on a required key
```

</td><td>

```yaml
# $Values = {}
!emit
replicas?: !expr "$Values.n? + 1"  # no replicas
replicas: !expr "$Values.n? + 1 ?? 1"  # replicas: 1
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Ports: !expr "$Values.ports? ?? [80, 443]"
# error: no computation: use !ref
```

</td><td>

```yaml
# $Values = {}
!bind
$Ports: !ref "$Values.ports? ?? [80, 443]"
# $Ports: [80, 443]
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!bind
$sum: !expr "($Values.a? ?? 0) + ($Values.b? ?? 1)"
# error: ?? is not inside the formula
```

</td><td>

```yaml
# $Values = {a: 1}
!bind
$A: !ref $Values.a? ?? 0
$B: !ref $Values.b? ?? 1
$sum: !expr "$A + $B"
# $sum: 1
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!emit
$when: !expr "true"
# error: no computation: use YAML
```

</td><td>

```yaml
# $Values = {a: 1}
!emit
$when: true
# true
```

</td></tr>
<tr><td>

```yaml
# $Values = {kind: Deployment, x: true}
!bind
$Kind: !expr $Values.kind: Deployment
$Ports: !expr $Values.x || $Values.y ?? [80]
# error: : space, [ ] , need YAML quotes
```

</td><td>

```yaml
# $Values = {kind: Deployment, x: true}
!bind
$Kind: !expr '$Values.kind == "Deployment"'
$Show: !expr $Values.x || $Values.y
$Ports: !expr "$Values.x || $Values.y ?? [80]"
# $Kind: true / $Show: true / $Ports: true
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!bind
$Ports: !expr "[80, 443]"
# error: constant list is YAML
```

</td><td>

```yaml
# $Values = {a: 1}
!bind
$Ports: [80, 443]
# $Ports: [80, 443]
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!bind
$name: !expr "$Values.name + '-svc'"
# error: + is not string concat
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
# $Name: api-svc
```

</td></tr>
<tr><td>

```yaml
# $On = true
!bind
$x: !expr "$On ? 1 : 0"
# error: no ternary in !expr
```

</td><td>

```yaml
# $On = true
!emit
replicas: !match
  $if: !ref $On
  $then: 1
  $else: 0
# replicas: 1
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!bind
$bad: !expr "{app: $Values.name}"
# error: unquoted key app: is not valid in !expr
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Labels: !expr "{'app': $Values.name}"
# $Labels: {app: api}
```

</td></tr>
<tr><td>

```yaml
# $Values = {replicas: 2}
!emit
replicas: !expr "Values.replicas"
# error: identifiers in !expr need $
```

</td><td>

```yaml
# $Values = {replicas: 2}
!emit
replicas: !ref $Values.replicas  # replicas: 2
```

</td></tr>
</table>

## Omit

One `??` defaults the **whole** formula. Omit from `?.` on `+` needs `??` (both sides). `||` / `&&` only demand what they need. A path with no operator is [`!ref`](ref.md).

```yaml
# $Values = {a: 1}
$sum: !expr "$Values.a? + $Values.b? ?? 0"   # 1
$when: !expr "$Values.a? || $Values.b? ?? false"  # true
```

```yaml
# $Values = {}
$sum: !expr "$Values.a? + $Values.b? ?? 0"   # 0
```

## See also

- [`!ref`](ref.md)
- [`!format`](format.md)
- [`!len`](len.md)
- [`!float`](float.md)

## Comparison with Helm

`!expr` is operators, dyn-index, or a list/map that mentions `$`. One `??` may default the whole formula. A bare path is [`!ref`](ref.md). A constant is YAML. No `len()`, `printf()`, `int()`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}, replicas: 2}
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
# kind: Service
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}, replicas: 2}
!emit?
$when: !and
  - !is-not-empty $Values.service?.enabled?
  - !expr "$Values.replicas? > 1 ?? false"
$then:
  kind: Service
# kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is int/float. Helm `gt` ≡ `>`. Missing `replicas` → omit of `>` → `?? false`. Helm `gt` may coerce a numeric string; knarr `>` of a string is a type error. No `len()` / `printf()` in `!expr`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {replicas: 2}
replicas: {{ add (required "replicas" .Values.replicas) 1 }}
# replicas: 3
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {replicas: 2}
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
replicas: !expr "$Values.replicas + 1"  # replicas: 3
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {ingress: {enabled: true}, mesh: {enabled: false}}
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
# kind: Ingress
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {ingress: {enabled: true}, mesh: {enabled: false}}
!emit?
$when: !or
  - !is-not-empty $Values.ingress?.enabled?
  - !is-not-empty $Values.mesh?.enabled?
$then:
  kind: Ingress
# kind: Ingress
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. Short-circuit bools that are already bool use `||` in `!expr`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {images: {api: img}}
image: {{ required "image" (index .Values.images .name) }}
# image: img
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {images: {api: img}}
!validation
$rules:
  - !is-not-empty $Values.images?
$fail: "image"
---
!emit
image: !expr "$Values.images[$Worker.name]"  # image: img
```

</td></tr>
<tr><th>Difference</th><td>

Same result when the map exists. `required` abort = `$fail`. A missing key in a live map is still a path error in both.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ required "name" .Values.name }}-svc
# name: api-svc
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "name"
---
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
---
!emit
name: !ref $Name  # name: api-svc
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Knarr `+` is not string concat — `!format` in bind.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ .Values.name }}-svc
# name: api-svc
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible as `!expr "$Values.name + '-svc'"`.

</td></tr>
<tr><th>Difference</th><td>

No string `+` in `!expr`. Use `!format` (bind-only).

</td></tr>
</table>
