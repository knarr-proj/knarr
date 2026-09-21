# Omit (`?:`, `?.`, `??`, `$Name?`)

knarr never drops a key because a value is empty-looking. Absence is always **written**.

## Syntax

| Marker | Where | Meaning |
|--------|--------|---------|
| `key?:` | stdout / `$yield` mapping key | This **key** may be absent in output |
| `?.` / `?[` | path in `!ref` / `!expr` / `!not` / coerce tags | Missing step → **omit value**, not error |
| `$Name?:` | bind key | Optional bind; elsewhere write **`$Name?`** |
| `??` | one on the whole `!ref` or `!expr` | Default of that value; key stays |

Leaf omit needs **both** `?:` on the key and an omit-capable value.

Optional mapping: every child is `?:` iff the parent is. Empty optional `{}` → parent omitted (no `spec: {}`).

## Examples

### Optional affinity

```yaml
affinity?: !ref $Values?.affinity
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
$when: !expr "$Values?.a || $Values?.b ?? false"
$sum: !expr "$Values?.a + $Values?.b ?? 0"
```

`true || omit` is true. Write [`!ref`](ref.md) when there is no operator.

### Optional bind

```yaml
!bind
$Tls?: !ref $Values?.tls
!emit
tls?: !ref $Tls?
cert?: !ref $Tls?.cert
```

`$Tls` without `?` is an error.

### N-way default

`??` cannot chain. Use [`!pick`](pick.md):

```yaml
name: !pick
  - !ref $Values?.name
  - !ref $Values?.fullname
  - app
```

### Skip foreach item

```yaml
$yield?: !ref $Worker?.sidecar
```

### Empty foreach omits the key

```yaml
env?: !foreach
  $over: !ref "$Values?.env ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

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
affinity?: !ref $Values?.affinity
# both ?: on the key and ?. on the path omit the key
```

</td></tr>
<tr><td>

```yaml
!emit
affinity: !ref $Values?.affinity
# omit on a required key is an error
```

</td><td>

```yaml
!emit
affinity?: !ref $Values?.affinity
# required key must get a value; optional key uses ?:
```

</td></tr>
<tr><td>

```yaml
!emit
env: !foreach
  $over?: !ref $Values?.env
  $as: $E
  $yield:
    name: !ref $E.name
# $over?: is not allowed
```

</td><td>

```yaml
!emit
env: !foreach
  $over: !ref "$Values?.env ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
# fill omit with [] so $over is a list
```

</td></tr>
<tr><td>

```yaml
!emit
name: !ref "$Values?.fullname ?? $Values?.name ?? 'app'"
# ?? is one default on the whole scalar
```

</td><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullname
  - !ref $Values?.name
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
replicas?: !ref $Values?.replicas
# every child of an optional mapping is ?:
```

</td></tr>
</table>

## See also

- [`!pick`](pick.md)
- [`!match`](match.md)
- [`!ref`](ref.md)
- [`!expr`](expr.md)

## Comparison with Helm

Absence is written: key `?:` **and** path `?.`. One `??` on [`!ref`](ref.md) (a field) or [`!expr`](expr.md) (a formula) keeps a value. Write `!ref` when there is no operator.

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
affinity?: !ref $Values?.affinity
```

</td></tr>
<tr><th>Difference</th><td>

Helm `with` skips empty/nil; knarr `?:` + `?.` omit missing/omit, not a present `{}`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ .Values.tls.host | default "localhost" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
# default — key stays
host: !ref "$Values.tls?.host ?? 'localhost'"
# omit
host?: !ref $Values.tls?.host
```

</td></tr>
<tr><th>Difference</th><td>

Helm `| default` replaces `""`; knarr `??` fills omit only, not `""`. `?:` omits the key.

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
# default — key stays
cert: !ref "$Values?.tls?.cert ?? ''"
# omit
cert?: !ref $Values?.tls?.cert
```

</td></tr>
<tr><th>Difference</th><td>

Helm `dig` with `""` still emits `cert:` as an empty string (`?? ''` keeps the key); knarr `?:` omits the key.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
name: {{ coalesce .Values.fullnameOverride .Values.name "app" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
name: !pick
  - !ref $Values?.fullnameOverride
  - !ref $Values?.name
  - app
```

</td></tr>
<tr><th>Difference</th><td>

`coalesce` skips `""` / `false` / `0`; `!pick` skips omit only.

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

```yaml
!bind
$Tls?: !ref $Values?.tls
!emit
tls?: !ref $Tls?
```

</td></tr>
<tr><th>Difference</th><td>

Helm `if` is truthiness; knarr optional bind is omit.

</td></tr>
</table>
