# `!sha256-json`

SHA-256 of `!to-json-str` (UTF-8), hex lowercase.

Same as `!sha256` of `!to-json-str` (Go JSON canon).

## Syntax

```yaml
# $Values = {config: {a: 1}}
checksum/config: !sha256-json $Values.config
# checksum/config: 015abd7f…
```

Tagged scalar. Mapping/seq allowed (hashed as JSON). Omit → omit.

## Examples

### Roll pods when config changes

```yaml
# $Values = {config: {a: 1}}
!emit
checksum/config: !sha256-json $Values.config
# checksum/config: 015abd7f…
```

### Same via two binds

```yaml
# $Values = {config: {a: 1}}
$Json: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Json
# $Sum = 015abd7f…
```

Must equal `!sha256-json`.

### Secret data object

```yaml
# $Values = {secretData: {k: v}}
checksum/secret: !sha256-json $Values.secretData
# checksum/secret: 666c1aa0…
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$Yaml: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Values.config
# error: hashing a mapping does not match toJson checksums
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!emit
checksum/config: !sha256-json $Values.config
# checksum/config: 015abd7f…
```

</td></tr>
<tr><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$Pretty: !expr $Values.config
$Sum: !sha256
  $of: !ref $Pretty
# error: unsorted pretty JSON will not match Helm toJson | sha256sum
```

</td><td>

```yaml
# $Values = {config: {a: 1}}
!emit
checksum/config: !sha256-json $Values.config
# checksum/config: 015abd7f…
```

</td></tr>
</table>

## See also

- [`!to-json-str`](to-json-str.md)
- [`!sha256`](sha256.md)

## Comparison with Helm

`!sha256-json` is `toJson | sha256sum` (sorted keys, HTML-escape).

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {config: {a: 1}}
checksum/config: {{ toJson (required "config" .Values.config) | sha256sum }}
# checksum/config: 015abd7f…
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$Sum: !sha256-json $Values.config
---
!validation
$rules:
  - !is-not-empty $Values.config?
$fail: "config"
---
!emit
checksum/config: !ref $Sum
# checksum/config: 015abd7f…
```

</td></tr>
<tr><th>Difference</th><td>

Same digest. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {config: {a: 1}}
checksum/config: {{ toJson .Values.config | sha256sum }}
# checksum/config: 015abd7f…
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {config: {a: 1}}
!bind
$Json: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Json
---
!emit
checksum/config: !ref $Sum
# checksum/config: 015abd7f…
```

</td></tr>
<tr><th>Difference</th><td>

Same digest as `toJson | sha256sum` when `config` is present.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {secretData: {k: v}}
checksum/secret: {{ toJson (required "secret" .Values.secretData) | sha256sum }}
# checksum/secret: 666c1aa0…
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {secretData: {k: v}}
!bind
$Sum: !sha256-json $Values.secretData
---
!validation
$rules:
  - !is-not-empty $Values.secretData?
$fail: "secret"
---
!emit
checksum/secret: !ref $Sum
# checksum/secret: 666c1aa0…
```

</td></tr>
<tr><th>Difference</th><td>

Same digest. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>
