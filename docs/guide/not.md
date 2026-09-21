# `!not`

Boolean negation of a **path**. Same `RefScalar` as [`!ref`](ref.md).

## Syntax

```yaml
$when: !not $Values.service.enabled
$Hide: !not $ShowSvc
```

One tag, one scalar path. Does **not** wrap `!empty` / `!and` / `!or` (those have [`!not-empty`](not-empty.md) / De Morgan / `!expr`).

## Examples

### Invert a flag

```yaml
---
!emit
$when: !not $Values.service.enabled
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: no-svc
$else: ""
```

### Optional bool

```yaml
$when: !not $Values?.debug
```

Need a bool: missing without `??` is omit, not false. Prefer `!expr "!($Values?.debug ?? false)"` if the flag may be absent.

### Hide workers

```yaml
$filter: !not $Worker.disabled
```

## Common mistakes

**Wrong — two tags**

```yaml
$when: !not !ref $On
$when: !not !empty $X
```

**Right —** `!not $On` or `!not-empty` / `!expr`.

## See also

- [`!not-empty`](not-empty.md)
- [`$when`](when.md)

## Comparison with Helm

`!not` negates a path scalar, not another tag.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{- if not .Values.service.enabled }}
```

</td><td>

```yaml
$when: !not $Values.service.enabled
```

</td></tr>
<tr><td>

```gotemplate
{{- if not .Values.debug }}
```

</td><td>

```yaml
$when: !expr "!($Values?.debug ?? false)"
```

</td></tr>
<tr><td>

```gotemplate
{{- if not .disabled }}
```

</td><td>

```yaml
$filter: !not $Worker.disabled
```

</td></tr>
</table>
