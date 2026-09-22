# Omit (`?:`, path `?`, `??`, `$Name?`)

knarr never drops a key because a value is empty-looking. Absence is always **written**. YAML/JSON **`a: null`** / `a: ~` / `a:` ≡ **no `a`** (not a value). Helm `a: null` is the same as knarr without `a`. Stdout never prints `null`. A sequence item `null` is an error.

This page is the **hub** for omit markers. Tag guides (`!ref`, `!expr`, `!foreach`, …) keep one or two local examples and link here. Do not copy this page into every construct.

## Syntax

| Marker | Where | Meaning |
|--------|--------|---------|
| `key?:` | stdout / `$yield` mapping key | This **key** may be absent in output |
| `!emit?` | document tag | The **document** may be absent (`$when` false; omit `$when` still errors) |
| `?` on a path field | `!ref` / `!expr` / `!not` / coerce (`$Values.tls?`, `$Values.ingress?.enabled?`) | That **field** may be absent → **omit value**, not error. No `?.` operator. |
| `$Name?:` | bind key | Optional bind; elsewhere write **`$Name?`** |
| `??` | one on the whole `!ref` or `!expr` (not `!not`) | Default of that value; key stays |

Leaf omit needs **both** `?:` on the key and an omit-capable value.

Optional mapping: every child is `?:` iff the parent is. Empty optional `{}` → parent omitted (no `spec: {}`). An empty list `[]` is a **value** (the key stays), except [`!foreach`](foreach.md) on `имя?:` with `$yield?:` and nothing to print — then the key is absent. To skip other empty lists the Helm way, use [`!not-empty`](not-empty.md) with [`!match`](match.md) on a `?:` key, or `$when` / `$filter` — not `!empty` as the field value.

## Examples

### Optional affinity

```yaml
affinity?: !ref $Values.affinity?
```

### Default host vs omit

```yaml
# default — key stays
host: !ref "$Values.tls?.host ?? 'localhost'"
# omit
host?: !ref $Values.tls?.host
```

Do **not** put `?:` on a key that uses `??`.

### Formula default

```yaml
$when: !expr "$Values.a? || $Values.b? ?? false"
$sum: !expr "$Values.a? + $Values.b? ?? 0"
```

`true || omit` is true. A path with no operator is [`!ref`](ref.md) (not `!expr`). A constant is YAML.

### Optional bind

```yaml
!bind
$Tls?: !ref $Values.tls?
---
!emit
tls?: !ref $Tls?
cert?: !ref $Tls?.cert
```

`$Tls` without `?` is an error.

### N-way default

`??` cannot chain. Use [`!pick`](pick.md):

```yaml
name: !pick
  - !ref $Values.name?
  - !ref $Values.fullname?
  - app
```

### Skip foreach item

```yaml
$yield?: !ref $Worker.sidecar?
```

### Empty foreach omits the key

```yaml
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

Missing `env` → no key. `env: []` in values → `env: []` (`$yield:`). Nothing to print on `env?:` + `$yield?:` → no key:

```yaml
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name?
```

`env?:` + `$yield?:` + `$over: … ?? []` is allowed (missing → `[]` → no key). `env?:` + `$yield:` + `?? []` is a pair error. Always keep the key:

```yaml
env: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

`[]` from [`!ref`](ref.md) is not omitted. Drop an empty list with [`!not-empty`](not-empty.md):

```yaml
initContainers?: !match
  $if: !not-empty $Values.init?
  $then: !ref $Values.init
```

No `$else` + `?:` → no key when `init` is missing or `[]`. Do not write `initContainers?: !empty $Values.init?` — that is a bool.

### Optional join bind

```yaml
!bind
$HostList?: !join
  $sep: ","
  $over: !ref $Values.hosts?
---
!emit
hosts?: !ref $HostList?
```

Missing `hosts` → no `$HostList`. `hosts: []` → `$HostList` is `""`. Same pair as foreach: do not write `$HostList?:` with `$over: … ?? []`. Always keep a string:

```yaml
!bind
$HostList: !join
  $sep: ","
  $over: !ref "$Values.hosts? ?? []"
```

### Optional foreach bind

```yaml
!bind
$Items?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
---
!emit
env?: !ref $Items?
```

Missing `env` → no `$Items`. `env: []` + `$yield:` → `$Items: []`. `$Items?:` + `$yield?:` + nothing to print → no `$Items`. `$Items?:` + `$yield?:` + `?? []` is allowed. `$Items?:` + `$yield:` + `?? []` is a pair error.

### Optional split bind

```yaml
!bind
$Hosts?: !split
  $sep: ","
  $of: !ref $Values.hostCsv?
---
!emit
hostAliases?: !ref $Hosts?
```

Missing `hostCsv` → no `$Hosts`. `hostCsv: ""` → `$Hosts: []`. Same pair on `$of` (not `$over`): do not write `$Hosts?:` with `$of: … ?? ''`.

### Optional sha256 bind

```yaml
!bind
$PwHash?: !sha256
  $of: !ref $Values.password?
---
!emit
checksum/secret?: !ref $PwHash?
```

