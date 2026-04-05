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

### 4. Default-BaseURL veraltet
**Ist:** `https://europe-west1-spondylatlas.cloudfunctions.net/api` (im Code)
**Soll:** `https://api-zsi5qcr7hq-ew.a.run.app` (Cloud Run, laut README)
**Impact:** Ohne explizite `baseUrl` geht nichts. Default sollte auf die aktuelle API zeigen.

### 5. Auth-Fehler verschluckt API-Details
**Ist:** API gibt HTTP 400 + `VALIDATION_ERROR` (`client_id: Invalid uuid`) zurück, SDK wirft `AuthenticationError` mit nur "Token exchange failed: 400"
**Soll:** Tatsächliche API-Fehlermeldung durchreichen
**Impact:** Debugging ist blind.

### 6. Kein `keywords` in package.json
**Soll:** `["spondylitis", "axspa", "research", "medical", "agent", "sdk"]`
**Impact:** npm-Suche findet das Paket nicht.

### 7. Kein `repository`, `homepage`, `bugs` in package.json
**Impact:** npm-Seite zeigt keine Links. Kein Weg zum Quellcode/Support.

### 8. Lizenz: "Proprietary" auf npm, README sagt MIT
**Ist:** Kein `license`-Feld in package.json, keine LICENSE-Datei im Paket
**Impact:** Rechtsunsicherheit. Unternehmen können das Paket nicht verwenden.

---

## P2 — Nice-to-have

### 9. Kein `examples/`-Ordner mit lauffähigen Skripten
### 10. Kein `CHANGELOG.md`
### 11. Retry-Backoff-Strategie undokumentiert (Default: 2 Retries, kein Delay?)
### 12. `PaperSearchParams.tags` ist `string` statt `string[]`
### 13. Kein `.list()`-Alias für Papers (intuitiver als `search()` ohne Args)
### 14. Fehlende Admin-Resource (API hat `/admin`, SDK nicht)
### 15. Rate-Limits nirgends dokumentiert
### 16. `agents/.env.example` zeigt keine SDK-Env-Vars (`SPONDYLATLAS_CLIENT_ID` etc.)

---

## Zusammenfassung

| Priorität | Anzahl | Aufwand |
|-----------|--------|---------|
| ~~P0 (README lügt)~~ | ~~3~~ | ✅ Behoben |
| P1 (Wichtig) | 5 | ~2h |
| P2 (Nice-to-have) | 8 | ~1 Tag |

**Status:** P0 erledigt. Nächster Schritt: P1 (package.json + Default-URL + Auth-Error-Mapping).
