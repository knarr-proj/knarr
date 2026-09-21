# `!empty`

**Empty** test → bool.

**True** for: omit (`?.` / `$Name?` with no value), `""`, `[]`, `{}`, `false`, `0`.  
**False** for: non-empty string/seq/map, `true`, non-zero int.

Missing **without** `?.` is a path error, not empty.

Inverse: [`!not-empty`](not-empty.md).

## Syntax

```yaml
$when: !empty $Values?.tls
```

Tagged scalar `RefScalar`. Result is bool — not omit (so `$Name?: !empty` is an error).

## Examples

### Skip TLS Secret if no tls

```yaml
---
!emit
$when: !empty $Values?.tls
$then:
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: no-tls
$else: ""
```

Usually you want the opposite: [`!not-empty`](not-empty.md) to emit when TLS exists.

### Validation: field must be empty

```yaml
---
!validation
$rules:
  - !empty $Values?.deprecated
$fail: "remove deprecated"
```

### Filter empty hostnames

```yaml
$filter: !empty $E?.optionalNote
```

## Common mistakes

**Wrong — `empty()` in `!expr`**

**Wrong — `!nempty`**

Use `!not-empty`.

**Wrong — wrapping `!not !empty`**

`!not` does not wrap this tag.

**Wrong — `$when: !empty $Values.tls` without `?.`**

Missing `tls` errors.

## See also

- [`!not-empty`](not-empty.md)
- [`!and`](and.md)

## Comparison with Helm

`!empty` is true for omit, `""`, `[]`, `{}`, `false`, `0`. Missing without `?.` still errors.

<table>
<tr><th>Helm</th><th>Knarr</th></tr>
<tr><td>

```gotemplate
{{- if empty .Values.tls }}
```

</td><td>

```yaml
$when: !empty $Values?.tls
```

</td></tr>
<tr><td>

```gotemplate
{{- if empty .Values.deprecated }}{{ fail "…" }}{{- end }}
```

</td><td>

```yaml
---
!validation
$rules:
  - !empty $Values?.deprecated
$fail: "remove deprecated"
```

</td></tr>
<tr><td>

```gotemplate
{{- if empty .optionalNote }}
```

</td><td>

```yaml
$filter: !empty $E?.optionalNote
```

</td></tr>
</table>
