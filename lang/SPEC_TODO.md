# SPEC_TODO

Один список **развёрнутых вопросов языка v1**, которые надо решить.

- Закрытое — [DECISIONS.md](DECISIONS.md) / [SPEC.md](SPEC.md) §3: пункт **удалить**.
- «Не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md) (там тоже один список).
- CLI v1 — [CLI_TODO.md](CLI_TODO.md). CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).
- Навсегда нет — [NONGOALS.md](NONGOALS.md).
- Недостаток принятого решения — **развёрнутый вопрос** в этот же список.

---

- {{- if .Values.tls }}tls: ...{{- end }} не решается для `tls: false` / `""` / `[]` knarr печатает, helm - нет.

- Helm Comparison `if and .Values.service.enabled .Values.tls` → `kind: Service`: пара с `!emit?` + `$when: !and` из `!not-empty $Values.service?.enabled?` и `!not-empty $Values.tls?`, или Impossible (ворота документа vs поле `tls:` как в omit.md). Отложено.

