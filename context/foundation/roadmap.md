---
project: SkitourSafe
version: 1
status: draft
created: 2026-11-07
updated: 2026-11-07
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: first-safe-recommendation
milestone_seq: 1
milestone_status: open
---

# Roadmap: SkitourSafe

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; the next milestone continues this file. Archive only when an independent roadmap replaces it.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: Pierwsza bezpieczna rekomendacja end-to-end** — Status: open

- **Intent:** Dostarczyć kompletny, weryfikowalny przepływ, w którym zalogowany narciarz turystyczny opisuje swój profil i warunki, dostaje trasę dopuszczoną przez twarde filtry wraz z uzasadnieniem AI (albo kategorię NO-GO) i zapisuje wyjście do dziennika — tak, by pierwsi użytkownicy mogli ocenić trafność rekomendacji.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** `FR-001`–`FR-010`, `US-01`, sekcje `## Non-Functional Requirements`, `## Access Control`, `## Business Logic`.

## Vision recap

Narciarz turystyczny z 1–3 sezonami doświadczenia planuje wyjście wieczorem przed wyjazdem i traci 1–2 godziny na ręczne łączenie stopnia zagrożenia lawinowego, wiatru, widoczności, stromizny i ekspozycji trasy, a potem porównywanie tego z własnym doświadczeniem i sprzętem. Gdy analiza przekracza jego kompetencje, kończy się paraliżem decyzyjnym — trasą wybraną na wyczucie albo rezygnacją. Produkt bierze na siebie odpowiedzialność za rekomendację w granicach jawnego zastrzeżenia i pracuje na ręcznie skatalogowanych, popularnych trasach jako całościach, zamiast automatycznej analizy geometrii.

## North star

**S-04: Uzasadnienie AI z fallbackiem i zapis wyjścia do dziennika** — dopiero tutaj domyka się pełne `US-01`: rekomendacja staje się zrozumiała (uzasadnienie) i trwała (dziennik), co jest kryterium głównym sukcesu PRD.

> Gwiazda przewodnia to najmniejszy przepływ end-to-end, którego dowiezienie udowodni kluczową hipotezę produktu: że deterministyczne filtry potrafią wybrać bezpieczną trasę, a użytkownik ufa tej rekomendacji na tyle, by ją zapisać i do niej wrócić. Umieszczamy ją tak wcześnie, jak pozwalają Prerequisites, bo wszystko inne ma znaczenie tylko wtedy, gdy ten przepływ działa.

## At a glance

| ID   | Change ID                       | Outcome (user can …)                                                                                       | Prerequisites | PRD refs                                                                                 | Status   |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- | -------- |
| F-01 | `domain-schema-and-rls`         | (foundation) minimalny schemat domenowy z RLS: profil narciarza, katalog tras, wpisy dziennika            | —             | `## Access Control`, FR-004, FR-005, FR-008                                               | in-progress |
| F-02 | `curated-route-catalogue`       | (foundation) katalog popularnych tras zaseedowany i gotowy do filtrowania                                  | F-01          | FR-007, `## Business Logic`, `## Non-Goals` (bez automatycznej analizy GIS)               | proposed |
| S-01 | `skier-profile-and-conditions`  | zapisać profil narciarza i bieżące warunki w trwałym profilu powiązanym z kontem                           | F-01          | US-01, FR-004, FR-005, FR-001, FR-002                                                     | proposed |
| S-02 | `disclaimer-and-confirmation`   | zaakceptować zastrzeżenie odpowiedzialności i potwierdzić podsumowanie warunków przed analizą              | S-01          | US-01, FR-006, FR-010, NFR (wyświetlenie wyniku niemożliwe przed akceptacją zastrzeżenia) | proposed |
| S-03 | `deterministic-route-match`     | uruchomić analizę i zobaczyć trasę dopuszczoną przez twarde filtry albo alert NO-GO                        | S-02, F-02    | US-01, FR-007, NFR (rekomendacja w mniej niż 15 s od wysłania formularza)                 | proposed |
| S-04 | `ai-justification-and-save`     | odczytać uzasadnienie AI i zapisać wyjście do dziennika (z komunikatem statycznym przy niedostępnym AI)   | S-03          | US-01, FR-007, FR-008, NFR (fallback przy niedostępnym AI), Guardrails (AI nigdy nie odrzuca wyniku filtra) | proposed |
| S-05 | `outing-journal-with-staleness` | otworzyć dziennik, zobaczyć zapisane wyjścia i zostać ostrzeżonym o nieaktualności ich danych             | S-04          | FR-003, FR-008                                                                            | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                    | Chain                                             | Note                                                                                          |
| ------ | ------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A      | Planowanie i rekomendacja | `F-01` → `S-01` → `S-02` → `S-03` → `S-04` → `S-05` | Ścieżka konieczna do gwiazdy przewodniej — przy celu `speed` wszystko poza nią jest parkowane. |
| B      | Treść katalogu tras      | `F-02`                                            | Joins Stream A at `S-03`; biegnie równolegle z `S-01`, bo katalog jest pracą treściową, nie kodową. |

