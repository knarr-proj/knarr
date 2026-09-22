# `!split`

Split a **string** on a separator. A value, like [`!join`](join.md): bind or a field. Result is a sequence of strings.

## Syntax

```yaml
# $Values = {hostCsv: "a,b"}
$Parts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# $Parts = [a, b]
```

- `$sep` non-empty string; `$of` string (`""` → `[]`). Not `$over` (that key is a collection: [`!join`](join.md) / [`!foreach`](foreach.md)).
- `$Name?: !split` / `parts?: !split` ↔ omit-capable `$of` (`?.`, no `?? ''`): missing string → omit the value.
- `$Name: !split` / `parts: !split` ↔ `$of` always a value (`?? ''` or a required path): empty → `[]`.
- Pair error: `?:` + `?? ''` on `$of`, or a required key + omit-capable `$of` without `??`.
- Empty string value stays `[]` even on `?:`. Omit only if `$of` itself omits.
- `$of?:` is an error. Not a document. Not the whole `$then` of `!emit`. Not `$yield` of `!emit-foreach` (not a mapping).

## Examples

### CSV hosts → list

```yaml
# $Values = {hostCsv: "a,b"}
!emit
hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# hosts: [a, b]
```

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
---
!emit
hostAliases: !foreach
  $over: !ref $Hosts
  $as: $H
  $yield:
    ip: "127.0.0.1"
    hostnames:
      - !ref $H
# hostAliases: [{ip: "127.0.0.1", hostnames: [a]}, {ip: "127.0.0.1", hostnames: [b]}]
```

### Image repo / tag

```yaml
# $Values = {image: "repo:tag"}
$Bits: !split
  $sep: ":"
  $of: !ref $Values.image
# $Bits = [repo, tag]
```

Then index with `!expr` / `!len` (no `[-1]`).

### Newline lists

```yaml
# $Values = {allowlist: "a\nb"}
$Lines: !split
  $sep: "\n"
  $of: !ref $Values.allowlist
# $Lines = [a, b]
```

### Optional CSV

```yaml
# $Values = {}
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values.hostCsv?
---
!emit
hostAliases?: !foreach
  $over: !ref $Hosts?
  $as: $H
  $yield:
    hostnames:
      - !ref $H
# no hostAliases
```

Missing `hostCsv` → no `$Hosts` → no key. `hostCsv: ""` → `$Hosts: []`. Always keep a list:

```yaml
# $Values = {}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref "$Values.hostCsv? ?? ''"
# $Hosts = []
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !split
  $sep: ""
  $of: !ref $Values.hostCsv
# error: empty $sep
```

</td><td>

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# $Hosts = [a, b]
```

</td></tr>
<tr><td>

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !split
  $sep: ","
  $over: !ref $Values.hostCsv
# error: $over is a collection; split input is $of
```

</td><td>

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# $Hosts = [a, b]
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv?
# error: required bind + omit-capable $of
```

</td><td>

```yaml
# $Values = {}
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values.hostCsv?
# no $Hosts
```

```yaml
# $Values = {}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref "$Values.hostCsv? ?? ''"
# $Hosts = []
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref "$Values.hostCsv? ?? ''"
# error: ?: + ?? ''
```

</td><td>

```yaml
# $Values = {}
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values.hostCsv?
# no $Hosts
```

</td></tr>
<tr><td>

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !expr "split(',', $Values.hostCsv)"
# error: no split() in !expr
```

</td><td>

```yaml
# $Values = {hostCsv: "a,b"}
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# $Hosts = [a, b]
```

</td></tr>
</table>

## Omit

`$Name?: !split` ↔ omit-capable `$of` (no `?? ''`). Missing → omit bind. `hostCsv: ""` → `[]`.

```yaml
# $Values = {}
$Hosts?: !split
  $sep: ","
  $of: !ref $Values.hostCsv?
# no $Hosts
```

## See also

- [`!join`](join.md)
- [`!foreach`](foreach.md)

## Comparison with Helm

`!split` is a value and returns a **list**. Sprig `split` returns a dict of `_0`, `_1`. `?:` follows the same omit pair as [`!join`](join.md), on `$of` not `$over`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {hostCsv: "a,b"}
hosts: {{ splitList "," .Values.hostCsv }}
# hosts: [a, b]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {hostCsv: "a,b"}
!emit
hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
# hosts: [a, b]
```

</td></tr>
<tr><th>Difference</th><td>

Same list when `hostCsv` is present.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {image: "repo:tag"}
bits: {{ split ":" .Values.image }}
# bits: {_0: repo, _1: tag}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `split` returns a dict `_0`, `_1`. Knarr `!split` returns a list.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {allowlist: "a\nb"}
lines: {{ splitList "\n" .Values.allowlist }}
# lines: [a, b]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {allowlist: "a\nb"}
!emit
lines: !split
  $sep: "\n"
  $of: !ref $Values.allowlist
# lines: [a, b]
```

</td></tr>
<tr><th>Difference</th><td>

Same list when `allowlist` is present.

</td></tr>
</table>
