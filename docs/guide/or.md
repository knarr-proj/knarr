# `!or`

Boolean OR of a sequence of predicates. All children are evaluated (no short-circuit).

## Syntax

```yaml
$when: !or
  - !empty $Values?.tls
  - !empty $Values?.cert
```

Same child rules as [`!and`](and.md).

## Examples

### Run if either flag

```yaml
$when: !or
  - !ref $Values.ingress.enabled
  - !ref $Values.mesh.enabled
```

### Skip TLS only if both missing

```yaml
$when: !and
  - !empty $Values?.tls
  - !empty $Values?.cert
```

(`!or` of empties is “at least one missing”.)

### Default-on in expr instead

```yaml
$when: !expr "$Values?.ingress.enabled ?? false || $Values?.mesh.enabled ?? false"
```

## Common mistakes

**Wrong — `or()` in `!expr`**

Use `||`.

**Wrong — `!not` wrapping `!or`**

Rewrite with `!and` + `!not-empty`, or `!expr`.

## See also

- [`!and`](and.md)
- [`$when`](when.md)

## Comparison with Helm

Tag `!or` is boolean only (not coalesce). All children run.

<table>
<tr><th>Helm</th><th>Knarr</th><th>Difference</th></tr>
<tr><td>

```gotemplate
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !or
  - !ref $Values.ingress.enabled
  - !ref $Values.mesh.enabled
$then:
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: !ref $Values.name
$else: ""
```

</td><td>

Helm `or` short-circuits; knarr `!or` evaluates every child.

</td></tr>
<tr><td>

```gotemplate
host: {{ or .Values.host "localhost" }}
```

</td><td>

```yaml
---
!emit
spec:
  host: !expr "$Values?.host ?? 'localhost'"
```

</td><td>

Helm `or` treats `""` as false and takes the default; knarr `??` fills omit only (`""` wins).

</td></tr>
<tr><td>

```gotemplate
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
```

</td><td>

```yaml
---
!emit
$when: !expr "$Values?.ingress.enabled ?? false || $Values?.mesh.enabled ?? false"
$then:
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: !ref $Values.name
$else: ""
```

</td><td>

Missing nested keys are empty in Helm; knarr needs `?.` and `?? false` for a bool.

</td></tr>
</table>
