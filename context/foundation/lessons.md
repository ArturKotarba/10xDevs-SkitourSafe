# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Nie dodawaj lodash bez jawnego powodu

- **Context**: Implementacja funkcji w aplikacji TypeScript po stronie frontendu i backendu.
- **Problem**: Agent użył `_.filter()`, mimo że lodash nie jest częścią projektu. To dodałoby niepotrzebną zależność i rozjechało lokalną konwencję pracy z natywnymi API.
- **Rule**: Nie dodawaj lodash bez jasnego wskazania. Projekt preferuje natywne funkcje JS/TS w standardzie 2026+.
- **Applies to**: plan, implement, impl-review

## `error code: 1042` z workers.dev to nie zepsuty build

- **Context**: Weryfikacja wdrożenia Cloudflare Workers po `wrangler versions upload`.
- **Problem**: `curl https://<name>.<sub>.workers.dev/` zwraca `404`, a treść odpowiedzi to dokładnie `error code: 1042` (17 bajtów, `text/plain`). Wygląda jak błąd aplikacji, więc łatwo zacząć szukać buga w kodzie, konfiguracji `wrangler.jsonc` albo routingu.
- **Rule**: `1042` pochodzi z edge'u Cloudflare, nie z aplikacji (własny 404 Astro to HTML). Znaczy „żaden Worker nie obsługuje tego hostname'u". `wrangler versions upload` jest celowo **non-live** — Worker ma `deployment_id: ""`, dopóki nie zrobisz `wrangler deploy`. Rozróżnienie: sprawdź `server: cloudflare` w nagłówkach i czy treść jest `text/plain`. Nie debuguj kodu, dopóki nie potwierdzisz `deployment_id`.
- **Applies to**: deploy, implement, impl-review

## `.dev.vars` i sekrety Workera to dwa rozłączne magazyny

- **Context**: Konfiguracja zmiennych środowiskowych Supabase lokalnie i na produkcji.
- **Problem**: Te same nazwy (`SUPABASE_URL`, `SUPABASE_KEY`) istnieją w `.dev.vars` i jako Worker secrets, ale nie ma między nimi żadnej synchronizacji. Zmiana jednego bez drugiego daje środowisko lokalne rozjeżdżające się z produkcją. Dodatkowo Cloudflare ładuje **albo** `.dev.vars` **albo** `.env` — gdy `.dev.vars` istnieje, `.env` jest w całości ignorowany, więc dopisanie `.env` tworzy plik, który pozornie działa, a nic nie robi.
- **Rule**: Traktuj `.dev.vars` i `wrangler secret put` jako osobną parę, którą ustawia się w jednym kroku. Nigdy nie dodawaj `.env`, jeśli istnieje `.dev.vars`. Sekrety Workera są write-only — jedynym pre-flight checkiem jest `wrangler secret list` (same nazwy).
- **Applies to**: plan, implement, deploy

## Autoconfirm OFF unieważnia copy strony `confirm-email`

- **Context**: Wyłączenie potwierdzania e-maila w hostowanym Supabase (E1, opcja A) przy zachowaniu formularza rejestracji.
- **Problem**: `src/pages/auth/confirm-email.astro` rozgałęzia treść po `import.meta.env.DEV`. W buildzie produkcyjnym `DEV` jest `false`, więc strona mówi „Check your email" o wiadomości, która przy `autoconfirm` nigdy nie zostanie wysłana. Konta działają, ale komunikat wprowadza użytkownika w błąd. Smoke test tego nie łapie, bo sprawdza kody HTTP, nie copy — przechodzi w 100%, mimo że UI kłamie.
- **Rule**: Gdy przełączasz zachowanie auth w panelu, sprawdź, czy jakaś strona nie rozgałęzia copy po `import.meta.env.DEV` — `DEV` opisuje środowisko builda, nie rzeczywiste zachowanie auth. Bramki HTTP (smoke) nie wykryją kłamstwa w treści strony; wymaga to otwarcia widoku w przeglądarce.
- **Applies to**: implement, impl-review, deploy
