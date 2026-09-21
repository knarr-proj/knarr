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
---
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
---
!emit
apiVersion: v1
kind: ConfigMap
data:
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

**Wrong — in `!emit`**

**Right — bind, `!ref`.**

**Wrong — `over:` without `$`**

**Wrong — joining ints**

`!str` each element first, or `!foreach` + `!str`.

**Wrong — `%s-%s` when `!join` is enough**

Either is valid; `!join` is simpler for one delimiter.

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
---
!bind
$HostList: !join
  $sep: ","
  $over: !ref $Values.hosts
---
!emit
data:
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
---
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
---
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
