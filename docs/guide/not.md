# `!not`

Boolean negation of a **path**. Path only — no `??` on this tag.

## Syntax

```yaml
# $Values = {service: {enabled: false}}; $ShowSvc = true
$when: !not $Values.service.enabled    # true
$Hide: !not $ShowSvc                   # false
```

One tag, one scalar path. Does **not** wrap `!is-empty` / `!and` / `!or` (those have [`!is-not-empty`](is-not-empty.md) / De Morgan / `!expr`). `??` on `!not` is an error.

## Examples

### Invert a flag

```yaml
# $Values = {service: {enabled: false}}
!emit?
$when: !not $Values.service.enabled
$yield?:
  kind: ConfigMap
  name: no-svc
# kind: ConfigMap
```

### Optional bool

Default the path first, then negate:

```yaml
# $Values = {}
!bind
$Debug: !ref $Values.debug? ?? false
---
!emit
$when: !not $Debug
# true
```

Missing debug → `false` → not → **true**. `!expr "!$Values.debug? ?? false"` defaults the **not-result**: missing debug → **false**.

### Hide workers

```yaml
# $Worker = {disabled: false}
$filter: !not $Worker.disabled
# true
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $On = true
!emit?
$when: !not !ref $On
$yield?:
  kind: Service
# error: !not does not wrap !ref
```

</td><td>

```yaml
# $Values = {service: {enabled: false}, name: api}
!emit?
$when: !not $Values.service.enabled
$yield?:
  kind: Service
  name: !ref $Values.name
# kind: Service
```

</td></tr>
<tr><td>

```yaml
# $Values = {tls: {host: a}}
!emit?
$when: !not !is-empty $Values.tls?
$yield?:
  kind: ConfigMap
# error: !not does not wrap !is-empty
```

</td><td>

```yaml
# $Values = {tls: {host: a}}
!emit?
$when: !is-not-empty $Values.tls?
$yield?:
  kind: ConfigMap
  name: tls
# kind: ConfigMap
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit?
$when: !not $Values.debug? ?? false
$yield?:
  kind: Deployment
# error: no ?? on !not
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Debug: !ref $Values.debug? ?? false
---
!emit?
$when: !not $Debug
$yield?:
  kind: Deployment
  name: !ref $Values.name
# kind: Deployment
```

</td></tr>
</table>

## Omit

`!not` takes a path. Optional field uses `?`. No `??` on `!not`.

```yaml
# $Values = {enabled: false}
$when: !not $Values.enabled    # true
```

```yaml
# $Values = {}
$when: !not $Values.enabled?   # error: omit in bool slot
```

## See also

- [`!is-not-empty`](is-not-empty.md)
- [`$when`](when.md)
- [`!ref`](ref.md)
- [`!expr`](expr.md)

## Comparison with Helm

`!not` negates a path scalar, not another tag. It does not take `??`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: false}}
{{- if not .Values.service.enabled }}
kind: Service
{{- end }}
# kind: Service
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: false}}
!emit?
$when: !is-empty $Values.service?.enabled?
$yield?:
  kind: Service
# kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `not` on empty ≡ `!is-empty`. `!not` still needs a bool path.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
{{- if not .Values.debug }}
kind: Deployment
{{- end }}
# kind: Deployment
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!emit?
$when: !is-empty $Values.debug?
$yield?:
  kind: Deployment
# kind: Deployment
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `not` on empty ≡ `!is-empty`. `$yield` is the whole document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [{name: w, disabled: false}]}
env:
{{- range .Values.workers }}
{{- if not .disabled }}
  - name: {{ .name }}
{{- end }}
{{- end }}
# env: [{name: w}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {workers: [{name: w, disabled: false}]}
!emit
env?: !foreach
  $over: !ref $Values.workers?
  $as: $W
  $filter: !is-empty $W.disabled?
  $yield?:
    name: !ref $W.name
# env: [{name: w}]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `not` on empty ≡ `!is-empty`. Item is a mapping (`- name:`).

</td></tr>
</table>
