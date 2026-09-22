# `!read`

Load **one** YAML 1.2 document as a **value** (data, not knarr). Typical: `values.yaml`, a ConfigMap file, a JSON object that is also YAML.

## Syntax

```yaml
$Values: !read values.yaml
$config: !read config/app.yaml
```

- Tagged scalar path, relative to the file that contains the tag. `..` and absolute paths allowed. No URI.
- Exactly **one** YAML document. Extra `---` is an error.
- JSON that is valid YAML 1.2 is OK.
- JSON/YAML `a: null` ≡ no `a`. Root `null` ≡ omit of the `!read` value. A sequence item `null` is an error.
- Core YAML tags (`!!str`) allowed **in the file**. Knarr tags (`!ref`) in that file are errors.
- Anchors in the file are expanded to a tree.
- Not multi-doc (`!read-docs` is v2). Not raw file bytes.

## Examples

### Chart values

```yaml
!bind
$Values: !read values.yaml
```

### ConfigMap from a file

```yaml
!bind
$AppCfg: !read files/app.yaml
---
!emit
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

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Probe: !read probes/http.knarr
# the read file must be plain YAML data, not knarr tags
```

</td><td>

```yaml
!bind
$Probe: !read probes/http.yaml
---
!emit
livenessProbe: !ref $Probe
# data files use !read; program files use !import
```

</td></tr>
<tr><td>

```yaml
!bind
$All: !read many.yaml
# multi-document YAML is an error
```

</td><td>

```yaml
!bind
$A: !read a.yaml
$B: !read b.yaml
# one document per !read, or split files
```

</td></tr>
<tr><td>

```yaml
!bind
$Values: !import values.yaml
# !import splices knarr documents, not a value
```

</td><td>

```yaml
!bind
$Values: !read values.yaml
# load a YAML tree with !read
```

</td></tr>
</table>

## See also

- [`!import`](import.md)
- [`!from-json-str`](from-json-str.md)

## Comparison with Helm

`!read` loads one YAML **tree**. It does not execute templates in that file.

<table>
<tr><th>Helm</th><td>

```gotemplate
values: {{ .Files.Get "values.yaml" | fromYaml }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm embeds `Files.Get | fromYaml` in a field. Knarr `!read` is a bind tree, not that stdout.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
app.yaml: {{ .Files.Get "files/app.yaml" }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `Get` is raw text. Knarr `!read` YAML-parses the file.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
livenessProbe: {{ .Files.Get "probes/http.yaml" | fromYaml }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Probe: !read probes/http.yaml
---
!emit
livenessProbe: !ref $Probe
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
extra: {{ .Files.Get "overrides.json" | fromJson }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `fromJson` numbers are float64. Knarr YAML/JSON numbers without `.` are int.

</td></tr>
</table>