Missing `password` → no `$PwHash`. `password: ""` → hash of `""` (a real hex). Same pair: do not write `$PwHash?:` with `$of: … ?? ''`.

### Optional concat bind

```yaml
!bind
$Args?: !concat
  - ["--verbose"]
  - !ref $Values.extraArgs?
---
!emit
args?: !ref $Args?
```

Missing `extraArgs` → no `$Args` (the base list is dropped too). Same pair as [`!format`](format.md): do not write `$Args?:` when every child has `?? []`. Keep a list:

```yaml
!bind
$Args: !concat
  - ["--verbose"]
  - !ref "$Values.extraArgs? ?? []"
```

### Optional merge bind

```yaml
!bind
$Res?: !merge
  - !ref $Values.requests?
  - !ref $Values.limits?
---
!emit
resources?: !ref $Res?
```

Every child must be omit-capable. A literal defaults map on `$Res?:` is a pair error (`?:` would never fire). Defaults + overlay: `$Name:` + `?? {}`.

`!pick` always has a value (`$Res?: !pick` is an error).

### Optional range bind

```yaml
!bind
$Idx?: !range
  $from: 0
  $until: !ref $Values.replicas?
```

`$from: 0` may sit on `$Name?:` (same as a literal sibling of [`!concat`](concat.md)). Missing `replicas` → no `$Idx`. No `$from` key is an error, not `0`. A missing `$step` key is `1`; a written `$step` that omits is an error.

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!emit
affinity?: !ref $Values.affinity
# ?: on the key does not make the path optional; missing affinity still errors
```

</td><td>

```yaml
!emit
affinity?: !ref $Values.affinity?
# both ?: on the key and ?. on the path omit the key
```

</td></tr>
<tr><td>

```yaml
!emit
affinity: !ref $Values.affinity?
# omit on a required key is an error
```

</td><td>

```yaml
!emit
affinity?: !ref $Values.affinity?
# required key must get a value; optional key uses ?:
```

</td></tr>
<tr><td>

```yaml
!emit
env: !foreach
  $over?: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
# $over?: is not allowed
```

</td><td>

```yaml
!emit
env: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
# required key: fill omit so $over is a list
```

</td></tr>
<tr><td>

```yaml
!emit
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
# ?: + ?? [] : the key cannot vanish
```

</td><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
# omit $over omits the key
```

```yaml
!emit
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?:
    name: !ref $E.name?
# ?? [] + $yield?: : missing becomes [] then the key omits
```

</td></tr>
<tr><td>

```yaml
!emit
name: !ref "$Values.fullname? ?? $Values.name? ?? 'app'"
# ?? is one default on the whole scalar
```

</td><td>

```yaml
!emit
name: !pick
  - !ref $Values.fullname?
  - !ref $Values.name?
  - app
# n-way omit default is !pick
```

</td></tr>
<tr><td>

```yaml
!emit
replicas: !ref $Values.replicas
# parent ?: requires every child ?: as well
```

</td><td>

```yaml
!emit
replicas?: !ref $Values.replicas?
# every child of an optional mapping is ?:
```

</td></tr>
</table>

## See also

- [`!pick`](pick.md)
- [`!match`](match.md)
- [`!ref`](ref.md)
- [`!expr`](expr.md)
- [`!foreach`](foreach.md)
- [`!join`](join.md)
- [`!split`](split.md)
- [`!sha256`](sha256.md)
- [`!concat`](concat.md)
- [`!merge`](merge.md)
- [`!range`](range.md)

## Comparison with Helm

Absence is written: key `?:` **and** `?` on the path field. One `??` on [`!ref`](ref.md) (a field) or [`!expr`](expr.md) (a formula) keeps a value. Write `!ref` when there is no operator. Write YAML for a constant (`true`, `[80, 443]`).

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- with .Values.affinity }}
affinity:
{{ toYaml . | nindent 2 }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
affinity?: !ref $Values.affinity?
```

</td></tr>
<tr><th>Difference</th><td>

Nil / `affinity: null` ≡ no key. Empty `{}` omits on both (`with` and optional `{}` collapse). `nindent` is Helm text indent. Helm `with` also skips `false` / `""` / `0` / `[]`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ .Values.tls.host | default "localhost" }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `| default` replaces `""`. Knarr `??` fills omit only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
cert: {{ dig "tls" "cert" "" .Values }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
cert: !ref "$Values.tls?.cert? ?? ''"
```

</td></tr>
<tr><th>Difference</th><td>

Same result: missing → `cert:` empty string.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ coalesce .Values.fullnameOverride .Values.name "app" }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

`coalesce` skips `""` / `false` / `0`. `!pick` skips omit only.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.tls }}
tls: ...
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

Impossible in v1.

</td></tr>
<tr><th>Difference</th><td>

Helm `if` is truthiness: `false` / `""` / `0` / `[]` skip. Missing / `tls: null` / `{}` omit on both (`?:` and optional `{}` collapse). Still Impossible when `tls` is a non-empty-looking scalar that Helm treats as empty.

</td></tr>
</table>
