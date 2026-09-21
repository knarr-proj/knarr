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

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
---
!emit
$when: !expr "or($Values.ingress.enabled, $Values.mesh.enabled)"
$then:
  kind: Ingress
$else: ""
# no or() in !expr
```

</td><td>

```yaml
---
!emit
$when: !expr "$Values.ingress.enabled || $Values.mesh.enabled"
$then:
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: !ref $Values.name
$else: ""
# short-circuit bools use ||
```

</td></tr>
<tr><td>

```yaml
---
!emit
$when: !not !or
  - !ref $Values.ingress.enabled
  - !ref $Values.mesh.enabled
$then:
  kind: Ingress
$else: ""
# !not does not wrap !or
```

</td><td>

```yaml
---
!emit
$when: !expr "!($Values.ingress.enabled || $Values.mesh.enabled)"
$then:
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: !ref $Values.name
$else: ""
# rewrite with !expr, or !and + !not
```

</td></tr>
</table>

## See also

- [`!and`](and.md)
- [`$when`](when.md)

## Comparison with Helm

Tag `!or` is boolean only (not coalesce). All children run.

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

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

</td></tr>
<tr><th>Difference</th><td>

Helm `or` short-circuits; knarr `!or` evaluates every child.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
host: {{ or .Values.host "localhost" }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
---
!emit
spec:
  host: !expr "$Values?.host ?? 'localhost'"
```

</td></tr>
<tr><th>Difference</th><td>

Helm `or` treats `""` as false and takes the default; knarr `??` fills omit only (`""` wins).

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if or .Values.ingress.enabled .Values.mesh.enabled }}
kind: Ingress
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

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

</td></tr>
<tr><th>Difference</th><td>

Missing nested keys are empty in Helm; knarr needs `?.` and `?? false` for a bool.

</td></tr>
</table>
