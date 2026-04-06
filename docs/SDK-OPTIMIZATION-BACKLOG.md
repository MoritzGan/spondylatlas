# @spondylatlas/agent-sdk — Optimierungsbacklog

Getestet als externer Erstnutzer am 03.04.2026 (v1.0.0).

---

## P0 — Kritisch (README lügt) — ✅ BEHOBEN (04.04.2026)

### 1. ~~README zeigt falsche Config-Signatur~~ ✅
README zeigt jetzt korrekt `clientId` + `clientSecret`.

### 2. ~~README zeigt `client.papers.list()` — Methode existiert nicht~~ ✅
README zeigt jetzt `client.papers.search()`.

### 3. ~~README-Submit-Beispiel hat falsche Felder~~ ✅
README-Beispiel zeigt jetzt `client.papers.review()` mit korrekten Feldern.

---

## P1 — Wichtig

### 4. ~~Default-BaseURL veraltet~~ ✅ (Bereits korrekt in v1.0.1)
Default in `client.ts` zeigt auf `https://api-zsi5qcr7hq-ew.a.run.app` (Cloud Run).

### 5. ~~Auth-Fehler verschluckt API-Details~~ ✅ BEHOBEN (06.04.2026)
SDK-Auth gibt jetzt die tatsächliche API-Fehlermeldung weiter + kontextuellen Hint (z.B. "check that SPONDYLATLAS_CLIENT_ID is a valid UUID").

### 6. ~~Kein `keywords` in package.json~~ ✅ (Bereits in v1.0.1)
Keywords vorhanden: spondylitis, axspa, research, medical, agent, sdk, api.

### 7. ~~Kein `repository`, `homepage`, `bugs` in package.json~~ ✅ (Bereits in v1.0.1)
Alle Links korrekt gesetzt.

### 8. ~~Lizenz: "Proprietary" auf npm, README sagt MIT~~ ✅ (Bereits in v1.0.1)
`license: "MIT"` in package.json vorhanden.

---

## P2 — Nice-to-have

### 9. ~~Kein `examples/`-Ordner mit lauffähigen Skripten~~ ✅ BEHOBEN (06.04.2026)
3 Beispiele: `01-connect.ts`, `02-review-papers.ts`, `03-review-hypotheses.ts`

### 10. Kein `CHANGELOG.md`
### 11. Retry-Backoff-Strategie undokumentiert (Default: 2 Retries, kein Delay?)
### 12. `PaperSearchParams.tags` ist `string` statt `string[]`

### 13. ~~Kein `.list()`-Alias für Papers~~ ✅ BEHOBEN (06.04.2026)
`client.papers.list()` als Alias für `search()` hinzugefügt.

### 14. Fehlende Admin-Resource (API hat `/admin`, SDK nicht)

### 15. ~~Rate-Limits nirgends dokumentiert~~ ✅ BEHOBEN (06.04.2026)
Dokumentiert in README: 100/hr (reviewer), 200/hr (researcher), 500/hr (admin).

### 16. ~~`agents/.env.example` zeigt keine SDK-Env-Vars~~ ✅ BEHOBEN (06.04.2026)
`.env.example` im SDK-Paket mit `SPONDYLATLAS_CLIENT_ID` und `SPONDYLATLAS_CLIENT_SECRET`.

---

## P3 — Neu hinzugefügt (06.04.2026)

### 17. ✅ `client.ping()` — Sofort-Feedback für neue Entwickler
Prüft Konnektivität + Credentials in einem Call. Gibt Agent-Name, Rolle und Scopes zurück.

### 18. ✅ `RateLimitError.retryAfter` aus Response-Header
Statt hardcoded 60s wird jetzt der `Retry-After`-Header der API-Response geparst.

### 19. ✅ README komplett überarbeitet ("First 60 Seconds")
Neuer Aufbau: Install → Credentials → `ping()` → fertig.

---

## Zusammenfassung

| Priorität | Anzahl | Aufwand |
|-----------|--------|---------|
| ~~P0 (README lügt)~~ | ~~3~~ | ✅ Behoben |
| ~~P1 (Wichtig)~~ | ~~5~~ | ✅ Behoben |
| P2 (Nice-to-have) | 3 offen | ~4h |
| P3 (DX-Verbesserungen) | 3 | ✅ Behoben |

**Status:** P0, P1, P3 erledigt. Verbleibend: P2 #10 (CHANGELOG), #11 (Retry-Backoff-Docs), #12 (Tags-Typ), #14 (Admin-Resource).
