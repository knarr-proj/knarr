# `!join`

Join a **sequence** with a separator. Each item is coerced like [`!str`](str.md). A value, like [`!format`](format.md): bind or a field. Result is a string. Split: [`!split`](split.md).

## Syntax

```yaml
# $Values = {hosts: [a, b]}
$Csv: !join
  $sep: ","
  $over: !ref $Values.hosts
# $Csv = a,b
```

- Tagged **mapping**: `$sep` (non-empty string) + `$over` (sequence). Each item is coerced like [`!str`](str.md) after `$filter`: string as-is; int / bool / float as `!str`; seq / map is an error. Optional `$prefix` / `$suffix`: if the key is written, same as `$sep` (non-empty string; omit / `""` is an error). Missing key → no wrap on that side. Result is prefix + joined + suffix. A mapping / `?? {}` on `$over` is a sort error. Map keys or values: [`!foreach`](foreach.md) first, then join.
- Not a loop: no `$yield` / `$when` / `$key`. Optional `$filter` and `$as` together (both or neither). `$as` names the **raw** item for `$filter` only (same bool law as [`!foreach`](foreach.md): omit is an error). False → skip that item. All skipped / `[]` → `""` or just the wrap.
- `$prefix?:` / `$suffix?:` are errors. They are not part of the `$Name?:` pair.
- `$Name?: !join` ↔ omit-capable `$over` (`?.`, no `?? []`): missing collection → omit bind.
- `$Name: !join` ↔ `$over` always a value (`?? []` or a required path): empty → `""`, or just the wrap if `$prefix` / `$suffix` are set.
- Pair error: `$Name?:` + `?? []` on `$over`, or `$Name:` + omit-capable `$over` without `??`.
- Empty list value (`[]` in values) is still a string (empty or wrap), not omit bind. Omit bind only if `$over` itself omits.
- `$over?:` is an error. Not a document. Not the whole `$yield` of `!emit`. Not `$yield` of `!emit-foreach` (not a mapping).

## Examples

### comma-separated hosts

```yaml
# $Values = {hosts: [a, b]}
!emit
hosts: !join
  $sep: ","
  $over: !ref $Values.hosts
# hosts: a,b
```

### Kubernetes DNS names with dots

```yaml
# $Values = {name: api}
$Name: !join
  $sep: "."
  $over:
    - !ref $Values.name
    - svc
    - cluster
    - local
# $Name = api.svc.cluster.local
```

Ints / bools / floats join without a prior `!foreach` + `!str`. Nested seq / map items are still an error.

### Wrap after join

```yaml
# $Values = {hosts: [a, b]}
!bind
$Csv: !join
  $sep: ","
  $prefix: "["
  $suffix: "]"
  $over: !ref $Values.hosts
# $Csv = [a,b]
```

`hosts: [a, b]` → `[a,b]`. `hosts: []` → `[]`. Omit `$over` on `$Name?:` still omits the bind (no wrap). Only `$prefix` or only `$suffix` is allowed. Do not write `$prefix: ""`.

### Ports as ints

```yaml
# $Values = {ports: [80, 443]}
$Csv: !join
  $sep: ","
  $over: !ref $Values.ports
# $Csv = 80,443
```

### Skip some items

```yaml
# $Values = {ports: [80, 0, 443]}
$Csv: !join
  $sep: ","
  $over: !ref $Values.ports
  $as: $P
  $filter: !expr "$P != 0"
# $Csv = 80,443
```

`$as` without `$filter` (or `$filter` without `$as`) is an error.

### Optional hosts annotation

```yaml
# $Values = {}
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
---
!emit
metadata:
  annotations:
    hosts?: !ref $HostList?
# no hosts
```

Missing `hosts` → no `$HostList` → no annotation key. `hosts: []` in values → `hosts: ""`. Always print a string (possibly empty):

```yaml
# $Values = {}
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
---
!emit
hosts: !ref $HostList
# hosts: ""
```

### Image pull secrets annotation

```yaml
# $Values = {pullSecrets: [x, y]}
$Pull: !join
  $sep: ","
  $over: !ref $Values.pullSecrets
# $Pull = x,y
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {hosts: [a]}
!join
  $sep: ","
  $over: !ref $Values.hosts
# error: !join is not a document
```

