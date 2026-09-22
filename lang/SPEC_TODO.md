# SPEC_TODO

Один список **развёрнутых вопросов языка v1**, которые надо решить.

- Закрытое — [DECISIONS.md](DECISIONS.md) / [SPEC.md](SPEC.md) §3: пункт **удалить**.
- «Не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md) (там тоже один список).
- CLI v1 — [CLI_TODO.md](CLI_TODO.md). CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).
- Навсегда нет — [NONGOALS.md](NONGOALS.md).
- Недостаток принятого решения — **развёрнутый вопрос** в этот же список.

---

- `!concat` **в** `$yield` **/** поле `!emit`. `!format` теперь значение; `!concat` / `!join` / `!merge` / `!split` / `!sha256` — только bind. Разрешить `!concat` как значение (как `!format`) или оставить bind-only?
- Оценить замену в !match   $then на $yield, а $else на $else-yield
- Проверить что везде есть `$yield?:` — пропускает emit или bind; на обычном теге — только `$yield`
- Суффикс `?` на теге документа: `!emit?` = обязательный `$when` без `$else`; `!emit-foreach?` / `!emit-range?` = пара `$yield?:`, `$when` опционален. Один закон `?` или два? Тегов `!foreach?` / `!range?` нет (`?:` на ключе поля).
