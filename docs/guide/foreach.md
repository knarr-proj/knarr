# `!foreach`

Build a **sequence** for one field (env, ports, volumeMounts). It does not emit documents.

Many resources: [`!emit-foreach`](emit-foreach.md).

## Syntax

```yaml
field: !foreach
  $over: !ref $Values.env
  $as: $E
  $filter: !ref $E.enabled   # optional
  $key: $K                      # optional; maps only
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

`$yield` may be scalar, sequence, or mapping — **one sort** for the whole loop.

`$yield?:` — if the value omits, **skip the iteration** (list shrinks). `$yield:` + omit is an error.

`env?: !foreach` + result `[]` → omit the key. `env: !foreach` + `[]` → empty list `[]`.

`$over` must be present (not `$over?:`). Nil collection: `?? []` / `?? {}`.

No `$index`.

## Examples

### Container env

```yaml
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

### Ports from ints

```yaml
ports: !foreach
  $over: !ref $Values.ports
  $as: $P
  $yield:
    containerPort: !ref $P
```

### Map of labels → env vars

```yaml
env: !foreach
  $over: !ref $Values.labels
  $as: $V
  $key: $K
  $yield:
    name: !ref $K
    value: !ref $V
```

### Optional env block

```yaml
env?: !foreach
  $over: !ref "$Values?.env ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

Empty list + `env?:` → key omitted.

### Skip disabled sidecars

```yaml
$yield?: !ref $S?.container
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# !foreach is not a root document for many Pods
```

</td><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# one document per item is !emit-foreach
```

</td></tr>
<tr><td>

```yaml
!emit
containers: !foreach
  $over: !ref $Values?.workers
  $as: $W
  $yield:
    name: !ref $W.name
# omit $over is an error
```

</td><td>

```yaml
!emit
containers: !foreach
  $over: !ref "$Values?.workers ?? []"
  $as: $W
  $yield:
    name: !ref $W.name
# missing list becomes []
```

</td></tr>
<tr><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield: !match
    $if: !ref $E.plain
    $then: !ref $E.name
    $else:
      name: !ref $E.name
      value: !ref $E.value
# one loop cannot mix string and mapping $yield
```

</td><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# one YAML sort per loop
```

</td></tr>
</table>

## See also

- [`!emit-foreach`](emit-foreach.md)
- [Omit](omit.md)

## Comparison with Helm

`!foreach` fills a **sequence field**. One document per item is `!emit-foreach`.

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

</td></tr>
<tr><th>Difference</th><td>

Helm `| quote` adds quotes in the rendered text; knarr `value` is a YAML string.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ports:
{{- range .Values.ports }}
  - containerPort: {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
ports: !foreach
  $over: !ref $Values.ports
  $as: $P
  $yield:
    containerPort: !ref $P
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range $k, $v := .Values.labels }}
  - name: {{ $k }}
    value: {{ $v | quote }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.labels
  $as: $V
  $key: $K
  $yield:
    name: !ref $K
    value: !ref $V
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.env }}
{{- if .enabled }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $filter: !ref $E.enabled
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
