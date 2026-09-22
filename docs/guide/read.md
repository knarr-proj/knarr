# `!read`

Load **one** YAML 1.2 document as a **value** (data, not knarr). Typical: `values.yaml`, a ConfigMap file, a JSON object that is also YAML.

## Syntax

```yaml
# values.yaml = {a: 1} / config/app.yaml = {x: 1}
$Values: !read values.yaml
$config: !read config/app.yaml
# $Values = {a: 1} / $config = {x: 1}
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
# values.yaml = {name: api}
!bind
$Values: !read values.yaml
# $Values = {name: api}
```

### ConfigMap from a file

```yaml
# files/app.yaml = {a: 1}
!bind
$AppCfg: !read files/app.yaml
---
!emit
app.yaml: !to-json-str $AppCfg
# app.yaml: {"a":1}
```

(If you need the YAML text as a string, that is v2 `!to-yaml-str`; for JSON checksums use [`!to-json-str`](to-json-str.md).)

### Probe spec snippet

```yaml
# probes/http.yaml = {httpGet: {path: /}}
livenessProbe: !read probes/http.yaml
# livenessProbe: {httpGet: {path: /}}
```

inside `!bind`, then `!ref` on the Deployment.

### JSON values

`overrides.json` as a single object can be `!read` if it parses as YAML 1.2.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# probes/http.knarr = knarr tags
!bind
$Probe: !read probes/http.knarr
# error: the read file must be plain YAML data
```

</td><td>

```yaml
# probes/http.yaml = {httpGet: {path: /}}
!bind
$Probe: !read probes/http.yaml
---
!emit
livenessProbe: !ref $Probe
# livenessProbe: {httpGet: {path: /}}
```

</td></tr>
<tr><td>

```yaml
# many.yaml = two documents
!bind
$All: !read many.yaml
# error: multi-document YAML
```

</td><td>

```yaml
# a.yaml = {a: 1} / b.yaml = {b: 2}
!bind
$A: !read a.yaml
$B: !read b.yaml
# $A = {a: 1} / $B = {b: 2}
```

</td></tr>
<tr><td>

```yaml
# values.yaml = {name: api}
!bind
$Values: !import values.yaml
# error: !import splices knarr documents, not a value
```

</td><td>

```yaml
# values.yaml = {name: api}
!bind
$Values: !read values.yaml
# $Values = {name: api}
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
# values.yaml = {name: api}
values: {{ .Files.Get "values.yaml" | fromYaml }}
# values: {name: api}
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
# files/app.yaml = "a: 1\n"
app.yaml: {{ .Files.Get "files/app.yaml" }}
# app.yaml: a: 1
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
# probes/http.yaml = {httpGet: {path: /}}
livenessProbe: {{ .Files.Get "probes/http.yaml" | fromYaml }}
# livenessProbe: {httpGet: {path: /}}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# probes/http.yaml = {httpGet: {path: /}}
!bind
$Probe: !read probes/http.yaml
---
!emit
livenessProbe: !ref $Probe
# livenessProbe: {httpGet: {path: /}}
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# overrides.json = {"n":1}
extra: {{ .Files.Get "overrides.json" | fromJson }}
# extra: {n: 1.0}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `fromJson` numbers are float64. Knarr YAML/JSON numbers without `.` are int.

</td></tr>
</table>