## Baseline

What's already in place in the codebase as of `2026-11-07` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Astro SSR z wyspami React 19, Tailwind CSS 4, primitives shadcn/ui w `src/components/ui/`; strony w `src/pages/`.
- **Backend / API:** partial — trzy trasy auth (`src/pages/api/auth/signin.ts`, `signup.ts`, `signout.ts`); brak `src/lib/services/` i brak endpointów domenowych.
- **Data:** partial — klient Supabase (`src/lib/supabase.ts`) i Supabase CLI z `supabase/config.toml`, ale `schema_paths = []`, `seed = false`; brak `supabase/migrations/` i brak jakiejkolwiek tabeli domenowej.
- **Auth:** present — `@supabase/ssr` + cookie client, `src/middleware.ts` rozwiązuje użytkownika do `Astro.locals.user`, `PROTECTED_ROUTES = ["/dashboard"]`.
- **Deploy / infra:** present — `wrangler.jsonc` (Worker `skitoursafe`), skrypty `deploy` / `preview:worker`, `.github/workflows/ci.yml`.
- **Observability:** absent — tylko flaga `"observability": { "enabled": true }` w `wrangler.jsonc`; brak biblioteki logów, trackera błędów i metryk.
- **AI / LLM:** absent — OpenRouter występuje wyłącznie w dokumentach; brak zmiennej środowiskowej, brak wywołania HTTP, brak klienta HTTP w zależnościach.

## Foundations

### F-01: Minimalny schemat domenowy z RLS

- **Outcome:** (foundation) w bazie istnieją trzy tabele domenowe — profil narciarza, katalog tras i wpisy dziennika — z włączonym RLS i politykami ograniczającymi dostęp do danych właściciela.
- **Change ID:** `domain-schema-and-rls`
- **PRD refs:** `## Access Control` (dane profilu i dziennika przypisane do konta i usuwane razem z nim), FR-004, FR-005, FR-008
- **Unlocks:** S-01 (trwały profil), S-03 (katalog tras do filtrowania), S-04 (zapis wyjścia), S-05 (odczyt dziennika)
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Czy katalog tras potrzebuje już w MVP wymiaru regionu lub obszaru, czy wystarczy płaska lista z atrybutami trasy? — Owner: user. Block: no.
- **Risk:** Sekwencjonowane pierwsze, bo bez tabel żaden wycinek nie ma gdzie zapisać stanu; błędem byłoby jednak projektowanie pełnego modelu domenowego pod przyszłe funkcje — zakres ogranicza się do pól wymaganych przez FR-004, FR-005, FR-007 i FR-008.
- **Status:** in-progress

### F-02: Zaseedowany katalog popularnych tras

- **Outcome:** (foundation) katalog tras zawiera ręcznie opracowany, wystarczający na start zestaw popularnych wyjść — każde z wymaganiami sprzętowymi (ABC), poziomem trudności i czasem przejścia — gotowy do filtrowania.
- **Change ID:** `curated-route-catalogue`
- **PRD refs:** FR-007, `## Business Logic` (trasy katalogowane jako całości), `## Non-Goals` (bez automatycznej analizy GIS)
- **Unlocks:** S-03 (twarde filtry nie mają na czym działać bez danych)
- **Prerequisites:** F-01
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:**
  - Ile tras i z ilu regionów wystarczy, by katalog był wiarygodny dla pierwszych użytkowników? — Owner: user. Block: no.
  - Z jakiego źródła pochodzą dane tras (własne notatki, przewodniki, istniejące serwisy) i czy ich użycie jest dopuszczalne? — Owner: user. Block: no.
