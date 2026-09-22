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
$when: !or
  - !is-not-empty $Values.ingress?.enabled?
  - !is-not-empty $Values.mesh?.enabled?
```

### Skip TLS only if both missing

```yaml
$when: !and
  - !is-empty $Values.tls?
  - !is-empty $Values.cert?
```

(`!or` of empties is “at least one missing”.)

### Default-on in expr instead

```yaml
$when: !expr "$Values.ingress?.enabled || $Values.mesh?.enabled ?? false"
```

`true || omit` is true. The default is used only if the whole `||` has no result.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit?
$when: !expr "or($Values.ingress.enabled, $Values.mesh.enabled)"
$then:
  kind: Ingress
# no or() in !expr
```

</td><td>

```yaml
!emit?
$when: !expr "$Values.ingress.enabled || $Values.mesh.enabled"
$then:
  kind: Ingress
  name: !ref $Values.name
# short-circuit bools use ||
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !not !or
  - !ref $Values.ingress.enabled
  - !ref $Values.mesh.enabled
$then:
  kind: Ingress
# !not does not wrap !or
```

</td><td>

```yaml
!emit?
$when: !expr "!($Values.ingress.enabled || $Values.mesh.enabled)"
$then:
  kind: Ingress
  name: !ref $Values.name
# rewrite with !expr, or !and + !not
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
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !or
  - !is-not-empty $Values.ingress?.enabled?
  - !is-not-empty $Values.mesh?.enabled?
$then:
  kind: Ingress
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. `!or` evaluates every child.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ or .Values.host "localhost" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
host: !match
  $if: !is-empty $Values.host?
  $then: localhost
  $else: !ref $Values.host
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Go `or x y` is if x then x else y. Empty → fallback ≡ `!match` + `!is-empty` (same as `| default`). Not tag `!or`. Not `??`. Not `host?: !skip-empty`. See [`!match`](match.md).

</td></tr>
</table>
