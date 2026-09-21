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
<tr><th>Helm</th><td>

```gotemplate
{{- if empty .Values.tls }}
kind: ConfigMap
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

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

</td></tr>
<tr><th>Difference</th><td>

Helm `empty` is a function in `if`; knarr `!empty` is a bool tag. Missing without `?.` still errors.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
deprecated: {{ .Values.deprecated }}
{{- if empty .Values.deprecated }}
{{- fail "remove deprecated" }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!validation
$rules:
  - !empty $Values?.deprecated
$fail: "remove deprecated"
```

</td></tr>
<tr><th>Difference</th><td>

Helm `fail` is inline; knarr `$fail` is on the validation document.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.env }}
{{- if empty .optionalNote }}
  - name: {{ .name }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
spec:
  containers:
    - env: !foreach
        $over: !ref $Values.env
        $as: $E
        $filter: !empty $E?.optionalNote
        $yield:
          name: !ref $E.name
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
