# `!split`

Split a **string** on a separator. Bind-only. Result is a sequence of strings.

## Syntax

```yaml
$Parts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
```

- `$sep` non-empty string; `$of` string (may be `""` → `[]`).
- Only `$Name:` in `!bind`.

## Examples

### CSV hosts → list

```yaml
---
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
---
!emit
spec:
  hostAliases: !foreach
    $over: !ref $Hosts
    $as: $H
    $yield:
      ip: "127.0.0.1"
      hostnames:
        - !ref $H
```

### Image repo / tag

```yaml
$Bits: !split
  $sep: ":"
  $of: !ref $Values.image
```

Then index with `!expr` / `!len` (no `[-1]`).

### Newline lists

```yaml
$Lines: !split
  $sep: "\n"
  $of: !ref $Values.allowlist
```

## Common mistakes

**Wrong — empty `$sep`**

Error.

**Wrong — splitting in `!expr`**

No `split()` function.

## See also

- [`!join`](join.md)
- [`!foreach`](foreach.md)

## Comparison with Helm

`!split` returns a **list**. Sprig `split` returns a dict of `_0`, `_1`.

<table>
<tr><th>Helm</th><td>

```gotemplate
hosts: {{ splitList "," .Values.hostCsv }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
bits: {{ split ":" .Values.image }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Bits: !split
  $sep: ":"
  $of: !ref $Values.image
```

</td></tr>
<tr><th>Difference</th><td>

Helm `split` returns a dict `_0`, `_1`; knarr `!split` returns a list.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
lines: {{ splitList "\n" .Values.allowlist }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Lines: !split
  $sep: "\n"
  $of: !ref $Values.allowlist
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
