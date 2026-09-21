# `!import`

Splice **knarr documents** from another file into this stream, as if they were written here.

This is not a value. To load **data** (values.yaml), use [`!read`](read.md).

**Helm:** `{{ include }}` / `{{ define }}` are **not** v1. File split is document splice — [vs Helm](import-vs-helm.md).

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

**Wrong — import as a field**

```yaml
labels: !import labels.yaml
```

**Right — `!import` is a document.** For a YAML object of labels, `!read` into a bind, then `!ref`.

**Wrong — import a values.yaml (no knarr tags)**

**Right**

```yaml
$Values: !read values.yaml
```

**Wrong — expecting Helm `define` scope with `$as`**

Named template fragments with loop scope are not in v1.

## See also

- [vs Helm](import-vs-helm.md)
- [`!read`](read.md)
