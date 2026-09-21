# `!concat`

Concatenate **sequences**. Bind-only. Result is a sequence.

## Syntax

```yaml
$Args: !concat
  - !ref $Base
  - !ref $Values.extraArgs
```

- Tagged sequence of children; each child evaluates to a **sequence**.
- Only `$Name:` in `!bind` (not `$Name?:`, not `!emit`).
- Nested `!concat` is an error; list siblings instead.
- `+` does not concatenate lists.

## Examples

### Container args

```yaml
---
!bind
$Args: !concat
  - ["--verbose", "--alsologtostderr"]
  - !ref $Values.extraArgs
---
!emit
spec:
  containers:
    - name: app
      args: !ref $Args
```

### Default extra list

```yaml
$Args: !concat
  - !ref $Base
  - !expr "$Values?.extraArgs ?? []"
```

### Merge two port lists

```yaml
$Ports: !concat
  - !ref $Values.fixedPorts
  - !ref $Values.dynamicPorts
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!emit
spec:
  containers:
    - args: !concat
        - ["--verbose"]
        - !ref $Values.extraArgs
# !concat is bind-only
```

</td><td>

```yaml
---
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
spec:
  containers:
    - args: !ref $Args
# concat in bind, then !ref
```

</td></tr>
<tr><td>

```yaml
---
!emit
spec:
  containers:
    - args:
        - --verbose
        - !ref $Values.extraArgs
# a list child nests a list, it does not splice
```

</td><td>

```yaml
---
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
spec:
  containers:
    - args: !ref $Args
# splice sequences with !concat
```

</td></tr>
<tr><td>

```yaml
---
!bind
$Args: !expr "$Fixed + $Extra"
# + never concatenates lists
```

</td><td>

```yaml
---
!bind
$Args: !concat
  - !ref $Fixed
  - !ref $Extra
# list concat is !concat
```

</td></tr>
</table>

## See also

- [`!join`](join.md)
- [`!foreach`](foreach.md)

## Comparison with Helm

`!concat` is bind-only. `+` never concatenates lists.

<table>
<tr><th>Helm</th><td>

```gotemplate
args: {{ concat (list "--verbose") .Values.extraArgs }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
spec:
  containers:
    - args: !ref $Args
```

</td></tr>
<tr><th>Difference</th><td>

Helm `concat` is in the template; knarr `!concat` is bind-only, then `!ref`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ports: {{ concat .Values.fixedPorts .Values.dynamicPorts }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Ports: !concat
  - !ref $Values.fixedPorts
  - !ref $Values.dynamicPorts
```

</td></tr>
<tr><th>Difference</th><td>

Helm `concat` is in the template; knarr `!concat` is bind-only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
args:
  - --verbose
  {{- range .Values.extraArgs }}
  - {{ . }}
  {{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!bind
$Args: !concat
  - ["--verbose"]
  - !expr "$Values?.extraArgs ?? []"
```

</td></tr>
<tr><th>Difference</th><td>

Helm `range` appends in the template; knarr fills omit with `[]` then concatenates in bind.

</td></tr>
</table>
