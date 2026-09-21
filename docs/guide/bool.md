# `!bool`

Coerce to **bool**.

## Syntax

```yaml
enabled?: !bool $Values?.enabled
```

- Already bool: unchanged.
- String: **only** `"true"` / `"false"` (lowercase).
- Errors: `yes` / `on` / `TRUE` / `"1"` / int / float.

## Examples

### Flag from string values

```yaml
!bind
$HA: !bool $Values.ha
!emit
$when: !ref $HA
$then:
  kind: PodDisruptionBudget
  name: !ref $Values.name
$else: ""
```

### Optional

```yaml
$On?: !bool $Values?.featureGate
```

### Keep YAML bools as bools

```yaml
$Values:
  service:
    enabled: true
```

Already a bool — `!ref $Values.service.enabled` is enough; `!bool` is redundant.

### Ingress TLS from a string flag

```yaml
!bind
$TlsOn: !bool $Values.ingress.tls
!emit
tls?: !match
  $if: !ref $TlsOn
  $then:
    - hosts:
        - !ref $Values.ingress.host
      secretName: !ref $Values.ingress.secretName
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$HA: !bool "yes"
# !bool does not accept yes / on / TRUE
```

</td><td>

```yaml
!bind
$HA: !bool "true"
# only a bool or lowercase true / false
```

</td></tr>
<tr><td>

```yaml
!bind
$On: !bool 1
# int is an error; 1 is not true
```

</td><td>

```yaml
!bind
$On: !bool "true"
# use a real bool or the strings "true" / "false"
```

</td></tr>
<tr><td>

```yaml
!bind
$On: !expr "bool($Values.ha)"
# no bool() in !expr
```

</td><td>

```yaml
!bind
$On: !bool $Values.ha
# coerce with !bool
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
{{- if eq .Values.ha "true" }}
kind: PodDisruptionBudget
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$HA: !bool $Values.ha
!emit
$when: !ref $HA
$then:
  kind: PodDisruptionBudget
  name: !ref $Values.name
$else: ""
```

</td></tr>
<tr><th>Difference</th><td>

Helm `eq ... "true"` compares strings; knarr `!bool` then `$when`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
enabled: {{ .Values.service.enabled }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
enabled: !ref $Values.service.enabled
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.ingress.tls }}
kind: Ingress
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$TlsOn: !bool $Values.ingress.tls
```

</td></tr>
<tr><th>Difference</th><td>

Helm `if` is truthiness (any non-empty); knarr `!bool` only accepts a bool or `"true"` / `"false"`.

</td></tr>
</table>
