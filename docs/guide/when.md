# `$when`

Document-level condition. **`!emit?`**: `$when` + `$then`, no `$else` (false → no document). **`!emit`**: `$when` + `$then` + `$else` (`$else: ""` skips; or another mapping). Omit `$when` is an error on both. On **`!emit-foreach`**, `$when` is an optional pack gate with **no** `$then` / `$else`.

## Syntax (`!emit?`)

```yaml
!emit?
$when: <bool>
$then:
  kind: Service
  name: !ref $Values.name
```

Predicate: `!ref`, `!not`, `!expr`, `!empty`, `!not-empty`, `!and`, `!or`, or YAML `true` / `false`. Not `!len` (that is int). Not `!expr "true"` — that is no computation.

`$else` on `!emit?` is a pair error. On `!emit`, `$else: ""` → emit nothing; `$else:` may be another mapping.

No other keys next to `$when`. `when:` without `$` is an error.

## Syntax (`!emit-foreach`)

```yaml
!emit-foreach
$when: !ref $Values.deployWorkers ?? false
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
```

False → **zero** documents; `$over` is not evaluated. `$as` is not visible in `$when`.

## Examples

### Service if enabled

```yaml
$when: !ref $Values.service.enabled
```

### Sidecars present

```yaml
!emit?
$when: !not-empty $Values.sidecars?
$then:
  kind: ConfigMap
  name: sidecars
```

### Compound

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
replicas:
  $when: !ref $Values.ha
  $then: 3
  $else: 1
# $when is not allowed on a field
```

</td><td>

```yaml
!emit
replicas: !match
  $if: !ref $Values.ha
  $then: 3
  $else: 1
# field-level if is !match
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !len $Values.workers
$then:
  kind: ConfigMap
# !len is an int, not a bool
```

</td><td>

```yaml
!emit?
$when: !not-empty $Values.workers?
$then:
  kind: ConfigMap
  name: workers
# $when needs a bool: !not-empty, or !expr after !len
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !ref $Values.enabled?
$then:
  kind: Service
# omit is not a bool
```

</td><td>

```yaml
!emit?
$when: !ref $Values.enabled? ?? false
$then:
  kind: Service
  name: !ref $Values.name
# missing enabled becomes false
```

</td></tr>
<tr><td>

```yaml
!emit?
$when: !expr "true"
$then:
  kind: Service
# no computation: use YAML
```

</td><td>

```yaml
!emit?
$when: true
$then:
  kind: Service
  name: !ref $Values.name
# a constant bool is YAML
```

</td></tr>
</table>

## See also

- [`!emit`](emit.md)
- [`!match`](match.md)
- [`!and`](and.md)

## Comparison with Helm

`$when` gates `!emit?` (no `$else`) or `!emit` (needs `$else`). Field-level if is `!match`.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.service.enabled }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !not-empty $Values.service?.enabled?
$then:
  kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!not-empty`. Missing → omit → no document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.sidecars }}
kind: ConfigMap
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !not-empty $Values.sidecars?
$then:
  kind: ConfigMap
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Helm `if` ≡ `!not-empty`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
kind: Service
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit?
$when: !and
  - !not-empty $Values.service?.enabled?
  - !expr "$Values.replicas? > 1 ?? false"
$then:
  kind: Service
```

</td></tr>
<tr><th>Difference</th><td>

Same result when `replicas` is int/float. Helm `if` ≡ `!not-empty`. Helm `gt` ≡ `>`. Missing `service` / `enabled` / `replicas` → no document. Helm `gt` may coerce a numeric string; knarr `>` of a string is a type error.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.deployWorkers }}
{{- range .Values.workers }}
---
kind: Pod
name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit-foreach
$when: !not-empty $Values.deployWorkers?
$over: !ref $Values.workers?
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
```

</td></tr>
<tr><th>Difference</th><td>

Same YAML documents. Helm `if` ≡ `!not-empty`. Comparison Helm must include `---` (without it the stream is not multi-doc). See [`!emit-foreach`](emit-foreach.md).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Release.Name }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

`$Release` / `$Chart` / `$Capabilities` are reserved and not injected. Do not pair this with a user `$Rel`.

</td></tr>
</table>
