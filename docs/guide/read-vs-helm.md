# `!read` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `.Files.Get "foo.yaml"` | not raw bytes in v1 |
| `fromYaml (.Files.Get "foo.yaml")` | `!read foo.yaml` |
| `tpl` of a file | no `tpl` |
| `Files.Glob` | not in v1 |

## Side by side

**Helm**

```gotemplate
{{- $cfg := .Files.Get "config.yaml" | fromYaml }}
```

**knarr**

```yaml
$Cfg: !read config.yaml
```

## Differences that bite

- Helm `Files.Get` is a string; you choose `fromYaml` / `fromJson`. knarr `!read` is already a tree.
- Helm can template the file contents. knarr data files are not executed.
- Multi-doc YAML is an error (`!read-docs` later).
