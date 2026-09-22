# `!and`

Boolean AND of a **sequence** of predicates. Evaluates **all** children (no short-circuit).

## Syntax

```yaml
# $Values = {service: {enabled: true}, replicas: 3}
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
# true
```

Children: `!ref` / `!not` / `!is-empty` / `!is-not-empty` / `!and` / `!or` / `!expr` (bool) / bool literal. ≥1 element. Omit child is an error.

Prefer `&&` in [`!expr`](expr.md) when both sides are already bool paths.

## Examples

### Service when enabled and HA

```yaml
# $Values = {service: {enabled: true}, replicas: 3}
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
# true
```

### Filter ready workers

```yaml
# $W = {ports: [80], enabled: true}
$filter: !and
  - !is-not-empty $W.ports?
  - !ref $W.enabled
# true
```

### Validation bundle

```yaml
# $Values = {name: api, image: x}
$rules:
  - !and
    - !is-not-empty $Values.name?
    - !is-not-empty $Values.image?
# true
```

(Or two `$rules` items — first failure wins anyway.)

### Nested

```yaml
# $Values = {service: {enabled: true}}
$when: !and
  - !or
    - !is-empty $Values.tls?
    - !is-not-empty $Values.cert?
  - !ref $Values.service.enabled
# true
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!emit?
$when: !and []
$yield?:
  kind: Service
# error: empty !and
```

</td><td>

```yaml
# $Values = {service: {enabled: true}, replicas: 3, name: api}
!emit?
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
$yield?:
  kind: Service
  name: !ref $Values.name
# kind: Service
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit?
$when: !and
  - !ref $Values.enabled?
$yield?:
  kind: Service
# error: omit child is not a bool
```

</td><td>

```yaml
# $Values = {enabled: true, name: api}
!emit?
$when: !ref $Values.enabled? ?? false
$yield?:
  kind: Service
  name: !ref $Values.name
# kind: Service
```

</td></tr>
<tr><td>

```yaml
# $Values = {service: {enabled: true}, tls: true}
!emit?
$when: !expr "and($Values.service.enabled, $Values.tls)"
$yield?:
  kind: Service
# error: no and() in !expr
```

</td><td>

```yaml
# $Values = {service: {enabled: true}, tls: true, name: api}
!emit?
$when: !expr "$Values.service.enabled && $Values.tls"
$yield?:
  kind: Service
  name: !ref $Values.name
# kind: Service
```

</td></tr>
</table>

## See also

- [`!or`](or.md)
- [`!expr`](expr.md)
- [`!is-not-empty`](is-not-empty.md)
- [`!skip-empty`](skip-empty.md)

## Comparison with Helm

Tag `!and` evaluates **every** child. Short-circuit bools use `&&` in `!expr`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}, replicas: 3}
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
# kind: Service
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}, replicas: 3}
!emit?
$when: !and
  - !is-not-empty $Values.service?.enabled?
  - !expr "$Values.replicas? > 1 ?? false"
$yield?:
  kind: Service
# kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is int/float. Helm `if` ≡ `!is-not-empty`. Helm `gt` ≡ `>`. `!and` evaluates every child. Helm `gt` may coerce a numeric string; knarr `>` of a string is a type error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [{name: w, ports: [80], enabled: true}]}
env:
{{- range .Values.workers }}
{{- if and .ports .enabled }}
  - name: {{ .name }}
{{- end }}
{{- end }}
# env: [{name: w}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {workers: [{name: w, ports: [80], enabled: true}]}
!emit
env?: !foreach
  $over: !ref $Values.workers?
  $as: $Worker
  $filter: !and
    - !is-not-empty $Worker.ports?
    - !is-not-empty $Worker.enabled?
  $yield?:
    name: !ref $Worker.name
# env: [{name: w}]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. Item is a mapping (`- name:`), not a string. `!and` stays boolean (children are `!is-not-empty`, not the raw list).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api, image: img}
name: {{ and .Values.name .Values.image }}
# name: img
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api, image: img}
!emit
name?: !match
  $if: !is-not-empty $Values.name?
  $yield: !skip-empty $Values.image?
# name: img
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Go `and x y` is if x then y else x. `$yield: !skip-empty` on a `?:` `!match`. Not tag `!and`. See [`!skip-empty`](skip-empty.md).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}, tls: {host: a}}
{{- if and .Values.service.enabled .Values.tls }}
kind: Service
{{- end }}
# kind: Service
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}, tls: {host: a}}
!emit?
$when: !and
  - !is-not-empty $Values.service?.enabled?
  - !is-not-empty $Values.tls?
$yield?:
  kind: Service
# kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty` (a present non-empty map is true). Not the field snippet `tls?:`. See [`!skip-empty`](skip-empty.md) for `if` on a field.

</td></tr>
</table>
