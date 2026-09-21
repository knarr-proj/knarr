# `!import` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `{{ define "foo" }}` / `{{ include "foo" . }}` | **Not in v1** |
| Splitting `templates/` into many files | `!import` of knarr documents |
| `{{ .Files.Get "a.yaml" }}` | [`!read`](read.md) (data, not knarr) |
| Subchart | Not a knarr concept; compose with `!import` / `!read` |

## Side by side

**Helm (named template)** — no 1:1 in v1. Approximate by emitting from a shared imported document that uses global `$Values`.

**Helm (files)**

```
templates/deploy.yaml
templates/svc.yaml
```

**knarr**

```yaml
---
!import deploy.knarr
---
!import svc.knarr
```

## Differences that bite

- `include` passes a **scope** (`.`). knarr import does not introduce a local `.`; it splices documents into one graph.
- You cannot `labels: !import x.yaml`. That would be value-import (deferred).
- Helm `_helpers.tpl` functions have no knarr twin; bind derived `$Name`s instead.
