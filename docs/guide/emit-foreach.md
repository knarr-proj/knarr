# `!emit-foreach`

Emit **N YAML documents** — one document per item.

For lists **inside** one mapping (env, ports, extra hosts), use [`!foreach`](foreach.md), not this tag.

## Syntax

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !expr "$Worker.enabled"    # optional
$key: $Kind                       # optional; only if $over is a mapping
$when: !expr "$Values.deployWorkers ?? false"  # optional gate
$yield:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: !ref $Worker.name
```

| Key | Meaning |
|-----|---------|
| `$over` | Sequence or mapping (required). Not omit; use `?? []` / `?? {}` if missing. |
| `$as` | Binding for the element (value if `$over` is a map). |
| `$yield` | Mapping = one manifest. Or `$yield?:` to skip that iteration on omit. |
| `$filter` | Bool; false → no document for that item. |
| `$key` | Extra binding for the map key (maps only). |
| `$when` | Bool gate for the **whole** loop. False → zero documents; `$over` is not evaluated. **No** `$then` / `$else`. |

There is no `$index`. `$yield` on `!emit-foreach` must be a **mapping**.

## Examples

### One Deployment per worker

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: !ref $Worker.name
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: !ref $Worker.name
    template:
      metadata:
        labels:
          app: !ref $Worker.name
      spec:
        containers:
          - name: app
            image: !ref $Worker.image
```

### Filter disabled workers

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
    name: !ref $Worker.name
```

### Range a map of component images

```yaml
---
!emit-foreach
$over: !ref $Values.images
$as: $Image
$key: $Comp
$yield:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: !ref $Comp
  spec:
    template:
      spec:
        containers:
          - name: app
            image: !ref $Image
```

Key order follows the source mapping.

### Gate the whole pack

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

## Common mistakes

**Wrong — `!foreach` as the root document** to emit many Deployments.

**Right — `!emit-foreach`.** `!foreach` only fills a **field** (a sequence).

**Wrong — `$items:`**

Removed. Use `$over` / `$as` / `$yield`.

**Wrong — `$over?:`**

**Right**

```yaml
$over: !expr "$Values?.workers ?? []"
```

**Wrong — `$as` inside document `$when`**

`$when` on `!emit-foreach` cannot see `$as`. It only gates the pack.

## See also

- [`!foreach`](foreach.md)
- [`$when`](when.md)

## Comparison with Helm

`!emit-foreach` is `range` around a **whole resource**. Lists inside one spec use `!foreach`.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- range .Values.workers }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ .name }}
---
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
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
apiVersion: v1
kind: Pod
metadata:
  name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$filter: !ref $Worker.enabled
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
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
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $comp }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit-foreach
$over: !ref $Values.images
$as: $Image
$key: $Comp
$yield:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
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
apiVersion: v1
kind: Pod
metadata:
  name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

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
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
