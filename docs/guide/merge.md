# `!merge`

Deep-merge mappings. Later wins. Sequences are **replaced**, not concatenated. Bind-only.

## Syntax

```yaml
$Cfg: !merge
  - !ref $Defaults
  - !ref $Values.config
```

- Tagged sequence of mappings.
- Empty `[]` → `{}`.
- Map vs non-map on the same path is an error.
- No `!merge-overwrite` tag; later mapping already overwrites.

## Examples

### Default probe + user overlay

```yaml
---
!bind
$UserProbe: !expr "$Values?.livenessProbe ?? {}"
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
---
!emit
spec:
  containers:
    - resources: !ref $Res
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

## Common mistakes

**Wrong — in `spec:`**

**Right — bind, `!ref`.**

**Wrong — expecting list concat**

**Wrong — `$Name?: !merge`**

Not allowed.

## See also

- [`!concat`](concat.md)
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
---
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
---
!bind
$UserProbe: !expr "$Values?.livenessProbe ?? {}"
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
---
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
