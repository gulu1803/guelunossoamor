# Login silencioso + AutoSync

- Login do site continua igual (Gustavo/Luiza).
- Após login local, o app **tenta autenticar no Supabase** usando `SUPABASE_EMAILS` e a **mesma senha** do usuário (bbgu/bblu).
- A sincronização roda **sozinha** (a cada ~15s quando a aba está visível/online) e também quando a aba volta ao foco ou a conexão retorna.
- Se o Supabase não estiver configurado ou falhar, o app segue **offline-first** normalmente.

## Configuração necessária
1) Edite `js/db/supabase.js` com `SUPABASE_URL`, `SUPABASE_ANON_KEY` e e-mails.
2) No Supabase, crie as tabelas e políticas do `README_SUPABASE.md`.
3) (Opcional) Crie os usuários `gustavo@...` e `luiza@...` com senhas iguais às do login local, para o login silencioso funcionar.

