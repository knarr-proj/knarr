# `!match`

Field-level **if / else**. The tag sits on a **value**, not on a key.

## Syntax

```yaml
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
```

- Mapping with `$if` + `$then`, optional `$else`.
- Not a sequence of branches. Else-if = `$else: !match`.
- `$if` is a bool predicate (same family as `$when`): tags or YAML `true` / `false`. Omit from `?.` without `??` is an error (not `false`); use `?? false` or [`!empty`](empty.md) / [`!not-empty`](not-empty.md).
- Short-circuit: false `$if` does not evaluate `$then`.
- One sort: `$then` and `$else` (when present) must match.
- **Omit the key:** `affinity?: !match` **without** `$else` — false `$if` omits.
- `affinity: !match` without `$else` is an error if `$if` is false (no value).
- `$if?:` / `$then?:` / `$else?:` are errors.

## Examples

### replicas fallback

```yaml
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
```

### topologySpread only when HA

```yaml
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $then:
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          app: !ref $Values.name
```

No `$else` + `?:` → key absent when replicas ≤ 1.

### Drop empty list

An empty `[]` is a value. To omit the key when the list is missing **or** `[]`:

```yaml
initContainers?: !match
  $if: !not-empty $Values?.init
  $then: !ref $Values.init
```

Use [`!not-empty`](not-empty.md), not `initContainers?: !empty …`.

### Else-if (Ingress vs ClusterIP)

```yaml
type: !match
  $if: !ref $Values.ingress.enabled
  $then: ClusterIP
  $else: !match
    $if: !ref $Values.loadBalancer
    $then: LoadBalancer
    $else: ClusterIP
```

### Inside `$yield`

`!match` is a normal value: it may appear in foreach yield, bind, `$then`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
replicas !if: !ref $Values.ha
# tags belong on the value, not on the key
```

</td><td>

```yaml
!emit
replicas: !match
  $if: !ref $Values.ha
  $then: 3
  $else: 1
# tag the value !match
```

</td></tr>
<tr><td>

```yaml
!emit
type: !match
  - $if: !ref $Values.ingress.enabled
    $then: ClusterIP
  - $if: !ref $Values.loadBalancer
    $then: LoadBalancer
# !match is not a list of $if entries
```

</td><td>

```yaml
!emit
type: !match
  $if: !ref $Values.ingress.enabled
  $then: ClusterIP
  $else: !match
    $if: !ref $Values.loadBalancer
    $then: LoadBalancer
    $else: ClusterIP
# nest $else: !match
```

</td></tr>
<tr><td>

```yaml
!emit
replicas: !match
  $when: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
# !match uses $if, not $when
```

</td><td>

```yaml
!emit
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
# $when is for !emit / !emit-foreach
```

</td></tr>
</table>

## See also

- [`$when`](when.md)
- [Omit](omit.md)
- [`!pick`](pick.md)

## Comparison with Helm

`!match` is `if` / `else` on a **value**. Document-level if is `$when`.

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ if gt .Values.replicas 0 }}{{ .Values.replicas }}{{ else }}1{{ end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if gt .Values.replicas 1 }}
topologySpreadConstraints:
  - maxSkew: 1
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $then:
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
```

</td></tr>
<tr><th>Difference</th><td>

Helm `if` just does not print the key; knarr `!match` without `$else` is omit (pair with `?:`).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
type: {{ if .Values.ingress.enabled }}ClusterIP{{ else if .Values.loadBalancer }}LoadBalancer{{ else }}ClusterIP{{ end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
type: !match
  $if: !ref $Values.ingress.enabled
  $then: ClusterIP
  $else: !match
    $if: !ref $Values.loadBalancer
    $then: LoadBalancer
    $else: ClusterIP
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
