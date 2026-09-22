# `!join`

Join a sequence of **strings** with a separator. Bind-only. Result is a string. Split: [`!split`](split.md).

## Syntax

```yaml
$Csv: !join
  $sep: ","
  $over: !ref $Values.hosts
```

- Tagged **mapping**: `$sep` (non-empty string) + `$over` (sequence of **strings** only). Optional `$prefix` / `$suffix`: if the key is written, same as `$sep` (non-empty string; omit / `""` is an error). Missing key → no wrap on that side. Result is prefix + joined + suffix. A mapping / `?? {}` on `$over` is a sort error. Map keys or values: [`!foreach`](foreach.md) first, then join.
- `$prefix?:` / `$suffix?:` are errors. They are not part of the `$Name?:` pair.
- `$Name?: !join` ↔ omit-capable `$over` (`?.`, no `?? []`): missing collection → omit bind.
- `$Name: !join` ↔ `$over` always a value (`?? []` or a required path): empty → `""`, or just the wrap if `$prefix` / `$suffix` are set.
- Pair error: `$Name?:` + `?? []` on `$over`, or `$Name:` + omit-capable `$over` without `??`.
- Empty list value (`[]` in values) is still a string (empty or wrap), not omit bind. Omit bind only if `$over` itself omits.
- `$over?:` is an error. Not in `!emit`.

## Examples

### comma-separated hosts

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
---
!emit
hosts: !ref $HostList
```

### Kubernetes DNS names with dots

```yaml
$Name: !join
  $sep: "."
  $over:
    - !ref $Values.name
    - svc
    - cluster
    - local
```

`$over` must be a sequence of strings — build it with `!foreach` in bind if needed.

### Wrap after join

```yaml
!bind
$Csv: !join
  $sep: ","
  $prefix: "["
  $suffix: "]"
  $over: !ref $Values.hosts
```

`hosts: [a, b]` → `[a,b]`. `hosts: []` → `[]`. Omit `$over` on `$Name?:` still omits the bind (no wrap). Only `$prefix` or only `$suffix` is allowed. Do not write `$prefix: ""`.

### Optional hosts annotation

```yaml
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
---
!emit
metadata:
  annotations:
    hosts?: !ref $HostList?
```

Missing `hosts` → no `$HostList` → no annotation key. `hosts: []` in values → `hosts: ""`. Always print a string (possibly empty):

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
---
!emit
hosts: !ref $HostList
```

### Image pull secrets annotation

```yaml
$Pull: !join
  $sep: ","
  $over: !ref $Values.pullSecrets
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
hosts: !join
  $sep: ","
  $over: !ref $Values.hosts
# !join is bind-only
```

</td><td>

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
---
!emit
hosts: !ref $HostList
# join in bind, then !ref
```

</td></tr>
<tr><td>

```yaml
!bind
$HostList: !join
  over: !ref $Values.hosts
  sep: ","
# keys need $: $over / $sep
```

</td><td>

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
# $sep and $over are the join keys
```

</td></tr>
<tr><td>

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts?
# required bind + omit-capable $over is a pair error
```

</td><td>

```yaml
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
# $Name?: omits when hosts is missing
```

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
# required bind: fill omit so $over is a list
```

</td></tr>
<tr><td>

```yaml
!bind
$HostList?: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
# ?: + ?? [] : the bind cannot vanish
```

</td><td>

```yaml
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
# omit $over omits the bind
```

</td></tr>
<tr><td>

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.labels
# mapping is not a sequence of strings
```

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? {}"
# ?? {} is a mapping; join $over is a list
```

</td><td>

```yaml
!bind
$Keys: !foreach
  $over: !ref $Values.labels
  $as: $V
  $key: $K
  $yield: !ref $K
$HostList: !join
  $sep: ","
  $over: !ref $Keys
# map keys: foreach first
```

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
# list default is ?? []
```

</td></tr>
<tr><td>

```yaml
!bind
$Ports: !join
  $sep: ","
  $over: !ref $Values.ports
# joining ints is an error
```

</td><td>

```yaml
!bind
$StrPorts: !foreach
  $over: !ref $Values.ports
  $as: $P
  $yield: !str $P
$Ports: !join
  $sep: ","
  $over: !ref $StrPorts
# !str each element first
```

</td></tr>
<tr><td>

```yaml
!bind
$Name: !format
  - "%s-%s"
  - !ref $Values.name
  - svc
# a single delimiter does not need !format
```

</td><td>

```yaml
!bind
$Name: !join
  $sep: "-"
  $over:
    - !ref $Values.name
    - svc
# one delimiter — !join
```

</td></tr>
</table>

## See also

- [`!split`](split.md)
- [`!format`](format.md)
- [`!foreach`](foreach.md)
- [Omit](omit.md)

## Comparison with Helm

`!join` is bind-only: `$sep` + `$over` → string. `$Name?:` follows the same omit pair as [`!foreach`](foreach.md).

<table>
<tr><th>Helm</th><td>

```gotemplate
hosts: {{ join "," (required "hosts" .Values.hosts) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
---
!validation
$rules:
  - !not-empty $Values.hosts?
$fail: "hosts"
---
!emit
hosts: !ref $HostList
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ required "name" .Values.name }}.svc.cluster.local
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Name: !join
  $sep: "."
  $over:
    - !ref $Values.name
    - svc
    - cluster
    - local
---
!validation
$rules:
  - !not-empty $Values.name?
$fail: "name"
---
!emit
name: !ref $Name
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
pull: {{ join "," (required "pullSecrets" .Values.pullSecrets) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Pull: !join
  $sep: ","
  $over: !ref $Values.pullSecrets
---
!validation
$rules:
  - !not-empty $Values.pullSecrets?
$fail: "pullSecrets"
---
!emit
pull: !ref $Pull
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

</td></tr>
</table>
