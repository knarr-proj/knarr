# `!import`

Splice **knarr documents** from another file into this stream, as if they were written here.

This is not a value. To load **data** (values.yaml), use [`!read`](read.md).

## Syntax

```yaml
# $Values = {workers: [{name: w1}]}
!import helpers/workers.knarr
# kind: Pod / name: w1
```

- Tagged **scalar**: a filesystem path, relative to the file that contains the tag.
- `..` and absolute paths are allowed. No URI, HTTP, or OCI.
- The imported file must be knarr documents (`!bind`, `!emit`, …), not bare YAML.
- After flatten, `!policy` / `!typedef` rules still apply to the combined stream.

## Examples

### Split workers into a second file

`app.knarr`:

```yaml
# values.yaml = {name: api, workers: [{name: w1}]}
!bind
$Values: !read values.yaml
---
!import workers.knarr
---
!emit
kind: Service
name: !ref $Values.name
# kind: Pod / name: w1  then  kind: Service / name: api
```

`workers.knarr`:

```yaml
# $Values = {workers: [{name: w1}]}
!emit-foreach
$over: !ref $Values.workers
$as: $Worker
$yield:
  kind: Pod
  name: !ref $Worker.name
# kind: Pod / name: w1
```

`$Values` is visible in the imported file (same graph).

### Share a typedef

```yaml
# types.knarr = !typedef $ValuesType {name: string}
!import types.knarr
---
!bind
$Values: !$ValuesType
  name: api
# $Values = {name: api}
```

### Nested import

Imported files may `!import` further files. Import cycles are errors.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# labels.yaml = {app: a}
!emit
labels: !import labels.yaml
# error: !import is a document splice, not a field
```

</td><td>

```yaml
# labels.yaml = {app: a}
!bind
$Labels: !read labels.yaml
---
!emit
labels: !ref $Labels
# labels: {app: a}
```

</td></tr>
<tr><td>

```yaml
# values.yaml = {name: api}
!bind
$Values: !import values.yaml
# error: !import splices program documents, not a data tree
```

</td><td>

```yaml
# values.yaml = {name: api}
!bind
$Values: !read values.yaml
# $Values = {name: api}
```

</td></tr>
<tr><td>

```yaml
# $Values = {workers: [{name: w1}]}
!emit
template: !import worker.knarr
# error: named snippets with $as scope are not v1
```

</td><td>

```yaml
# $Values = {workers: [{name: w1}]}
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# kind: Pod / name: w1
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
# $Values = {}
labels:
{{ include "mychart.labels" . | nindent 2 }}
# labels: …
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Named `define` / `include` is not v1.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
{{ define "mychart.worker" }}
kind: Pod
{{ end }}
{{ include "mychart.worker" . }}
# kind: Pod
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `define` is a named snippet. Knarr `!import` splices a whole file of documents.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```yaml
# $Values = {name: api}
# helm template -f values.yaml
name: api
# name: api
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `-f` is CLI merge into `.Values`. Knarr has no `-f`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
labels:
{{ include "mychart.labels" . | nindent 2 }}
# labels: …
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

`include` runs a template. `!read` loads data only.

</td></tr>
</table>
