# `$when`

Document-level condition. **`!emit?`**: `$when` + `$yield?:`, no `$else-yield` (false `$when` or omit `$yield?:` → no document). **`!emit`**: `$when` + `$yield` + `$else-yield` (`$else-yield: ""` skips; or another mapping). Omit `$when` is an error on both. On **`!foreach`** / **`!emit-foreach`** / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`** / **`!range`**, `$when` is an optional pack gate with **no** `$else-yield` (`$yield` is the loop body). False → empty loop (`[]` / omit key / zero documents); `$over` / bounds are not evaluated. **`!emit-foreach?`** is not “`$when` required”: it pairs with **`$yield?:`**. `$yield:` on `!emit?` is a pair error.

## Syntax (`!emit?`)

```yaml
# $Values = {name: api}
!emit?
$when: <bool>
$yield?:
  kind: Service
  name: !ref $Values.name  # name: api
```

Predicate: `!ref`, `!not`, `!expr`, `!is-empty`, `!is-not-empty`, `!and`, `!or`, or YAML `true` / `false`. Not `!len` (that is int). Not `!expr "true"` — that is no computation.

`$else-yield` on `!emit?` is a pair error. On `!emit`, `$else-yield: ""` → emit nothing; `$else-yield:` may be another mapping.

No other keys next to `$when`. `when:` without `$` is an error.

## Syntax (`!emit-foreach`)

```yaml
# $Values = {deployWorkers: true, workers: [{name: w1}]}
!emit-foreach
$when: !ref $Values.deployWorkers ?? false
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
# kind: Pod / name: w1
```

False → **zero** documents; `$over` is not evaluated. `$as` is not visible in `$when`.

## Syntax (`!foreach`)

```yaml
# $Values = {deployEnv: false, env: [{name: N}]}
env: !foreach
  $when: !is-not-empty $Values.deployEnv?
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
# env: []
```

False → empty list (`$yield:`) or no key (`env?:` + `$yield?:`). `$over` is not evaluated.

## Examples

### Service if enabled

```yaml
# $Values = {service: {enabled: true}}
$when: !ref $Values.service.enabled
# true
```

### Sidecars present

```yaml
# $Values = {sidecars: [a]}
!emit?
$when: !is-not-empty $Values.sidecars?
$yield?:
  kind: ConfigMap
  name: sidecars
# kind: ConfigMap / name: sidecars
```

### Compound

```yaml
# $Values = {service: {enabled: true}, replicas: 2}
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
# true
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {ha: true}
!emit
replicas:
  $when: !ref $Values.ha
  $yield: 3
  $else-yield: 1
# error: $when is not allowed on a field
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
# $Values = {workers: [a]}
!emit?
$when: !len $Values.workers
$yield?:
  kind: ConfigMap
# error: !len is an int, not a bool
```

</td><td>

```yaml
# $Values = {workers: [a]}
!emit?
$when: !is-not-empty $Values.workers?
$yield?:
  kind: ConfigMap
  name: workers
# kind: ConfigMap / name: workers
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit?
$when: !ref $Values.enabled?
$yield?:
  kind: Service
# error: omit is not a bool
```

</td><td>

```yaml
# $Values = {name: api}
!emit?
$when: !ref $Values.enabled? ?? false
$yield?:
  kind: Service
  name: !ref $Values.name
# stdout empty
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!emit?
$when: !expr "true"
$yield?:
  kind: Service
# error: no computation: use YAML
```

</td><td>

```yaml
# $Values = {name: api}
!emit?
$when: true
$yield?:
  kind: Service
  name: !ref $Values.name  # name: api
```

</td></tr>
</table>

## Omit

Omit `$when` is an **error** (not `false`). Use `?? false` or [`!is-empty`](is-empty.md) / [`!is-not-empty`](is-not-empty.md). `$when?:` is an error. On `!foreach` / `!range` / `!emit-foreach` / `!emit-foreach?` / `!emit-range` / `!emit-range?`, `$when` false is an empty loop (`$over` / bounds not evaluated).

```yaml
# $Values = {}
!emit?
$when: !is-not-empty $Values.service?.enabled?
$yield?:
  kind: Service
# stdout empty
```

## See also

- [`!emit`](emit.md)
- [`!emit-range`](emit-range.md)
- [`!match`](match.md)
- [`!and`](and.md)

## Comparison with Helm

`$when` gates `!emit?` (`$yield?:`, no `$else-yield`) or `!emit` (needs `$else-yield`). Field-level if is `!match`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}}
{{- if .Values.service.enabled }}
kind: Service
{{- end }}
# kind: Service
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}}
!emit?
$when: !is-not-empty $Values.service?.enabled?
$yield?:
  kind: Service
# kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`. Missing → omit → no document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {sidecars: [a]}
{{- if .Values.sidecars }}
kind: ConfigMap
{{- end }}
# kind: ConfigMap
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {sidecars: [a]}
!emit?
$when: !is-not-empty $Values.sidecars?
$yield?:
  kind: ConfigMap
# kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!is-not-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {service: {enabled: true}, replicas: 2}
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
# kind: Service
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {service: {enabled: true}, replicas: 2}
!emit?
$when: !and
  - !is-not-empty $Values.service?.enabled?
  - !expr "$Values.replicas? > 1 ?? false"
$yield?:
  kind: Service
# kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is int/float. Helm `if` ≡ `!is-not-empty`. Helm `gt` ≡ `>`. Missing `service` / `enabled` / `replicas` → no document. Helm `gt` may coerce a numeric string; knarr `>` of a string is a type error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {deployWorkers: true, workers: [{name: w1}]}
{{- if .Values.deployWorkers }}
{{- range .Values.workers }}
---
kind: Pod
name: {{ .name }}
{{- end }}
{{- end }}
# kind: Pod / name: w1
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {deployWorkers: true, workers: [{name: w1}]}
!emit-foreach
$when: !is-not-empty $Values.deployWorkers?
$over: !ref $Values.workers?
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
# kind: Pod / name: w1
```

</td></tr>
<tr><th>Difference</th><td>

Same YAML documents. Helm `if` ≡ `!is-not-empty`. Comparison Helm must include `---` (without it the stream is not multi-doc). See [`!emit-foreach`](emit-foreach.md).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Release = {Name: prod}
name: {{ .Release.Name }}
# name: prod
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

`$Release` / `$Chart` / `$Capabilities` are reserved and not injected. Do not pair this with a user `$Rel`.

</td></tr>
</table>
