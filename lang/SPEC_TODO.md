# SPEC_TODO

Один список **развёрнутых вопросов языка v1**, которые надо решить.

- Закрытое — [DECISIONS.md](DECISIONS.md) / [SPEC.md](SPEC.md) §3: пункт **удалить**.
- «Не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md) (там тоже один список).
- CLI v1 — [CLI_TODO.md](CLI_TODO.md). CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).
- Навсегда нет — [NONGOALS.md](NONGOALS.md).
- Недостаток принятого решения — **развёрнутый вопрос** в этот же список.

---

- `!emit-foreach?` **/** `!emit-range?` **нет,** `!emit?` **есть.** Сахар «if без else» только на один документ. На пачке документов — опциональный `$when`. Ввести `!emit-foreach?` / `!emit-range?` (только `$when`+`$yield`, без возможности опустить `$when`) или оставить?
- `!format` **в** `$yield` **цикла.** Helm `name: {{ printf "w-%04d" . }}` внутри `range until` (со `---`) печатает поле в каждом документе. knarr: `!format` только корень bind. `!concat` / `!join` / `!merge` тоже bind-only, `!str` / `!ref` в `$yield` можно. Разрешить `!format` (и тогда те же bind-only теги?) в `$yield` / поле `!emit`, или Comparison `printf` в ряде остаётся Impossible?
- Оценить замену в !match   $then на $yield, а $else на $else-yield

