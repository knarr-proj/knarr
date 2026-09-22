# `!concat`

Concatenate **sequences**. Bind-only. Result is a sequence.

## Syntax

```yaml
$Args: !concat
  - !ref $Base
  - !ref $Values.extraArgs
```

- Tagged sequence of children; each child evaluates to a **sequence**.
- `$Name?: !concat` ↔ an omit-capable child (`?.`, no `?? []`): any omit child → omit **the whole bind** (siblings are not skipped).
- `$Name: !concat` ↔ every child is a value (`?? []` or a required path): empty / all `[]` → `[]`.
- Pair error: `$Name?:` without an omit path (or every child has `?? []`), or `$Name:` + an omit child.
- An empty list **value** (`[]`) still concatenates, even on `$Name?:`. Omit bind only if a child itself omits.
- Nested `!concat` is an error; list siblings instead. Not in `!emit`.
- `+` does not concatenate lists.

## Examples

### Container args

```yaml
!bind
$Args: !concat
  - ["--verbose", "--alsologtostderr"]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args
```

### Default extra list

```yaml
$Args: !concat
  - !ref $Base
  - !ref "$Values.extraArgs? ?? []"
```

### Merge two port lists

```yaml
$Ports: !concat
  - !ref $Values.fixedPorts
  - !ref $Values.dynamicPorts
```

### Optional whole concat

```yaml
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
---
!emit
args?: !ref $Args?
```

Missing `extraArgs` → no `$Args` (the `"--verbose"` base is dropped too). Keep the base when extra is missing: `$Name:` + `?? []` on that child (see Default extra list).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
# !concat is bind-only
```

</td><td>

```yaml
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args
# concat in bind, then !ref
```

</td></tr>
<tr><td>

```yaml
!emit
args:
    - --verbose
    - !ref $Values.extraArgs
# a list child nests a list, it does not splice
```

</td><td>

```yaml
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args
# splice sequences with !concat
```

</td></tr>
<tr><td>

```yaml
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# required bind + omit child is a pair error
```

</td><td>

```yaml
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# $Name?: omits the whole concat if extraArgs is missing
```

```yaml
!bind
$Args: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
# required bind: fill omit so every child is a list
```

</td></tr>
<tr><td>

```yaml
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
# ?: + ?? [] : the bind cannot vanish
```

</td><td>

```yaml
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# omit child omits the bind
```

</td></tr>
<tr><td>

```yaml
!bind
$Args: !expr "$Fixed + $Extra"
# + never concatenates lists
```

</td><td>

```yaml
!bind
$Args: !concat
  - !ref $Fixed
  - !ref $Extra
# list concat is !concat
```

</td></tr>
</table>

## Omit

`$Name?: !concat` ↔ an omit-capable child (no `?? []`). Any omit child drops the **whole** bind.

```yaml
# $Values = {}
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# no $Args
```

Keep the base: `$Name:` + `?? []` on that child.

## See also

- [`!join`](join.md)
- [`!foreach`](foreach.md)
- [`!format`](format.md)

## Comparison with Helm

`!concat` is bind-only. `+` never concatenates lists. `$Name?:` follows the same omit pair as [`!format`](format.md): any omit child drops the whole bind. A literal sibling on `$Name?:` is allowed (unlike [`!merge`](merge.md), where every child must be omit-capable).

<table>
<tr><th>Helm</th><td>

```gotemplate
args: {{ concat (list "--verbose") (required "extraArgs" .Values.extraArgs) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!validation
$rules:
  - !is-not-empty $Values.extraArgs?
$fail: "extraArgs"
---
!emit
args: !ref $Args
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ports: {{ concat (required "fixed" .Values.fixedPorts) (required "dyn" .Values.dynamicPorts) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Ports: !concat
  - !ref $Values.fixedPorts
  - !ref $Values.dynamicPorts
---
!validation
$rules:
  - !is-not-empty $Values.fixedPorts?
  - !is-not-empty $Values.dynamicPorts?
$fail: "fixed"
---
!emit
ports: !ref $Ports
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

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
!bind
$Args: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
---
!emit
args: !ref $Args
```

</td></tr>
<tr><th>Difference</th><td>

Same list when `extraArgs` is missing (`[]`) or a list.

</td></tr>
</table>
