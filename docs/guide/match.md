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
- `$if` is a bool predicate (same family as `$when`): tags or YAML `true` / `false`. Omit from `?.` without `??` is an error (not `false`); use `?? false` or [`!is-empty`](is-empty.md) / [`!is-not-empty`](is-not-empty.md).
- Short-circuit: false `$if` does not evaluate `$then`.
- One sort: `$then` and `$else` (when present) must match.
- **Omit the key:** `affinity?: !match` **without** `$else` — false `$if` omits.
- `affinity: !match` without `$else` is an error if `$if` is false (no value).
- `$if?:` / `$then?:` / `$else?:` are errors.

## Examples

### replicas fallback

```yaml
# $Values = {replicas: 0}
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
# 1
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
initContainers?: !skip-empty $Values.init?
```

On a `?:` key this is the short form of `$if: !is-not-empty` + `$then: !ref`. Do not write `initContainers?: !is-empty …` (bool). On `name?: !match`, `$then: !skip-empty` is allowed; on `$then` of `!emit?` it is not.

### Else-if (Ingress vs ClusterIP)

```yaml
type: !match
  $if: !is-not-empty $Values.ingress?.enabled?
  $then: ClusterIP
  $else: !match
    $if: !is-not-empty $Values.loadBalancer?
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
  - $if: !is-not-empty $Values.ingress?.enabled?
    $then: ClusterIP
  - $if: !is-not-empty $Values.loadBalancer?
    $then: LoadBalancer
# !match is not a list of $if entries
```

</td><td>

```yaml
!emit
type: !match
  $if: !is-not-empty $Values.ingress?.enabled?
  $then: ClusterIP
  $else: !match
    $if: !is-not-empty $Values.loadBalancer?
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

## Omit

`$if` omit without `??` is an error. Omit the **key** with `имя?: !match` and no `$else`.

```yaml
# $Values = {replicas: 1}
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $then:
    - maxSkew: 1
# no topologySpreadConstraints
```

Helm `| default` is `$if: !is-empty` then fallback — not `??`.

## See also

- [`$when`](when.md)
- [`!pick`](pick.md)
- [`!skip-empty`](skip-empty.md)

## Comparison with Helm

`!match` is `if` / `else` on a **value**. Document-level if is `$when`.

<table>
<tr><th>Helm</th><td>

```gotemplate
replicas: {{ if gt (required "replicas" .Values.replicas) 0 }}{{ .Values.replicas }}{{ else }}1{{ end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $then: !ref $Values.replicas
  $else: 1
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if gt (required "replicas" .Values.replicas) 1 }}
topologySpreadConstraints:
  - maxSkew: 1
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $then:
    - maxSkew: 1
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` and `$fail` are fail text only. Key omitted when `replicas` ≤ 1.

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
  $if: !is-not-empty $Values.ingress?.enabled?
  $then: ClusterIP
  $else: !match
    $if: !is-not-empty $Values.loadBalancer?
    $then: LoadBalancer
    $else: ClusterIP
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` is [`!is-not-empty`](is-not-empty.md) (omit / `""` / `[]` / `{}` / `false` / `0` / `0.0`). Each field that may be missing needs `?`.

</td></tr>
</table>