- **Risk:** Treść katalogu jest niewidoczną, ale najdroższą częścią produktu — zbyt mały zestaw sprawi, że NO-GO pojawi się także w bezpiecznych warunkach; dlatego biegnie równolegle z formularzem, a nie po nim.
- **Status:** proposed

## Slices

### S-01: Profil narciarza i bieżące warunki

- **Outcome:** użytkownik może zapisać profil narciarza (posiadanie sprzętu ABC, doświadczenie terenowe, poziom kondycji, dostępny czas) oraz bieżące warunki (stopień zagrożenia lawinowego, kierunek silnego wiatru, widoczność) w profilu powiązanym z jego kontem.
- **Change ID:** `skier-profile-and-conditions`
- **PRD refs:** US-01, FR-004, FR-005, FR-001, FR-002
- **Prerequisites:** F-01
- **Parallel with:** F-02
- **Blockers:** —
- **Unknowns:**
  - Czy dostępny czas jest polem trwałego profilu, czy wartością podawaną przy każdym wyjściu? PRD wymienia go w profilu, ale semantycznie należy do planowanego wyjścia. — Owner: user. Block: no.
- **Risk:** `FR-001` i `FR-002` są już pokryte przez baseline (auth startera) i występują w refs wyłącznie dla pełności pokrycia PRD — ten wycinek nie odbudowuje logowania. Główne ryzyko to nadmiar pól: przy celu `speed` formularz ma pozostać krótki i czytelny na telefonie.
- **Status:** proposed

### S-02: Zastrzeżenie odpowiedzialności i potwierdzenie podsumowania

- **Outcome:** użytkownik może zaakceptować zastrzeżenie odpowiedzialności i potwierdzić podsumowanie wprowadzonych warunków oraz profilu bezpośrednio przed uruchomieniem analizy.
- **Change ID:** `disclaimer-and-confirmation`
- **PRD refs:** US-01, FR-006, FR-010, NFR (wyświetlenie wyniku niemożliwe przed akceptacją zastrzeżenia)
- **Prerequisites:** S-01
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Wydzielone z formularza, bo niesie inną odpowiedzialność niż zbieranie danych — brama prawna musi być niezależna od pól i nie może zniknąć przy późniejszej refaktoryzacji widoku. Odrębny wycinek pozwala też przetestować samą bramę bez uruchamiania analizy.
- **Status:** proposed

### S-03: Analiza oparta na twardych filtrach z wynikiem NO-GO

- **Outcome:** użytkownik może uruchomić analizę i zobaczyć trasę dopuszczoną przez deterministyczne filtry, a gdy żadna trasa nie przechodzi filtrów — alert NO-GO z wyjaśnieniem, dlaczego wyjście jest niemożliwe.
- **Change ID:** `deterministic-route-match`
- **PRD refs:** US-01, FR-007, NFR (rekomendacja w mniej niż 15 s od wysłania formularza)
- **Prerequisites:** S-02, F-02
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Jak przełożyć deklarowane doświadczenie (beginner / intermediate / advanced) na dopuszczalny zakres stromizny i ekspozycji, zachowując konserwatywną interpretację z PRD? — Owner: user. Block: no.
  - Czy trasa wymagająca sprzętu ABC ma być odrzucana w całości, czy degradowana do wariantu bez odcinków lodowcowych? — Owner: user. Block: no.
- **Risk:** Tu znajduje się jedyne nieodwracalne ryzyko zaufania — rekomendacja trasy, której nie powinno się polecić, niszczy produkt mocniej niż jego brak. Brak AI w tym wycinku jest celowy: filtr musi być weryfikowalny samodzielnie, zanim dołoży się do niego tekst modelu.
- **Status:** proposed

### S-04: Uzasadnienie AI z fallbackiem i zapis do dziennika

- **Outcome:** użytkownik może odczytać uzasadnienie rekomendacji wygenerowane przez model oraz zapisać wyjście do dziennika; gdy generowanie tekstu jest niedostępne lub przekroczy limit czasu, widzi komunikat systemowy, a rekomendowana trasa pozostaje ta sama.
- **Change ID:** `ai-justification-and-save`
- **PRD refs:** US-01, FR-007, FR-008, NFR (fallback przy niedostępnym AI), Guardrails (AI nigdy nie odrzuca wyniku filtra)
- **Prerequisites:** S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Który model i dostawca oraz jaki limit czasu mieszczą się w łącznym budżecie 15 s razem z filtrowaniem? — Owner: user. Block: no.
  - Czy klucz dostawcy modelu jest dostępny lokalnie i na Workerze, czy trzeba go dopiero provisionować? — Owner: user. Block: no.
