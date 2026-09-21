# `!join`

Join a sequence of **strings** with a separator. Bind-only. Result is a string. Split: [`!split`](split.md).

## Syntax

```yaml
$Csv: !join
  $sep: ","
  $over: !ref $Values.hosts
```

- Tagged **mapping**: `$sep` (non-empty string) + `$over` (sequence of strings).
- Empty `$over` → `""`.
- Only `$Name:` in `!bind`.

## Examples

### comma-separated hosts

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
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

## Comparison with Helm

`!join` is bind-only: `$sep` + `$over` → string.

<table>
<tr><th>Helm</th><td>

```gotemplate
hosts: {{ join "," .Values.hosts }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
!emit
hosts: !ref $HostList
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ .Values.name }}.svc.cluster.local
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
```

</td></tr>
<tr><th>Difference</th><td>

Helm concatenates in the template; knarr `!join` is bind-only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
pull: {{ join "," .Values.pullSecrets }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Pull: !join
  $sep: ","
  $over: !ref $Values.pullSecrets
```

</td></tr>
<tr><th>Difference</th><td>

Same behavior.

</td></tr>
</table>
