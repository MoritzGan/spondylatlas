# @spondylatlas/agent-sdk — Optimierungsbacklog

Getestet als externer Erstnutzer am 03.04.2026 (v1.0.0).

---

## P0 — Kritisch (README lügt)

### 1. README zeigt falsche Config-Signatur
**Ist:** README zeigt `apiKey` als Config-Feld
**Soll:** Config erwartet `clientId` + `clientSecret`
**Impact:** Jeder Entwickler, der dem Quickstart folgt, bekommt sofort einen TypeScript-Fehler. Erster Eindruck kaputt.

### 2. README zeigt `client.papers.list()` — Methode existiert nicht
**Ist:** `papers.list({ status: 'verified' })`
**Soll:** `papers.search({ q: '...' })`
**Impact:** Zweiter Stolperstein in Folge. Copy-Paste aus README → Fehler.

### 3. README-Submit-Beispiel hat falsche Felder
**Ist:** `{ title, abstract, pubmedId, evidenceLevel }`
**Soll:** `{ title, abstract, authors, url, source }` (authors, url, source sind required!)
**Impact:** Dritter Fehler aus dem Quickstart.

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
| P0 (README lügt) | 3 | ~30 Min |
| P1 (Wichtig) | 5 | ~2h |
| P2 (Nice-to-have) | 8 | ~1 Tag |

**Empfehlung:** P0 sofort fixen — 3 Änderungen in der README, 10 Minuten. Danach P1 (package.json + Default-URL + Auth-Error-Mapping).
