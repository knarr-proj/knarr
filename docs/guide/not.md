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
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
{{- if not .Values.service.enabled }}
kind: Service
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !not $Values.service.enabled
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

</td><td>

Helm `not` is truthiness; knarr `!not` needs a bool.

</td></tr>
<tr><td>

```gotemplate
{{- if not .Values.debug }}
kind: Deployment
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !expr "!($Values?.debug ?? false)"
$then:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: !ref $Values.name
$else: ""
```

</td><td>

Missing `.Values.debug` makes Helm `not` true; knarr needs `?.` and `?? false`.

</td></tr>
<tr><td>

```gotemplate
env:
{{- range .Values.workers }}
{{- if not .disabled }}
  - name: {{ .name }}
{{- end }}
{{- end }}
```

</td><td>

```yaml
---
!emit
spec:
  containers:
    - env: !foreach
        $over: !ref $Values.workers
        $as: $Worker
        $filter: !not $Worker.disabled
        $yield:
          name: !ref $Worker.name
```

</td><td>

—

</td></tr>
</table>
