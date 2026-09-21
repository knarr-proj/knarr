# `!merge`

Deep-merge mappings. Later wins. Sequences are **replaced**, not concatenated. Bind-only.

## Syntax

```yaml
$Cfg: !merge
  - !ref $Defaults
  - !ref $Values.config
```

- Tagged sequence of mappings.
- `$Name?: !merge` ↔ **every** child is omit-capable (`?.`, no `?? {}`): merge the live children; all omit → omit bind. Not the [`!concat`](concat.md) / [`!format`](format.md) law (one omit child + a literal).
- A literal or required path on `$Name?:` is a pair error (the result would always be a mapping, so `?:` cannot fire).
- `$Name: !merge` ↔ every child is a value (`?? {}` or a required path). Empty `[]` → `{}`.
- Pair error: `$Name?:` + `?? {}` on a child, or `$Name:` + an omit child.
- A live `{}` on `$Name?:` stays `{}`. Omit bind only if **all** children omit.
- Map vs non-map on the same path is an error.
- No `!merge-overwrite` tag; later mapping already overwrites. Not in `!emit`.

## Examples

### Default probe + user overlay

```yaml
!bind
$UserProbe: !ref "$Values?.livenessProbe ?? {}"
$Probe: !merge
  - httpGet:
      path: /healthz
      port: 8080
    timeoutSeconds: 1
  - !ref $UserProbe
```

### kube container resources

```yaml
$Res: !merge
  - requests:
      cpu: "100m"
      memory: "128Mi"
  - !ref $Values.resources
!emit
resources: !ref $Res
```

User `limits:` is added; user `requests.cpu` replaces the default cpu only at that leaf; nested maps merge.

### Replace a list

```yaml
$A:
  args: ["--a"]
$B:
  args: ["--b"]
$M: !merge
  - !ref $A
  - !ref $B
# args is ["--b"], not concatenated
```

Use [`!concat`](concat.md) for lists.

### Optional merge of optional maps

```yaml
!bind
$Res?: !merge
  - !ref $Values?.requests
  - !ref $Values?.limits
!emit
resources?: !ref $Res?
```

Both missing → no `$Res`. Only `requests` present → `$Res` is that mapping. Defaults plus an optional overlay stay on `$Name:` with `?? {}` (see Default probe).

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
resources: !merge
  - requests:
      cpu: "100m"
  - !ref $Values.resources
# !merge is bind-only
```

</td><td>

```yaml
!bind
$Res: !merge
  - requests:
      cpu: "100m"
  - !ref $Values.resources
!emit
resources: !ref $Res
# merge in bind, then !ref
```

</td></tr>
<tr><td>

```yaml
!bind
$Args: !merge
  - args: ["--a"]
  - args: ["--b"]
# sequences are replaced, not concatenated
```

</td><td>

```yaml
!bind
$Args: !concat
  - ["--a"]
  - ["--b"]
# glue lists with !concat
```

</td></tr>
<tr><td>

```yaml
!bind
$Res?: !merge
  - requests:
      cpu: "100m"
  - !ref $Values?.resources
# literal child: result always exists; ?: cannot fire
```

</td><td>

```yaml
!bind
$Res: !merge
  - requests:
      cpu: "100m"
  - !ref "$Values?.resources ?? {}"
# defaults stay: required bind, fill omit
```

```yaml
!bind
$Res?: !merge
  - !ref $Values?.requests
  - !ref $Values?.limits
# ?: only when every child can omit
```

</td></tr>
</table>

## See also

- [`!concat`](concat.md)
- [Omit](omit.md)
- [`!pick`](pick.md)
- [`!pick`](pick.md)
- [Omit](omit.md)

## Comparison with Helm

`!merge` is bind-only. Nested maps merge; sequences are replaced.

<table>
<tr><th>Helm</th><td>

```gotemplate
resources: {{ merge .Values.resources (dict "requests" (dict "cpu" "100m")) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$Res: !merge
  - requests:
      cpu: "100m"
      memory: "128Mi"
  - !ref $Values.resources
```

</td></tr>
<tr><th>Difference</th><td>

Helm `merge` gives precedence to the first (dest) map; knarr later mapping wins.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
livenessProbe: {{ merge .Values.livenessProbe (dict "timeoutSeconds" 1) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$UserProbe: !ref "$Values?.livenessProbe ?? {}"
$Probe: !merge
  - httpGet:
      path: /healthz
      port: 8080
    timeoutSeconds: 1
  - !ref $UserProbe
```

</td></tr>
<tr><th>Difference</th><td>

Helm `merge` dest-first; knarr later mapping wins. Missing probe is empty in Helm; knarr uses `?? {}`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
args: {{ merge (dict "args" (list "--a")) (dict "args" (list "--b")) }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!bind
$M: !merge
  - args: ["--a"]
  - args: ["--b"]
```

</td></tr>
<tr><th>Difference</th><td>

Both replace sequences (`args` is `["--b"]`). Use `!concat` to glue lists.

</td></tr>
</table>
