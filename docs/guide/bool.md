# `!bool`

Coerce to **bool**.

**Helm:** `eq` tricks / sprig bool — [vs Helm](bool-vs-helm.md).

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
---
!bind
$HA: !bool $Values.ha
---
!emit
$when: !ref $HA
$then:
  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata:
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
---
!bind
$TlsOn: !bool $Values.ingress.tls
---
!emit
spec:
  tls?: !match
    $if: !ref $TlsOn
    $then:
      - hosts:
          - !ref $Values.ingress.host
        secretName: !ref $Values.ingress.secretName
```

## Common mistakes

**Wrong — YAML `yes` / `on` / `TRUE` as coerce input**

knarr `!bool` does not accept them (and knarr documents reject `!!bool`).

**Wrong — `1` → true**

Int is an error. Use a real bool or the strings `"true"` / `"false"`.

**Wrong — `bool()` in `!expr`**

```yaml
$On: !expr "bool($Values.ha)"
```

**Right**

```yaml
$On: !bool $Values.ha
```

## See also

- [vs Helm](bool-vs-helm.md)
- [`!not`](not.md)
- [`$when`](when.md)
