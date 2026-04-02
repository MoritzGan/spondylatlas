# Mitwirken / Contributing

Vielen Dank für dein Interesse an SpondylAtlas! / Thank you for your interest in SpondylAtlas!

## Sprache / Language

- Code, Commit-Messages und PR-Beschreibungen: **Englisch**
- User-facing Strings: Immer über i18next in **Deutsch und Englisch**

## Entwicklung / Development

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build erstellen
npm run build

# Linting
npm run lint
```

## Richtlinien / Guidelines

1. **Forke** das Repository und erstelle einen Feature-Branch (`git checkout -b feature/mein-feature`)
2. **Schreibe** sauberen, typisierten TypeScript-Code
3. **Alle UI-Texte** müssen über i18next gehen — füge Übersetzungen in `src/i18n/locales/de.json` und `en.json` hinzu
4. **Teste** deine Änderungen lokal (`npm run build` muss fehlerfrei durchlaufen)
5. **Committe** mit klaren, beschreibenden Commit-Messages
6. **Erstelle** einen Pull Request gegen den `main`-Branch

## Code-Stil / Code Style

- TypeScript strict mode
- Tailwind CSS für Styling (keine separaten CSS-Dateien)
- Funktionale React-Komponenten mit Hooks
- Barrierefreiheit beachten (semantisches HTML, ARIA-Labels)

## Fehler melden / Bug Reports

Bitte erstelle ein [Issue](https://github.com/mgemard/spondylatlas/issues) mit:
- Beschreibung des Fehlers
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- Browser und Betriebssystem

## Verhaltenskodex / Code of Conduct

Wir behandeln alle Mitwirkenden mit Respekt. Beleidigende, diskriminierende oder anderweitig unangemessene Inhalte werden nicht toleriert.

We treat all contributors with respect. Offensive, discriminatory, or otherwise inappropriate content will not be tolerated.
