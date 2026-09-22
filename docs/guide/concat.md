# `!concat`

Concatenate **sequences**. Bind-only. Result is a sequence.

## Syntax

```yaml
# $Base = [--verbose]; $Values = {extraArgs: [--foo]}
$Args: !concat
  - !ref $Base
  - !ref $Values.extraArgs
# $Args = [--verbose, --foo]
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
# $Values = {extraArgs: [--foo]}
!bind
$Args: !concat
  - ["--verbose", "--alsologtostderr"]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args
# args: [--verbose, --alsologtostderr, --foo]
```

### Default extra list

```yaml
# $Base = [--verbose]; $Values = {}
$Args: !concat
  - !ref $Base
  - !ref "$Values.extraArgs? ?? []"
# $Args = [--verbose]
```

### Merge two port lists

```yaml
# $Values = {fixedPorts: [80], dynamicPorts: [443]}
$Ports: !concat
  - !ref $Values.fixedPorts
  - !ref $Values.dynamicPorts
# $Ports = [80, 443]
```

### Optional whole concat

```yaml
# $Values = {}
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
---
!emit
args?: !ref $Args?
# no args
```

Missing `extraArgs` → no `$Args` (the `"--verbose"` base is dropped too). Keep the base when extra is missing: `$Name:` + `?? []` on that child (see Default extra list).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {extraArgs: [--foo]}
!emit
args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
# error: !concat is bind-only
```

</td><td>

```yaml
# $Values = {extraArgs: [--foo]}
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args
# args: [--verbose, --foo]
```

</td></tr>
<tr><td>

```yaml
# $Values = {extraArgs: [--foo]}
!emit
args:
    - --verbose
    - !ref $Values.extraArgs
# args: [--verbose, [--foo]]
```

</td><td>

```yaml
# $Values = {extraArgs: [--foo]}
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args
# args: [--verbose, --foo]
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Args: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# error: required bind + omit child
```

</td><td>

```yaml
# $Values = {}
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# no $Args
```

```yaml
# $Values = {}
!bind
$Args: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
# $Args = [--verbose]
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
# error: ?: + ?? []
```

</td><td>

```yaml
# $Values = {}
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
# no $Args
```

</td></tr>
<tr><td>

```yaml
# $Fixed = [a]; $Extra = [b]
!bind
$Args: !expr "$Fixed + $Extra"
# error: + never concatenates lists
```

</td><td>

```yaml
# $Fixed = [a]; $Extra = [b]
!bind
$Args: !concat
  - !ref $Fixed
  - !ref $Extra
# $Args = [a, b]
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
# $Values = {extraArgs: [--foo]}
args: {{ concat (list "--verbose") (required "extraArgs" .Values.extraArgs) }}
# args: [--verbose, --foo]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {extraArgs: [--foo]}
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
# args: [--verbose, --foo]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. `required` abort = `$fail`. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {fixedPorts: [80], dynamicPorts: [443]}
ports: {{ concat (required "fixed" .Values.fixedPorts) (required "dyn" .Values.dynamicPorts) }}
# ports: [80, 443]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {fixedPorts: [80], dynamicPorts: [443]}
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
# ports: [80, 443]
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Fail text differs.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {}
args:
  - --verbose
  {{- range .Values.extraArgs }}
  - {{ . }}
  {{- end }}
# args: [--verbose]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {}
!bind
$Args: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
---
!emit
args: !ref $Args
# args: [--verbose]
```

</td></tr>
<tr><th>Difference</th><td>

Same list when `extraArgs` is missing (`[]`) or a list.

</td></tr>
</table>
