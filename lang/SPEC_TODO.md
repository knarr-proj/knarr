# SPEC_TODO

Один список **развёрнутых вопросов языка v1**, которые надо решить.

- Закрытое — [DECISIONS.md](DECISIONS.md) / [SPEC.md](SPEC.md) §3: пункт **удалить**.
- «Не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md) (там тоже один список).
- CLI v1 — [CLI_TODO.md](CLI_TODO.md). CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).
- Навсегда нет — [NONGOALS.md](NONGOALS.md).
- Недостаток принятого решения — **развёрнутый вопрос** в этот же список.

---

- **`!format` в `$yield` цикла.** Helm `name: {{ printf "w-%04d" $i }}` внутри `range until` печатает поле в каждом документе. knarr: `!format` только корень bind, в `$yield` / поле `!emit` — ошибка. Префикс `w-0000` из индекса `!range` в Comparison остаётся Impossible. Разрешить `!format` как значение в `$yield` / `!emit`, оставить bind-only, или другой канон с тем же stdout?
