# `!and`

Boolean AND of a **sequence** of predicates. Evaluates **all** children (no short-circuit).

## Syntax

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

Children: `!ref` / `!not` / `!empty` / `!not-empty` / `!and` / `!or` / `!expr` (bool) / bool literal. ≥1 element. Omit child is an error.

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
  - !not-empty $W?.ports
  - !ref $W.enabled
```

### Validation bundle

```yaml
$rules:
  - !and
    - !not-empty $Values?.name
    - !not-empty $Values?.image
```

(Or two `$rules` items — first failure wins anyway.)

### Nested

```yaml
$when: !and
  - !or
    - !empty $Values?.tls
    - !not-empty $Values?.cert
  - !ref $Values.service.enabled
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
$when: !and []
$then:
  kind: Service
$else: ""
# empty !and is an error
```

</td><td>

```yaml
!emit
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
$then:
  kind: Service
  name: !ref $Values.name
$else: ""
# !and needs at least one bool child
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !and
  - !ref $Values?.enabled
$then:
  kind: Service
$else: ""
# omit child is not a bool
```

</td><td>

```yaml
!emit
$when: !ref $Values?.enabled ?? false
$then:
  kind: Service
  name: !ref $Values.name
$else: ""
# use ?? false, or a required path
```

</td></tr>
<tr><td>

```yaml
!emit
$when: !expr "and($Values.service.enabled, $Values.tls)"
$then:
  kind: Service
$else: ""
# no and() in !expr
```

</td><td>

```yaml
!emit
$when: !expr "$Values.service.enabled && $Values.tls"
$then:
  kind: Service
  name: !ref $Values.name
$else: ""
# short-circuit bools use &&
```

</td></tr>
</table>

## See also

- [`!or`](or.md)
- [`!expr`](expr.md)

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `and` of missing is false. Knarr missing path is an error. `!and` evaluates every child.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `and` is truthiness. Knarr `!and` is boolean only. Empty range: Helm `env:` null; knarr `env: []`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ and .Values.name .Values.image }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `and` of strings returns the last truthy value. Knarr `!and` is boolean only.

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

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `and` treats a present map as true. Knarr `&&` needs bools.

</td></tr>
</table>
