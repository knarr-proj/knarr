# `!import`

Splice **knarr documents** from another file into this stream, as if they were written here.

This is not a value. To load **data** (values.yaml), use [`!read`](read.md).

## Syntax

```yaml
---
!import helpers/workers.knarr
```

- Tagged **scalar**: a filesystem path, relative to the file that contains the tag.
- `..` and absolute paths are allowed. No URI, HTTP, or OCI.
- The imported file must be knarr documents (`!bind`, `!emit`, …), not bare YAML.
- After flatten, `!policy` / `!typedef` rules still apply to the combined stream.

## Examples

### Split workers into a second file

`app.knarr`:

```yaml
---
!bind
$Values: !read values.yaml
---
!import workers.knarr
---
!emit
apiVersion: v1
kind: Service
metadata:
  name: !ref $Values.name
```

`workers.knarr`:

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

`$Values` is visible in the imported file (same graph).

### Share a typedef

```yaml
---
!import types.knarr
---
!bind
$Values: !$ValuesType
  name: api
```

### Nested import

Imported files may `!import` further files. Import cycles are errors.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!emit
metadata:
  labels: !import labels.yaml
# !import is a document splice, not a field
```

</td><td>

```yaml
---
!bind
$Labels: !read labels.yaml
---
!emit
metadata:
  labels: !ref $Labels
# load a YAML tree with !read, then !ref
```

</td></tr>
<tr><td>

```yaml
---
!bind
$Values: !import values.yaml
# !import splices program documents, not a data tree
```

</td><td>

```yaml
---
!bind
$Values: !read values.yaml
# data files use !read
```

</td></tr>
<tr><td>

```yaml
---
!emit
spec:
  template: !import worker.knarr
# named snippets with $as scope are not v1
```

</td><td>

```yaml
---
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  apiVersion: v1
  kind: Pod
  metadata:
    name: !ref $W.name
# loop scope stays in this file; !import only splices documents
```

</td></tr>
</table>

## See also

- [`!read`](read.md)

## Comparison with Helm

`!import` splices **documents**. Named `define` / `include` of snippets is not v1.

<table>
<tr><th>Helm</th><td>

```gotemplate
labels:
{{ include "mychart.labels" . | nindent 2 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
metadata:
  labels:
    app: !ref $Values.name
```

</td></tr>
<tr><th>Difference</th><td>

Named `define` / `include` is not v1. Emit the mapping, or `!read` data and `!ref`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{ define "mychart.worker" }}
apiVersion: v1
kind: Pod
{{ end }}
{{ include "mychart.worker" . }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!import workers.knarr
# workers.knarr emits:
# kind: Pod
```

</td></tr>
<tr><th>Difference</th><td>

Helm `define` is a named snippet; knarr `!import` splices a whole file of documents.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
# helm template -f values.yaml
name: api
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Values: !read values.yaml
```

</td></tr>
<tr><th>Difference</th><td>

Helm `-f` is CLI merge into `.Values`; knarr loads a tree in `!bind`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
labels:
{{ include "mychart.labels" . | nindent 2 }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Labels: !read labels.yaml
---
!emit
metadata:
  labels: !ref $Labels
```

</td></tr>
<tr><th>Difference</th><td>

`include` runs a template; `!read` loads data only (no tags in that file).

</td></tr>
</table>
