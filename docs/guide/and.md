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

**Wrong — empty `!and []`**

**Wrong — omit child**

```yaml
- !ref $Values?.enabled
```

Use `?? false` in `!expr` or a required path.

**Wrong — `and()` in `!expr`**

Use `&&`.

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

```yaml
---
!emit
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `and` short-circuits; knarr `!and` evaluates every child. Use `&&` in `!expr` to short-circuit.

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
---
!emit
spec:
  containers:
    - env: !foreach
        $over: !ref $Values.workers
        $as: $W
        $filter: !and
          - !not-empty $W?.ports
          - !ref $W.enabled
        $yield:
          name: !ref $W.name
```

</td></tr>
<tr><th>Difference</th><td>

Helm `and` is truthiness; knarr `!and` is boolean only (`!not-empty` for a list).

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
---
!validation
$rules:
  - !and
    - !not-empty $Values?.name
    - !not-empty $Values?.image
```

</td></tr>
<tr><th>Difference</th><td>

Helm `and` of strings returns the last truthy value; knarr `!and` is boolean only.

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
---
!emit
$when: !expr "$Values.service.enabled && $Values.tls"
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `and` vs knarr `&&` in `!expr` (short-circuit). `$Values.tls` must be a bool here.

</td></tr>
</table>
