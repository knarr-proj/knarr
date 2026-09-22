# `!match`

Field-level **if / else**. The tag sits on a **value**, not on a key.

## Syntax

```yaml
# $Values = {replicas: 3}
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $yield: !ref $Values.replicas
  $else-yield: 1
# replicas: 3
```

- Mapping with `$if` + exactly one of `$yield` / `$yield?:`. `$yield:` may have `$else-yield`. `$yield?:` + `$else-yield` is a pair error.
- Not a sequence of branches. Else-if = `$else-yield: !match`.
- `$if` is a bool predicate (same family as `$when`): tags or YAML `true` / `false`. Omit from `?.` without `??` is an error (not `false`); use `?? false` or [`!is-empty`](is-empty.md) / [`!is-not-empty`](is-not-empty.md).
- Short-circuit: false `$if` does not evaluate `$yield` / `$yield?:`.
- One sort: `$yield` / `$yield?:` and `$else-yield` (when present) must match.
- **Omit the key:** `affinity?: !match` **without** `$else-yield` — false `$if` omits; or `$yield?:` omits when `$if` is true.
- `affinity: !match` without `$else-yield` is an error if `$if` is false (no value). `имя: !match` + `$yield?:` is a pair error.
- `$if?:` / `$else-yield?:` are errors. There is no `!match?`. `$then` / `$else` are errors, not synonyms.

## Examples

### replicas fallback

```yaml
# $Values = {replicas: 0}
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $yield: !ref $Values.replicas
  $else-yield: 1
# 1
```

### topologySpread only when HA

```yaml
# $Values = {replicas: 3, name: api}
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $yield:
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          app: !ref $Values.name
# topologySpreadConstraints: [{maxSkew: 1}]
```

No `$else-yield` + `?:` → key absent when replicas ≤ 1.

### Drop empty list

An empty `[]` is a value. To omit the key when the list is missing **or** `[]`:

```yaml
# $Values = {init: []}
initContainers?: !skip-empty $Values.init?
# no initContainers
```

On a `?:` key this is the short form of `$if: !is-not-empty` + `$yield: !ref`. Do not write `initContainers?: !is-empty …` (bool). On `name?: !match`, `$yield: !skip-empty` or `$yield?:` is allowed.

```yaml
# $Values = {}
name?: !match
  $if: true
  $yield?: !ref $Values.name?
# no name
```

### Else-if (Ingress vs ClusterIP)

```yaml
# $Values = {ingress: {enabled: true}}
type: !match
  $if: !is-not-empty $Values.ingress?.enabled?
  $yield: ClusterIP
  $else-yield: !match
    $if: !is-not-empty $Values.loadBalancer?
    $yield: LoadBalancer
    $else-yield: ClusterIP
# type: ClusterIP
```

### Inside `$yield`

`!match` is a normal value: it may appear in foreach yield, bind, `$yield`.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {ha: true}
!emit
replicas !if: !ref $Values.ha
# error: tags belong on the value, not on the key
```

</td><td>

```yaml
# $Values = {ha: true}
!emit
replicas: !match
  $if: !ref $Values.ha
  $yield: 3
  $else-yield: 1
# replicas: 3
```

</td></tr>
<tr><td>

```yaml
# $Values = {ingress: {enabled: true}}
!emit
type: !match
  - $if: !is-not-empty $Values.ingress?.enabled?
    $yield: ClusterIP
  - $if: !is-not-empty $Values.loadBalancer?
    $yield: LoadBalancer
# error: !match is not a list of $if entries
```

</td><td>

```yaml
# $Values = {ingress: {enabled: true}}
!emit
type: !match
  $if: !is-not-empty $Values.ingress?.enabled?
  $yield: ClusterIP
  $else-yield: !match
    $if: !is-not-empty $Values.loadBalancer?
    $yield: LoadBalancer
    $else-yield: ClusterIP
# type: ClusterIP
```

</td></tr>
<tr><td>

```yaml
# $Values = {replicas: 3}
!emit
replicas: !match
  $when: !expr "$Values.replicas > 0"
  $yield: !ref $Values.replicas
  $else-yield: 1
# error: !match uses $if, not $when
```

</td><td>

```yaml
# $Values = {replicas: 3}
!emit
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $yield: !ref $Values.replicas
  $else-yield: 1
# replicas: 3
```

</td></tr>
</table>

## Omit

`$if` omit without `??` is an error. Omit the **key** with `имя?: !match` and no `$else-yield`, or with `$yield?:` when the body omits.

```yaml
# $Values = {replicas: 1}
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $yield:
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
# $Values = {replicas: 3}
replicas: {{ if gt (required "replicas" .Values.replicas) 0 }}{{ .Values.replicas }}{{ else }}1{{ end }}
# replicas: 3
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {replicas: 3}
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
replicas: !match
  $if: !expr "$Values.replicas > 0"
  $yield: !ref $Values.replicas
  $else-yield: 1
# replicas: 3
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {replicas: 3}
{{- if gt (required "replicas" .Values.replicas) 1 }}
topologySpreadConstraints:
  - maxSkew: 1
{{- end }}
# topologySpreadConstraints: [{maxSkew: 1}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {replicas: 3}
!validation
$rules:
  - !is-not-empty $Values.replicas?
$fail: "replicas"
---
!emit
topologySpreadConstraints?: !match
  $if: !expr "$Values.replicas > 1"
  $yield:
    - maxSkew: 1
# topologySpreadConstraints: [{maxSkew: 1}]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` and `$fail` are fail text only. Key omitted when `replicas` ≤ 1.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {ingress: {enabled: true}}
type: {{ if .Values.ingress.enabled }}ClusterIP{{ else if .Values.loadBalancer }}LoadBalancer{{ else }}ClusterIP{{ end }}
# type: ClusterIP
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {ingress: {enabled: true}}
!emit
type: !match
  $if: !is-not-empty $Values.ingress?.enabled?
  $yield: ClusterIP
  $else-yield: !match
    $if: !is-not-empty $Values.loadBalancer?
    $yield: LoadBalancer
    $else-yield: ClusterIP
# type: ClusterIP
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` is [`!is-not-empty`](is-not-empty.md) (omit / `""` / `[]` / `{}` / `false` / `0` / `0.0`). Each field that may be missing needs `?`.

</td></tr>
</table>
