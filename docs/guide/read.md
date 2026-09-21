# `!read`

Load **one** YAML 1.2 document as a **value** (data, not knarr). Typical: `values.yaml`, a ConfigMap file, a JSON object that is also YAML.

**Helm:** `.Files.Get` + `fromYaml` — [vs Helm](read-vs-helm.md).

## Syntax

```yaml
$Values: !read values.yaml
$config: !read config/app.yaml
```

- Tagged scalar path, relative to the file that contains the tag. `..` and absolute paths allowed. No URI.
- Exactly **one** YAML document. Extra `---` is an error.
- JSON that is valid YAML 1.2 is OK.
- JSON/YAML `null` is an error (no null in knarr).
- Core YAML tags (`!!str`) allowed **in the file**. Knarr tags (`!ref`) in that file are errors.
- Anchors in the file are expanded to a tree.
- Not multi-doc (`!read-docs` is v2). Not raw `Files.Get` bytes.

## Examples

### Chart values

```yaml
---
!bind
$Values: !read values.yaml
```

### ConfigMap from a file

```yaml
---
!bind
$AppCfg: !read files/app.yaml
---
!emit
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.yaml: !to-json-str $AppCfg
```

(If you need the YAML text as a string, that is v2 `!to-yaml-str`; for JSON checksums use [`!to-json-str`](to-json-str.md).)

### Probe spec snippet

```yaml
livenessProbe: !read probes/http.yaml
```

inside `!bind`, then `!ref` on the Deployment.

### JSON values

`overrides.json` as a single object can be `!read` if it parses as YAML 1.2.

## Common mistakes

**Wrong — knarr tags inside the read file**

**Right —** plain YAML data. Program files use [`!import`](import.md).

**Wrong — multi-document YAML**

**Right —** one document per `!read`, or split files.

**Wrong — `$Values: !import values.yaml`**

`!import` splices knarr **documents**, not a value.

## See also

- [vs Helm](read-vs-helm.md)
- [`!import`](import.md)
- [`!from-json-str`](from-json-str.md)
