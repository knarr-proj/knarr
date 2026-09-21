# `!not-empty`

Boolean: not [`!empty`](empty.md) of the same path. Use this for “required” and `$when` “has sidecars”.

**Helm:** `not (empty .)` / `if .Values.foo` — [vs Helm](not-empty-vs-helm.md).

## Syntax

```yaml
$when: !not-empty $Values?.sidecars
```

## Examples

### Emit when sidecars exist

```yaml
---
!emit
$when: !not-empty $Values?.sidecars
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: sidecars
$else: ""
```

### Required values.name

```yaml
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set name"
```

### Filter workers with a port list

```yaml
$filter: !not-empty $W?.ports
```

### replicas from a non-empty map

```yaml
$when: !not-empty $Values?.nodeSelector
$then:
  spec:
    nodeSelector: !ref $Values.nodeSelector
$else: ""
```

For a **field** omit, `nodeSelector?: !ref $Values?.nodeSelector` is simpler.

## Common mistakes

**Wrong — `!len` as `$when`**

**Wrong — `!empty` in `$rules` meaning “required”**

`$rules` are must-true: `!empty` means “must be empty”.

## See also

- [vs Helm](not-empty-vs-helm.md)
- [`!empty`](empty.md)
- [`!validation`](validation.md)
