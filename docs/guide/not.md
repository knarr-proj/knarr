# `!not`

Boolean negation of a **path**. Path only — no `??` on this tag.

## Syntax

```yaml
$when: !not $Values.service.enabled
$Hide: !not $ShowSvc
```

One tag, one scalar path. Does **not** wrap `!empty` / `!and` / `!or` (those have [`!not-empty`](not-empty.md) / De Morgan / `!expr`). `??` on `!not` is an error.

## Examples

### Invert a flag

```yaml
!emit?
$when: !not $Values.service.enabled
$then:
  kind: ConfigMap
  name: no-svc
```

### Optional bool

Default the path first, then negate:

```yaml
!bind
$Debug: !ref $Values.debug? ?? false
---
!emit
$when: !not $Debug
```

Missing debug → `false` → not → **true**. `!expr "!$Values.debug? ?? false"` defaults the **not-result**: missing debug → **false**.

### Hide workers

```yaml
$filter: !not $Worker.disabled
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit?
$when: !not !ref $On
$then:
  kind: Service
# two tags on one node; !not does not wrap !ref
```

</td><td>

```yaml
!emit?
$when: !not $Values.service.enabled
$then:
  kind: Service
  name: !ref $Values.name
# !not takes a path scalar
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !not !empty $Values.tls?
$then:
  kind: ConfigMap
# !not does not wrap !empty
```

</td><td>

```yaml
!emit?
$when: !not-empty $Values.tls?
$then:
  kind: ConfigMap
  name: tls
# use !not-empty or !expr
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !not $Values.debug? ?? false
$then:
  kind: Deployment
# no ?? on !not
```

</td><td>

```yaml
!bind
$Debug: !ref $Values.debug? ?? false
---
!emit?
$when: !not $Debug
$then:
  kind: Deployment
  name: !ref $Values.name
# default the path, then !not
```

</td></tr>
</table>

## See also

- [`!not-empty`](not-empty.md)
- [`$when`](when.md)
- [`!ref`](ref.md)
- [`!expr`](expr.md)

## Comparison with Helm

`!not` negates a path scalar, not another tag. It does not take `??`.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if not .Values.service.enabled }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `not` is truthiness. Knarr `!not` needs a bool.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if not .Values.debug }}
kind: Deployment
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !empty $Values.debug?
$then:
  kind: Deployment
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `not` on empty ≡ `!empty`. `$then` is the whole document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.workers }}
{{- if not .disabled }}
  - name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `not .disabled` of missing is true. Knarr `!not` of omit is an error. Empty range: Helm `env: null` ≡ no `env`; knarr `env: []` if the key is not `?:`.

</td></tr>
</table>
