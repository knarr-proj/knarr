# `!sha256-json`

SHA-256 of `!to-json-str` (UTF-8), hex lowercase.

Same as `!sha256` of `!to-json-str` (Go JSON canon).

## Syntax

```yaml
checksum/config: !sha256-json $Values.config
```

Tagged scalar. Mapping/seq allowed (hashed as JSON). Omit → omit.

## Examples

### Roll pods when config changes

```yaml
!emit
checksum/config: !sha256-json $Values.config
```

### Same via two binds

```yaml
$Json: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Json
```

Must equal `!sha256-json`.

### Secret data object

```yaml
checksum/secret: !sha256-json $Values.secretData
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Yaml: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Values.config
# hashing a mapping (or YAML text) does not match toJson checksums
```

</td><td>

```yaml
!emit
checksum/config: !sha256-json $Values.config
# JSON checksum is !sha256-json; YAML hash is v2
```

</td></tr>
<tr><td>

```yaml
!bind
$Pretty: !expr $Values.config
$Sum: !sha256
  $of: !ref $Pretty
# unsorted pretty JSON will not match Helm toJson | sha256sum
```

</td><td>

```yaml
!emit
checksum/config: !sha256-json $Values.config
# frozen Go JSON canon: sorted keys, HTML-escape
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
checksum/config: {{ toJson .Values.config | sha256sum }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
checksum/config: !sha256-json $Values.config
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
checksum/config: {{ toJson .Values.config | sha256sum }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Json: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Json
```

</td></tr>
<tr><th>Difference</th><td>

Two-step `!to-json-str` + `!sha256` matches `!sha256-json` if you hash the canon JSON string.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
checksum/secret: {{ toJson .Values.secretData | sha256sum }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
checksum/secret: !sha256-json $Values.secretData
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
