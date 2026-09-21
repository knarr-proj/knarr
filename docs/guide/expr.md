# `!expr`

A formula: operators, paths, list/map literals. **No function calls.**

## Syntax

```yaml
$Show: !expr "$Values.service.enabled && $Values.replicas > 1"
```

Tagged **scalar** only (not `{ }` / `[ ]` as the tag body).

The lexer strips `$` from binding names outside quotes. You still **write** `$Values`.

Allowed: literals (including `[80, 443]` and `{'app': $X}`), `$Name` paths, `&&` `||` `!` `==` `!=` `<` `>` `<=` `>=`, `+ - * /` (int, or float with promotion). One top-level `??` defaults the **whole** formula if it has no result (omit). A field without operators: write [`!ref`](ref.md).

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

`??` applies to the **entire** formula. `+` needs both sides. `||` / `&&` only demand what they need: `true || omit` is `true`, and the default is not used.

```yaml
$sum: !expr "$Values?.a + $Values?.b ?? 0"
$when: !expr "$Values?.ingress.enabled || $Values?.mesh.enabled ?? false"
$when: !expr "$Values?.a || $Values?.b || $Values?.c ?? false"
```

A path with no operator and `??` is the same as [`!ref`](ref.md). Write `!ref`.

### Labels map literal

```yaml
$Labels: !expr "{'app': $Values.name, 'env': $Values.env}"
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

Result is float. `0.1 + 0.2` is IEEE, not decimal `0.3`.

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
!bind
$Ports: !expr "$Values?.ports ?? [80, 443]"
# a field default: write !ref (same result)
```

</td><td>

```yaml
!bind
$Ports: !ref "$Values?.ports ?? [80, 443]"
# no operator → !ref
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
replicas: !expr "$Values.replicas"
# $Values.replicas is the path
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

`!expr` is operators. One `??` may default the whole formula. No `len()`, `printf()`, `int()`.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$ShowSvc: !expr "$Values.service.enabled && $Values.replicas > 1"
!emit
$when: !ref $ShowSvc
$then:
  kind: Service
  name: !ref $Values.name
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `and` / `gt` live in `if`; knarr operators live in `!expr` (no `len()` / `printf()`).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ add .Values.replicas 1 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
replicas: !expr "$Values.replicas + 1"
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

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

```yaml
!emit
$when: !expr "$Values?.ingress.enabled || $Values?.mesh.enabled ?? false"
$then:
  kind: Ingress
  name: !ref $Values.name
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `or` of missing is empty/false; knarr omit is not false. `true || omit` is true and does not take `?? false`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
image: {{ index .Values.images .name }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
image: !expr "$Values.images[$Worker.name]"
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Values.name }}-svc
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Name: !format
  - "%s-svc"
  - !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Helm concatenates strings in the template; knarr `+` is not string concat — use `!format` in bind.

</td></tr>
</table>