</td><td>

```yaml
# $Values = {hosts: [a]}
!emit
hosts: !join
  $sep: ","
  $over: !ref $Values.hosts
# hosts: a
```

</td></tr>
<tr><td>

```yaml
# $Values = {hosts: [a]}
!bind
$HostList: !join
  over: !ref $Values.hosts
  sep: ","
# error: keys need $: $over / $sep
```

</td><td>

```yaml
# $Values = {hosts: [a]}
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
# $HostList = a
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts?
# error: required bind + omit-capable $over
```

</td><td>

```yaml
# $Values = {}
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
# no $HostList
```

```yaml
# $Values = {}
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
# $HostList = ""
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$HostList?: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
# error: ?: + ?? []
```

</td><td>

```yaml
# $Values = {}
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
# no $HostList
```

</td></tr>
<tr><td>

```yaml
# $Values = {labels: {app: x}}
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.labels
# error: mapping is not a sequence
```

```yaml
# $Values = {}
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? {}"
# error: ?? {} is a mapping
```

</td><td>

```yaml
# $Values = {labels: {app: x}}
!bind
$Keys: !foreach
  $over: !ref $Values.labels
  $as: $V
  $key: $K
  $yield: !ref $K
$HostList: !join
  $sep: ","
  $over: !ref $Keys
# $HostList = app
```

```yaml
# $Values = {}
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
# $HostList = ""
```

</td></tr>
<tr><td>

```yaml
# $Values = {ports: [80]}
!bind
$Ports: !join
  $sep: ","
  $over: !ref $Values.ports
  $filter: !expr "$P != 0"
# error: $filter without $as
```

</td><td>

```yaml
# $Values = {ports: [80]}
!bind
$Ports: !join
  $sep: ","
  $over: !ref $Values.ports
  $as: $P
  $filter: !expr "$P != 0"
# $Ports = "80"
```

</td></tr>
<tr><td>

```yaml
# $Values = {name: api}
!bind
$Name: !format
  - "%s-%s"
  - !ref $Values.name
  - svc
# $Name = api-svc
```

</td><td>

```yaml
# $Values = {name: api}
!bind
$Name: !join
  $sep: "-"
  $over:
    - !ref $Values.name
    - svc
# $Name = api-svc
```

</td></tr>
</table>

## Omit

`$Name?: !join` ↔ omit-capable `$over` (no `?? []`). Missing collection → omit bind. `hosts: []` → `""`, not omit.

```yaml
# $Values = {}
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
# no $HostList
```

Do not write `$HostList?:` with `$over: … ?? []`.

## See also

- [`!split`](split.md)
- [`!format`](format.md)
- [`!foreach`](foreach.md)

## Comparison with Helm

`!join` is a value: `$sep` + `$over` → string (`!str` each item). `?:` follows the same omit pair as [`!foreach`](foreach.md) on `$over`. `$filter`/`$as` are optional together; there is no `$yield`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {hosts: [a, b]}
hosts: {{ join "," (required "hosts" .Values.hosts) }}
# hosts: a,b
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {hosts: [a, b]}
!validation
$rules:
  - !is-not-empty $Values.hosts?
$fail: "hosts"
---
!emit
hosts: !join
  $sep: ","
  $over: !ref $Values.hosts
# hosts: a,b
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {name: api}
name: {{ required "name" .Values.name }}.svc.cluster.local
# name: api.svc.cluster.local
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {name: api}
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
  - !is-not-empty $Values.name?
$fail: "name"
---
!emit
name: !ref $Name
# name: api.svc.cluster.local
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {pullSecrets: [x, y]}
pull: {{ join "," (required "pullSecrets" .Values.pullSecrets) }}
# pull: x,y
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {pullSecrets: [x, y]}
!bind
$Pull: !join
  $sep: ","
  $over: !ref $Values.pullSecrets
---
!validation
$rules:
  - !is-not-empty $Values.pullSecrets?
$fail: "pullSecrets"
---
!emit
pull: !ref $Pull
# pull: x,y
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

</td></tr>
</table>
