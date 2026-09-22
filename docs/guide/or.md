# `!or`

Boolean OR of a sequence of predicates. All children are evaluated (no short-circuit).

## Syntax

```yaml
# $Values = {tls: false, cert: ""}
$when: !or
  - !is-empty $Values.tls?
  - !is-empty $Values.cert?
# true
```

Same child rules as [`!and`](and.md).

## Examples

### Run if either flag

```yaml
# $Values = {ingress: {enabled: true}}
$when: !or
  - !is-not-empty $Values.ingress?.enabled?
  - !is-not-empty $Values.mesh?.enabled?
# true
```

### Skip TLS only if both missing

```yaml
# $Values = {}
$when: !and
  - !is-empty $Values.tls?
  - !is-empty $Values.cert?
# true
```

(`!or` of empties is “at least one missing”.)

### Default-on in expr instead

```yaml
# $Values = {ingress: {enabled: true}}
$when: !expr "$Values.ingress?.enabled || $Values.mesh?.enabled ?? false"
# true
```

`true || omit` is true. The default is used only if the whole `||` has no result.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {ingress: {enabled: true}, mesh: {enabled: false}}
!emit?
$when: !expr "or($Values.ingress.enabled, $Values.mesh.enabled)"
$then:
  kind: Ingress
# error: no or() in !expr
```

</td><td>

```yaml
# $Values = {ingress: {enabled: true}, mesh: {enabled: false}, name: api}
!emit?
$when: !expr "$Values.ingress.enabled || $Values.mesh.enabled"
$then:
  kind: Ingress
  name: !ref $Values.name
# kind: Ingress
```

</td></tr>
<tr><td>

```yaml
# $Values = {ingress: {enabled: true}, mesh: {enabled: false}}
!emit?
$when: !not !or
  - !ref $Values.ingress.enabled
  - !ref $Values.mesh.enabled
$then:
  kind: Ingress
# error: !not does not wrap !or
```

</td><td>

```yaml
# $Values = {ingress: {enabled: false}, mesh: {enabled: false}, name: api}
!emit?
$when: !expr "!($Values.ingress.enabled || $Values.mesh.enabled)"
$then:
  kind: Ingress
  name: !ref $Values.name
# kind: Ingress
```

</td></tr>
</table>

## See also

- [`!and`](and.md)
- [`$when`](when.md)
- [`!match`](match.md)
- [`!is-empty`](is-empty.md)

## Comparison with Helm

Tag `!or` is boolean only (not coalesce). All children run.

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

Same result. Helm `if` ≡ `!is-not-empty`. `!or` evaluates every child.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
host: {{ or .Values.host "localhost" }}
# host: localhost
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit
host: !match
  $if: !is-empty $Values.host?
  $then: localhost
  $else: !ref $Values.host
# host: localhost
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Go `or x y` is if x then x else y. Empty → fallback ≡ `!match` + `!is-empty` (same as `| default`). Not tag `!or`. Not `??`. Not `host?: !skip-empty`. See [`!match`](match.md).

</td></tr>
</table>
