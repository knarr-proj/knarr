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
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
```

</td><td>

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

</td></tr>
<tr><td>

```gotemplate
{{- if and .ports .enabled }}
```

</td><td>

```yaml
$filter: !and
  - !not-empty $W?.ports
  - !ref $W.enabled
```

</td></tr>
<tr><td>

```gotemplate
{{ and .Values.name .Values.image }}
```

</td><td>

```yaml
$rules:
  - !and
    - !not-empty $Values?.name
    - !not-empty $Values?.image
```

</td></tr>
<tr><td>

```gotemplate
{{- if and .Values.service.enabled .Values.tls }}
```

</td><td>

```yaml
$when: !expr "$Values.service.enabled && $Values.tls"
```

</td></tr>
</table>
