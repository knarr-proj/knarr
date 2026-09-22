# `!bool`

Coerce to **bool**.

## Syntax

```yaml
# $Values = {enabled: "true"}
enabled?: !bool $Values.enabled?
# enabled: true
```

- Already bool: unchanged.
- String: **only** `"true"` / `"false"` (lowercase).
- Errors: `yes` / `on` / `TRUE` / `"1"` / int / float.

## Examples

### Flag from string values

```yaml
# $Values = {ha: "true", name: api}
!bind
$HA: !bool $Values.ha
---
!emit?
$when: !ref $HA
$yield:
  kind: PodDisruptionBudget
  name: !ref $Values.name
# kind: PodDisruptionBudget / name: api
```

### Optional

```yaml
# $Values = {}
$On?: !bool $Values.featureGate?
# no $On
```

### Keep YAML bools as bools

```yaml
# $Values = {service: {enabled: true}}
$Values:
  service:
    enabled: true
# $Values.service.enabled = true
```

Already a bool — `!ref $Values.service.enabled` is enough; `!bool` is redundant.

### Ingress TLS from a string flag

```yaml
# $Values = {ingress: {tls: "true", host: a.example, secretName: tls}}
!bind
$TlsOn: !bool $Values.ingress.tls
---
!emit
tls?: !match
  $if: !ref $TlsOn
  $yield:
    - hosts:
        - !ref $Values.ingress.host
      secretName: !ref $Values.ingress.secretName
# tls: [{hosts: [a.example], secretName: tls}]
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$HA: !bool "yes"
# error: !bool does not accept yes / on / TRUE
```

</td><td>

```yaml
# $Values = {}
!bind
$HA: !bool "true"
# $HA = true
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$On: !bool 1
# error: int is not true
```

</td><td>

```yaml
# $Values = {}
!bind
$On: !bool "true"
# $On = true
```

</td></tr>
<tr><td>

```yaml
# $Values = {ha: "true"}
!bind
$On: !expr "bool($Values.ha)"
# error: no bool() in !expr
```

</td><td>

```yaml
# $Values = {ha: "true"}
!bind
$On: !bool $Values.ha
# $On = true
```

</td></tr>
</table>

## See also

- [`!not`](not.md)
- [`$when`](when.md)

## Comparison with Helm

`!bool` accepts a bool or lowercase `"true"` / `"false"` only — not `yes` / `1`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {ha: "true"}
{{- if eq .Values.ha "true" }}
kind: PodDisruptionBudget
{{- end }}
# kind: PodDisruptionBudget
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {ha: "true"}
!emit?
$when: !expr "$Values.ha == 'true'"
$yield:
  kind: PodDisruptionBudget
# kind: PodDisruptionBudget
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `$yield` is the whole document (`kind` only).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}}
enabled: {{ required "enabled" .Values.service.enabled }}
# enabled: true
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}}
!validation
$rules:
  - !is-not-empty $Values.service.enabled?
$fail: "enabled"
---
!emit
enabled: !ref $Values.service.enabled
# enabled: true
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {ingress: {tls: true}}
{{- if .Values.ingress.tls }}
kind: Ingress
{{- end }}
# kind: Ingress
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {ingress: {tls: true}}
!emit?
$when: !is-not-empty $Values.ingress?.tls?
$yield:
  kind: Ingress
# kind: Ingress
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. Not `!bool` (that is coerce, not truthiness).

</td></tr>
</table>
