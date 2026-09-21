# `$when`

Document-level condition. On **`!emit`**, `$when` requires `$then` and `$else`. On **`!emit-foreach`**, `$when` is an optional pack gate with **no** `$then` / `$else`.

## Syntax (`!emit`)

```yaml
---
!emit
$when: <bool>
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

Predicate: `!ref`, `!not`, `!expr`, `!empty`, `!not-empty`, `!and`, `!or`. Not `!len` (that is int).

`$else: ""` → emit nothing. `$else:` may be another mapping.

No other keys next to `$when`. `when:` without `$` is an error.

## Syntax (`!emit-foreach`)

```yaml
---
!emit-foreach
$when: !expr "$Values.deployWorkers ?? false"
$over: !ref $Values.workers
$as: $Worker
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
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
$when: !not-empty $Values?.sidecars
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: sidecars
$else: ""
```

### Compound

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

## Common mistakes

**Wrong — `if` on a field using `$when`**

`$when` is not allowed on random keys. Use [`!match`](match.md) or [omit](omit.md).

**Wrong — `$when: !len $Xs`**

**Right —** `$when: !not-empty $Xs` or `!expr "$N > 0"` after `!len`.

**Wrong — omit `$when` without `??`**

```yaml
$when: !ref $Values?.enabled
```

If `enabled` is missing, omit is not a bool. Use `?? false`.

## See also

- [`!emit`](emit.md)
- [`!match`](match.md)
- [`!and`](and.md)

## Comparison with Helm

`$when` gates a whole `!emit` (needs `$then` / `$else`). Field-level if is `!match`.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{- if .Values.service.enabled }}
apiVersion: v1
kind: Service
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !ref $Values.service.enabled
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

</td></tr>
<tr><td>

```gotemplate
{{- if .Values.sidecars }}
kind: ConfigMap
{{- end }}
```

</td><td>

```yaml
$when: !not-empty $Values?.sidecars
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: sidecars
$else: ""
```

</td></tr>
<tr><td>

```gotemplate
{{- if and .Values.service.enabled (gt .Values.replicas 1) }}
```

</td><td>

```yaml
$when: !and
  - !ref $Values.service.enabled
  - !expr "$Values.replicas > 1"
```

</td></tr>
<tr><td>

```gotemplate
{{- if .Values.deployWorkers }}
{{- range .Values.workers }} ... {{- end }}
{{- end }}
```

</td><td>

```yaml
---
!emit-foreach
$when: !expr "$Values.deployWorkers ?? false"
$over: !ref $Values.workers
$as: $Worker
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
    name: !ref $Worker.name
```

</td></tr>
</table>
