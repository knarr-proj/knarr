# SPEC_TODO

Один список **развёрнутых вопросов языка v1**, которые надо решить.

- Закрытое — [DECISIONS.md](DECISIONS.md) / [SPEC.md](SPEC.md) §3: пункт **удалить**.
- «Не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md) (там тоже один список).
- CLI v1 — [CLI_TODO.md](CLI_TODO.md). CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).
- Навсегда нет — [NONGOALS.md](NONGOALS.md).
- Недостаток принятого решения — **развёрнутый вопрос** в этот же список.

---

- Helm Comparison `if and .Values.service.enabled .Values.tls` → `kind: Service`: пара с `!emit?` + `$when: !and` из `!is-not-empty $Values.service?.enabled?` и `!is-not-empty $Values.tls?`, или Impossible (ворота документа vs поле `tls:` как в omit.md). Отложено.

- `!skip-empty` только на ключе `?:` / `$Name?:` / `$yield?:`: разрешить ли тот же тег в других слотах, где значение и так может стать omit (`$then` / `$else` у `!match` на ключе `?:`, ребёнок `!pick` кроме последнего, `$over` у `имя?: !foreach`)? Сейчас `$then: !skip-empty` — ошибка, поэтому `name: {{ and .Values.name .Values.image }}` остаётся вложенным `!match` + `!is-not-empty`.
