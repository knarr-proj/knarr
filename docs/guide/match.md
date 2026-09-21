# `!match`

Field-level **if / else**. The tag sits on a **value**, not on a key.

**Helm:** `{{- if }}` inside a spec field — [vs Helm](match-vs-helm.md).

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

- [vs Helm](match-vs-helm.md)
- [`$when`](when.md)
- [Omit](omit.md)
- [`!pick`](pick.md)
