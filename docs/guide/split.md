# `!split`

Split a **string** on a separator. Bind-only. Result is a sequence of strings.

## Syntax

```yaml
$Parts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
```

- `$sep` non-empty string; `$of` string (`""` → `[]`). Not `$over` (that key is a collection: [`!join`](join.md) / [`!foreach`](foreach.md)).
- `$Name?: !split` ↔ omit-capable `$of` (`?.`, no `?? ''`): missing string → omit bind.
- `$Name: !split` ↔ `$of` always a value (`?? ''` or a required path): empty → `[]`.
- Pair error: `$Name?:` + `?? ''` on `$of`, or `$Name:` + omit-capable `$of` without `??`.
- Empty string value stays `[]` even on `$Name?:`. Omit bind only if `$of` itself omits.
- `$of?:` is an error. Not in `!emit`.

## Examples

### CSV hosts → list

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
!emit
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

### Optional CSV

```yaml
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values?.hostCsv
!emit
hostAliases?: !foreach
  $over: !ref $Hosts?
  $as: $H
  $yield:
    hostnames:
      - !ref $H
```

Missing `hostCsv` → no `$Hosts` → no key. `hostCsv: ""` → `$Hosts: []`. Always keep a list:

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref "$Values?.hostCsv ?? ''"
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!bind
$Hosts: !split
  $sep: ""
  $of: !ref $Values.hostCsv
# empty $sep is an error
```

</td><td>

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# $sep must be a non-empty string
```

</td></tr>
<tr><td>

```yaml
!bind
$Hosts: !split
  $sep: ","
  $over: !ref $Values.hostCsv
# $over is a collection; split input is $of
```

</td><td>

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# string operand is $of
```

</td></tr>
<tr><td>

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values?.hostCsv
# required bind + omit-capable $of is a pair error
```

</td><td>

```yaml
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values?.hostCsv
# $Name?: omits when hostCsv is missing
```

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref "$Values?.hostCsv ?? ''"
# required bind: fill omit so $of is a string
```

</td></tr>
<tr><td>

```yaml
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref "$Values?.hostCsv ?? ''"
# ?: + ?? '' : the bind cannot vanish
```

</td><td>

```yaml
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values?.hostCsv
# omit $of omits the bind
```

</td></tr>
<tr><td>

```yaml
!bind
$Hosts: !expr "split(',', $Values.hostCsv)"
# no split() in !expr
```

</td><td>

```yaml
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# split is the !split tag
```

</td></tr>
</table>

## See also

- [`!join`](join.md)
- [`!foreach`](foreach.md)
- [Omit](omit.md)

## Comparison with Helm

`!split` returns a **list**. Sprig `split` returns a dict of `_0`, `_1`. `$Name?:` follows the same omit pair as [`!join`](join.md), on `$of` not `$over`.

<table>
<tr><th>Helm</th><td>

```gotemplate
hosts: {{ splitList "," .Values.hostCsv }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
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