- **Risk:** Zakres łączy dwie rzeczy o różnym charakterze (integracja zewnętrzna i trwały zapis), bo dopiero razem domykają `US-01` i definiują gwiazdę przewodnią. Ryzykiem jest przeciek wiadomości AI do logiki decyzji — model wolno użyć wyłącznie do tekstu, nigdy do wyboru trasy.
- **Status:** proposed

### S-05: Dziennik wyjść z oznaczeniem nieaktualności

- **Outcome:** użytkownik może otworzyć dziennik, zobaczyć zapisane wyjścia wraz z warunkami z dnia zapisu i zostać ostrzeżonym, że te dane się zdezaktualizowały.
- **Change ID:** `outing-journal-with-staleness`
- **PRD refs:** FR-003, FR-008
- **Prerequisites:** S-04
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Domyka pętlę powrotu do produktu, ale nie może udawać aktualnej rekomendacji — stary wpis z dawnym stopniem zagrożenia jest dla użytkownika niebezpieczniejszy niż jego brak.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                       | Suggested issue title                                        | Ready for `/10x-plan` | Notes                                                  |
| ---------- | ------------------------------- | ------------------------------------------------------------ | --------------------- | ------------------------------------------------------ |
| F-01       | `domain-schema-and-rls`         | Domain schema with RLS for profile, routes, outings          | yes                   | Run `/10x-plan domain-schema-and-rls`                  |
| F-02       | `curated-route-catalogue`       | Seed the popular route catalogue                             | no                    | Needs F-01 done; parallel with S-01                    |
| S-01       | `skier-profile-and-conditions`  | Skier profile and current conditions form                    | no                    | Needs F-01 done; parallel with F-02                    |
| S-02       | `disclaimer-and-confirmation`   | Liability disclaimer and pre-analysis confirmation           | no                    | Needs S-01 done                                        |
| S-03       | `deterministic-route-match`     | Deterministic route matching with NO-GO result               | no                    | Needs S-02 and F-02 done                               |
| S-04       | `ai-justification-and-save`     | AI justification with static fallback, save to journal       | no                    | North star; needs S-03 done                            |
| S-05       | `outing-journal-with-staleness` | Outing journal with staleness marking                        | no                    | Needs S-04 done                                        |

## Open Roadmap Questions

Brak. PRD v1 nie ma otwartych pytań, a wywiad nie ujawnił pytań przekrojowych — wszystkie niewiadome są lokalne dla pojedynczych wycinków i zostały zapisane w ich blokach.

## Parked

- **Integracja z zewnętrznymi źródłami pogodowo-lawinowymi** — Why parked: PRD `## Non-Goals`; warunki wpisywane ręcznie, a integracja to główna zewnętrzna zależność, która mogłaby zatrzymać pierwszy przepływ.
- **Automatyczna analiza GIS stromizny i ekspozycji per metr** — Why parked: PRD `## Non-Goals`; trasy katalogowane jako całości.
- **Nawigacja, GPS i tryb offline** — Why parked: PRD `## Non-Goals`; produkt planuje wieczorem w domu i nie prowadzi użytkownika w terenie.
- **Role administracyjne i panel zarządzania** — Why parked: PRD `## Non-Goals`; model ról jest płaski, a trasy wchodzą jako dane seed.
- **Funkcje społecznościowe** — Why parked: PRD `## Non-Goals`.
- **Pełna zgodność WCAG-AA i wielojęzyczność** — Why parked: PRD `## Non-Goals`.
- **`FR-009` — pokazanie, dlaczego pozostałe trasy zostały odrzucone** — Why parked: wymaganie `nice-to-have`; przy celu `speed` ustępuje wszystkim wymaganiom koniecznym. Naturalny pierwszy zakres następnego kamienia milowego.
- **Automatyczny zestaw testów dla logiki filtrów** — Why parked: nie jest wymaganiem PRD, a repo nie ma runnera testów (CI bramkuje lint, `astro check`, build i smoke). Kandydat na enabler, jeśli poprawność filtrów zacznie się regresować.

## Milestone History

Empty on the very first milestone. Closure entries are appended here by the `READY_TO_CLOSE → CLOSED` transition and carried forward verbatim into each successor milestone's roadmap.

## Done

Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived. Do NOT pre-populate.
