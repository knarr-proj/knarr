# `!emit-foreach`

Emit **N YAML documents** — one document per item. **`!emit-foreach?`** skips an item when `$yield?:` omits.

For lists **inside** one mapping (env, ports, extra hosts), use [`!foreach`](foreach.md), not this tag.

## Syntax

```yaml
# $Values = {workers: [{name: w1, enabled: true}], deployWorkers: true}
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled    # optional
$key: $Kind                       # optional; only if $over is a mapping
$when: !ref $Values.deployWorkers ?? false  # optional gate
$yield:
  kind: Deployment
  name: !ref $Worker.name
# kind: Deployment / name: w1
```

| Key | Meaning |
|-----|---------|
| `$over` | Sequence or mapping. **`$over?:` is an error.** Omit value (`$over: !ref $Values.workers?`) → **zero documents**. Empty `[]` / `{}` → zero documents. `?? []` / `?? {}` also fine (missing becomes empty). |
| `$as` | Binding for the element (value if `$over` is a map). |
| `$yield` | On **`!emit-foreach`**: mapping = one manifest. Omit is an error. |
| `$yield?:` | On **`!emit-foreach?` only**: mapping; omit → **no document** for that item. |
| `$filter` | Bool; false → no document for that item. Tags or YAML `true` / `false`. |
| `$key` | Extra binding for the map key (maps only). |
| `$when` | Bool gate for the **whole** loop. Optional on both tags. False → zero documents; `$over` is not evaluated. **No** `$else-yield` (not if/else). `$yield` is the loop body. Tags or YAML `true` / `false`. |

There is no `$index`. `$yield` / `$yield?:` must be a **mapping**. Pair: `!emit-foreach` ↔ `$yield:`; `!emit-foreach?` ↔ `$yield?:`. Mixed pair is an error. `$yield?` without `:` is an error. `$Name: !emit-foreach` / `$Name: !emit-foreach?` is an error.

## Examples

### One Deployment per worker

```yaml
# $Values = {workers: [{name: w1}, {name: w2}]}
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Deployment
  name: !ref $Worker.name
# ---
# kind: Deployment
# name: w1
# ---
# kind: Deployment
# name: w2
```

### Filter disabled workers

```yaml
# $Values = {workers: [{name: w1, enabled: true}, {name: w2, enabled: false}]}
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled
$yield:
  kind: Pod
  name: !ref $Worker.name
# kind: Pod / name: w1
```

### Range a map of component images

```yaml
# $Values = {images: {api: ghcr.io/acme/api:1}}
!emit-foreach
$over: !ref $Values.images
$as: $Image
$key: $Comp
$yield:
  kind: Deployment
  name: !ref $Comp
# kind: Deployment / name: api
```

Key order follows the source mapping.

### Gate the whole pack

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

### Skip a document when the body omits

```yaml
# $Values = {workers: [{name: w1}, {name: w2, sidecar: {kind: Sidecar}}]}
!emit-foreach?
$over: !ref $Values.workers
$as: $W
$yield?: !ref $W.sidecar?
# kind: Sidecar
```

`$W.sidecar` missing → no document for that item. `$yield?:` on `!emit-foreach` (no `?` on the tag) is a pair error.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {workers: [{name: w1}]}
!foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Deployment
  name: !ref $W.name
# error: !foreach is not a root document
```

</td><td>

```yaml
# $Values = {workers: [{name: w1}]}
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Deployment
  name: !ref $W.name
# kind: Deployment / name: w1
```

</td></tr>
<tr><td>

```yaml
# $Values = {workers: [{name: w1}]}
!emit-foreach
$over?: !ref $Values.workers?
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# error: $over?: is not allowed
```

</td><td>

```yaml
# $Values = {workers: [{name: w1}]}
!emit-foreach
$over: !ref $Values.workers?
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# kind: Pod / name: w1
```

</td></tr>
<tr><td>

```yaml
# $Values = {workers: [{name: w1, enabled: true}]}
!emit-foreach
$over: !ref $Values.workers
$as: $W
$when: !ref $W.enabled
$yield:
  kind: Pod
  name: !ref $W.name
# error: $when cannot see $as
```

</td><td>

```yaml
# $Values = {workers: [{name: w1, enabled: true}]}
!emit-foreach
$over: !ref $Values.workers
$as: $W
$filter: !ref $W.enabled
$yield:
  kind: Pod
  name: !ref $W.name
# kind: Pod / name: w1
```

</td></tr>
<tr><td>

```yaml
# $Values = {workers: [{sidecar: {kind: Sidecar}}]}
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield?: !ref $W.sidecar?
# error: $yield?: pairs with !emit-foreach?
```

</td><td>

```yaml
# $Values = {workers: [{sidecar: {kind: Sidecar}}]}
!emit-foreach?
$over: !ref $Values.workers
$as: $W
$yield?: !ref $W.sidecar?
# kind: Sidecar
```

</td></tr>
</table>

Omit `$over` (`$over: !ref $Values.workers?`) → **zero documents**. `$over?:` is an error. Omit `$when` is an error. On **`!emit-foreach?`**, omit `$yield?:` skips one document.

```yaml
# $Values = {}
!emit-foreach
$over: !ref $Values.workers?
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# stdout empty
```

## See also

- [`!foreach`](foreach.md)
- [`!emit-range`](emit-range.md)
- [`$when`](when.md)

## Comparison with Helm

`!emit-foreach` is `range` around a **whole resource**. Lists inside one spec use `!foreach`. **`!emit-foreach?`** is the same loop with `$yield?:` (skip a document when the body omits), like `$yield?:` on [`!foreach`](foreach.md).

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [{name: w1}, {name: w2}]}
{{- range .Values.workers }}
---
kind: Pod
name: {{ .name }}
{{- end }}
# kind: Pod / name: w1 / name: w2
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {workers: [{name: w1}, {name: w2}]}
!emit-foreach
$over: !ref $Values.workers?
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
# kind: Pod / name: w1 / name: w2
```

</td></tr>
<tr><th>Difference</th><td>

Same YAML documents. Omit `$over` → zero documents.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {workers: [{name: w1, enabled: true}, {name: w2, enabled: false}]}
{{- range .Values.workers }}
{{- if .enabled }}
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
# $Values = {workers: [{name: w1, enabled: true}, {name: w2, enabled: false}]}
!emit-foreach
$over: !ref $Values.workers?
$as: $Worker
$filter: !ref $Worker.enabled ?? false
$yield:
  kind: Pod
  name: !ref $Worker.name
# kind: Pod / name: w1
```

</td></tr>
<tr><th>Difference</th><td>

Same YAML documents when `enabled` is bool or missing.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {images: {api: ghcr.io/acme/api:1}}
{{- range $comp, $image := .Values.images }}
---
kind: Deployment
name: {{ $comp }}
{{- end }}
# kind: Deployment / name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {images: {api: ghcr.io/acme/api:1}}
!emit-foreach
$over: !ref $Values.images?
$as: $Image
$key: $Comp
$yield:
  kind: Deployment
  name: !ref $Comp
# kind: Deployment / name: api
```

</td></tr>
<tr><th>Difference</th><td>

Same YAML documents. Omit `$over` → zero documents.

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

Same YAML documents. Helm `if` is [`!is-not-empty`](is-not-empty.md) (omit / `""` / `[]` / `{}` / `false` / `0` / `0.0`).

</td></tr>
</table>
