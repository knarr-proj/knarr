# 26-foreach-empty-omit

Проверяет: решение **97** — `containers?: !foreach` + omit `$over` (`$Values.sidecars?` нет) → ключа `containers` нет. Не `?? []` на `$over` при `?:`.
