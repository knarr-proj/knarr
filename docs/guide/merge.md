# `!merge`

Deep-merge mappings. Later wins. Sequences are **replaced**, not concatenated. A value, like [`!format`](format.md): bind or a field.

## Syntax

```yaml
# $Defaults = {a: 1}; $Values = {config: {b: 2}}
$Cfg: !merge
  - !ref $Defaults
  - !ref $Values.config
# $Cfg = {a: 1, b: 2}
```

- Tagged sequence of mappings.
- `$Name?: !merge` / `resources?: !merge` ↔ **every** child is omit-capable (`?.`, no `?? {}`): merge the live children; all omit → omit the value. Not the [`!concat`](concat.md) / [`!format`](format.md) law (one omit child + a literal).
- A literal or required path on `?:` is a pair error (the result would always be a mapping, so `?:` cannot fire).
- `$Name: !merge` / `resources: !merge` ↔ every child is a value (`?? {}` or a required path). Empty `[]` → `{}`.
- Pair error: `?:` + `?? {}` on a child, or a required key + an omit child.
- A live `{}` on `?:` stays `{}`. Omit only if **all** children omit.
- Map vs non-map on the same path is an error.
- No `!merge-overwrite` tag; later mapping already overwrites. Not a document. Not the whole `$then` of `!emit` (that `$then` is a YAML mapping). Allowed as `$yield` of `!emit-foreach` (result is a mapping).

## Examples

### Default probe + user overlay

```yaml
# $Values = {livenessProbe: {timeoutSeconds: 5}}
!bind
$UserProbe: !ref "$Values.livenessProbe? ?? {}"
$Probe: !merge
  - httpGet:
      path: /healthz
      port: 8080
    timeoutSeconds: 1
  - !ref $UserProbe
# $Probe = {httpGet: {path: /healthz, port: 8080}, timeoutSeconds: 5}
```

### kube container resources

```yaml
# $Values = {resources: {limits: {cpu: "1"}}}
!emit
resources: !merge
  - requests:
      cpu: "100m"
      memory: "128Mi"
  - !ref $Values.resources
# resources: {requests: {cpu: "100m", memory: "128Mi"}, limits: {cpu: "1"}}
```

User `limits:` is added; user `requests.cpu` replaces the default cpu only at that leaf; nested maps merge.

### Replace a list

```yaml
# $A = {args: [--a]}; $B = {args: [--b]}
$A:
  args: ["--a"]
$B:
  args: ["--b"]
$M: !merge
  - !ref $A
  - !ref $B
# $M = {args: [--b]}
```

Use [`!concat`](concat.md) for lists.

### Optional merge of optional maps

```yaml
# $Values = {requests: {cpu: "1"}}
!bind
$Res?: !merge
  - !ref $Values.requests?
  - !ref $Values.limits?
---
!emit
resources?: !ref $Res?
# resources: {cpu: "1"}
```

Both missing → no `$Res`. Only `requests` present → `$Res` is that mapping. Defaults plus an optional overlay stay on `$Name:` with `?? {}` (see Default probe).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {resources: {limits: {cpu: "1"}}}
!merge
  - requests:
      cpu: "100m"
  - !ref $Values.resources
# error: !merge is not a document
```

</td><td>

```yaml
# $Values = {resources: {}}
!emit
resources: !merge
  - requests:
      cpu: "100m"
  - !ref $Values.resources
# resources: {requests: {cpu: "100m"}}
```

</td></tr>
<tr><td>

```yaml
# $Values = {a: 1}
!bind
$Args: !merge
  - args: ["--a"]
  - args: ["--b"]
# $Args = {args: [--b]}
```

</td><td>

```yaml
# $Values = {a: 1}
!bind
$Args: !concat
  - ["--a"]
  - ["--b"]
# $Args = [--a, --b]
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Res?: !merge
  - requests:
      cpu: "100m"
  - !ref $Values.resources?
# error: literal child: ?: cannot fire
```

</td><td>

```yaml
# $Values = {}
!bind
$Res: !merge
  - requests:
      cpu: "100m"
  - !ref "$Values.resources? ?? {}"
# $Res = {requests: {cpu: "100m"}}
```

```yaml
# $Values = {}
!bind
$Res?: !merge
  - !ref $Values.requests?
  - !ref $Values.limits?
# no $Res
```

</td></tr>
</table>

## Omit

`$Name?: !merge` ↔ **every** child omit-capable (no `?? {}`). All omit → omit bind. A literal on `$Name?:` is a pair error.

```yaml
# $Values = {}
$Res?: !merge
  - !ref $Values.requests?
  - !ref $Values.limits?
# no $Res
```

Keep defaults: `$Name:` + `?? {}` on the overlay.

## See also

- [`!concat`](concat.md)
- [`!pick`](pick.md)

## Comparison with Helm

`!merge` is a value. Nested maps merge; sequences are replaced. Helm dest-first; knarr later mapping wins — put the dest last to match Helm on the inputs below.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {resources: {limits: {cpu: "1"}}}
resources: {{ merge .Values.resources (dict "requests" (dict "cpu" "100m")) }}
# resources: {limits: {cpu: "1"}, requests: {cpu: "100m"}}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {resources: {limits: {cpu: "1"}}}
!emit
resources: !merge
  - requests:
      cpu: "100m"
  - !ref $Values.resources
# resources: {requests: {cpu: "100m"}, limits: {cpu: "1"}}
```

</td></tr>
<tr><th>Difference</th><td>

Same result on this input. Helm dest-first; knarr later-wins (user map last). Key order may differ.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {livenessProbe: {path: /healthz}}
livenessProbe: {{ merge .Values.livenessProbe (dict "timeoutSeconds" 1) }}
# livenessProbe: {path: /healthz, timeoutSeconds: 1}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {livenessProbe: {path: /healthz}}
!emit
livenessProbe: !merge
  - timeoutSeconds: 1
  - !ref $Values.livenessProbe
# livenessProbe: {timeoutSeconds: 1, path: /healthz}
```

</td></tr>
<tr><th>Difference</th><td>

Same keys on this input. Helm dest-first; knarr later-wins (probe last). Key order may differ.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {a: 1}
args: {{ merge (dict "args" (list "--a")) (dict "args" (list "--b")) }}
# args: {args: [--b]}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {a: 1}
!emit
args: !merge
  - args: ["--a"]
  - args: ["--b"]
# args: {args: [--b]}
```

</td></tr>
<tr><th>Difference</th><td>

Same result. Sequences replace in both.

</td></tr>
</table>
