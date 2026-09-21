# `!emit-foreach`

Emit **N YAML documents** — one document per item.

For lists **inside** one mapping (env, ports, extra hosts), use [`!foreach`](foreach.md), not this tag.

## Syntax

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled    # optional
$key: $Kind                       # optional; only if $over is a mapping
$when: !ref $Values.deployWorkers ?? false  # optional gate
$yield:
  kind: Deployment
  name: !ref $Worker.name
```

| Key | Meaning |
|-----|---------|
| `$over` | Sequence or mapping. **`$over?:` is an error.** Omit value (`$over: !ref $Values?.workers`) → **zero documents**. Empty `[]` / `{}` → zero documents. `?? []` / `?? {}` also fine (missing becomes empty). |
| `$as` | Binding for the element (value if `$over` is a map). |
| `$yield` | Mapping = one manifest. Or `$yield?:` to skip that iteration on omit. |
| `$filter` | Bool; false → no document for that item. Tags or YAML `true` / `false`. |
| `$key` | Extra binding for the map key (maps only). |
| `$when` | Bool gate for the **whole** loop. False → zero documents; `$over` is not evaluated. **No** `$then` / `$else`. Tags or YAML `true` / `false`. |

There is no `$index`. `$yield` on `!emit-foreach` must be a **mapping**.

## Examples

### One Deployment per worker

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Deployment
  name: !ref $Worker.name
```

### Filter disabled workers

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled
$yield:
  kind: Pod
  name: !ref $Worker.name
```

### Range a map of component images

```yaml
!emit-foreach
$over: !ref $Values.images
$as: $Image
$key: $Comp
$yield:
  kind: Deployment
  name: !ref $Comp
```

Key order follows the source mapping.

### Gate the whole pack

```yaml
!emit-foreach
$when: !ref $Values.deployWorkers ?? false
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
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
  kind: Deployment
  name: !ref $W.name
# !foreach fills a sequence field; it is not a root document
```

</td><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Deployment
  name: !ref $W.name
# one document per item is !emit-foreach
```

</td></tr>
<tr><td>

```yaml
!emit-foreach
$items: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# $items was removed
```

</td><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# use $over / $as / $yield
```

</td></tr>
<tr><td>

```yaml
!emit-foreach
$over?: !ref $Values?.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# $over?: is not allowed
```

</td><td>

```yaml
!emit-foreach
$over: !ref $Values?.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# omit $over → zero documents
```

</td></tr>
<tr><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $W
$when: !ref $W.enabled
$yield:
  kind: Pod
  name: !ref $W.name
# document $when cannot see $as
```

</td><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $W
$filter: !ref $W.enabled
$yield:
  kind: Pod
  name: !ref $W.name
# per-item gate is $filter; $when only gates the whole pack
```

</td></tr>
</table>

## See also

- [`!foreach`](foreach.md)
- [`$when`](when.md)

## Comparison with Helm

`!emit-foreach` is `range` around a **whole resource**. Lists inside one spec use `!foreach`.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range .Values.workers }}
kind: Pod
name: {{ .name }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
```

</td></tr>
<tr><th>Difference</th><td>

Helm prints `---` between items; knarr emits one document per item.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range .Values.workers }}
{{- if .enabled }}
kind: Pod
name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled
$yield:
  kind: Pod
  name: !ref $Worker.name
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range $comp, $image := .Values.images }}
kind: Deployment
name: {{ $comp }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit-foreach
$over: !ref $Values.images
$as: $Image
$key: $Comp
$yield:
  kind: Deployment
  name: !ref $Comp
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.deployWorkers }}
{{- range .Values.workers }}
kind: Pod
name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit-foreach
$when: !ref $Values.deployWorkers ?? false
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
