# SPEC_TODO

Один список **развёрнутых вопросов языка v1**, которые надо решить.

- Закрытое — [DECISIONS.md](DECISIONS.md) / [SPEC.md](SPEC.md) §3: пункт **удалить**.
- «Не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md) (там тоже один список).
- CLI v1 — [CLI_TODO.md](CLI_TODO.md). CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).
- Навсегда нет — [NONGOALS.md](NONGOALS.md).
- Недостаток принятого решения — **развёрнутый вопрос** в этот же список.

---

- Суффикс `?` на **теге значения.** На документе `?` = только `$yield?:`, `$when` опц. (`!emit?` / `!emit-foreach?` / `!emit-range?`). У поля тегов **`!foreach?` / `!range?` / `!match?` нет**: `имя?:` + `$yield?:` на обычном теге. Ввести `!match?` (пара `$yield?:`) и/или `!foreach?` / `!range?`, или оставить только документный `?`?
