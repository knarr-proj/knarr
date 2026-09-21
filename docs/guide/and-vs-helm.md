# `!and` vs Helm

Helm `and a b c` short-circuits in Go templates. knarr `!and` evaluates **every** child. For short-circuit bools, use `&&` in `!expr`.
