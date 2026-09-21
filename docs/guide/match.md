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
- `$if` is a bool predicate (same family as `$when`).
- Short-circuit: false `$if` does not evaluate `$then`.
- One sort: `$then` and `$else` (when present) must match.
- **Omit the key:** `affinity?: !match` **without** `$else` — false `$if` omits.
- `affinity: !match` without `$else` is an error if `$if` is false (no value).
- `$if?:` / `$then?:` / `$else?:` are errors.

## Examples

### replicas fallback

```yaml
spec:
  replicas: !match
    $if: !expr "$Values.replicas > 0"
    $then: !ref $Values.replicas
    $else: 1
```

### topologySpread only when HA

```yaml
spec:
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

### Else-if (Ingress vs ClusterIP)

```yaml
spec:
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

**Wrong — tags on keys**

```yaml
replicas !if: ...
```

**Right — tag the value `!match`.**

**Wrong — list of `$if` entries**

```yaml
!match
  - $if: ...
  - $if: ...
```

**Right — nested `$else: !match`.**

**Wrong — `$when` inside `!match`**

Use `$if`.

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
---
!emit
spec:
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
---
!emit
spec:
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
---
!emit
spec:
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
