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
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

### Filter ready workers

```yaml
$filter: !and
  - !is-not-empty $W.ports?
  - !ref $W.enabled
```

### Validation bundle

```yaml
$rules:
  - !and
    - !is-not-empty $Values.name?
    - !is-not-empty $Values.image?
```

(Or two `$rules` items — first failure wins anyway.)

### Nested

```yaml
$when: !and
  - !or
    - !is-empty $Values.tls?
    - !is-not-empty $Values.cert?
  - !ref $Values.service.enabled
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit?
$when: !and []
$then:
  kind: Service
# empty !and is an error
```

</td><td>

```yaml
!emit?
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
$then:
  kind: Service
  name: !ref $Values.name
# !and needs at least one bool child
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !and
  - !ref $Values.enabled?
$then:
  kind: Service
# omit child is not a bool
```

</td><td>

```yaml
!emit?
$when: !ref $Values.enabled? ?? false
$then:
  kind: Service
  name: !ref $Values.name
# use ?? false, or a required path
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !expr "and($Values.service.enabled, $Values.tls)"
$then:
  kind: Service
# no and() in !expr
```

</td><td>

```yaml
!emit?
$when: !expr "$Values.service.enabled && $Values.tls"
$then:
  kind: Service
  name: !ref $Values.name
# short-circuit bools use &&
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
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !and
  - !is-not-empty $Values.service?.enabled?
  - !expr "$Values.replicas? > 1 ?? false"
$then:
  kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is int/float. Helm `if` ≡ `!is-not-empty`. Helm `gt` ≡ `>`. `!and` evaluates every child. Helm `gt` may coerce a numeric string; knarr `>` of a string is a type error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.workers }}
{{- if and .ports .enabled }}
  - name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.workers?
  $as: $Worker
  $filter: !and
    - !is-not-empty $Worker.ports?
    - !is-not-empty $Worker.enabled?
  $yield?:
    name: !ref $Worker.name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. Item is a mapping (`- name:`), not a string. `!and` stays boolean (children are `!is-not-empty`, not the raw list).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ and .Values.name .Values.image }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
name?: !match
  $if: !is-not-empty $Values.name?
  $then: !skip-empty $Values.image?
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Go `and x y` is if x then y else x. `$then: !skip-empty` on a `?:` `!match`. Not tag `!and`. See [`!skip-empty`](skip-empty.md).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if and .Values.service.enabled .Values.tls }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !and
  - !is-not-empty $Values.service?.enabled?
  - !is-not-empty $Values.tls?
$then:
  kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty` (a present non-empty map is true). Not the field snippet `tls?:`. See [`!skip-empty`](skip-empty.md) for `if` on a field.

</td></tr>
</table>
