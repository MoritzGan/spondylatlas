export const LEGAL_VERSION = '2026-04-02'

export type LegalDocumentKey =
  | 'imprint'
  | 'privacy'
  | 'terms'
  | 'communityRules'
  | 'storage'
  | 'reporting'
  | 'privacyContact'

type LocalizedText = {
  de: string
  en: string
}

export type LegalSection = {
  title: LocalizedText
  paragraphs?: LocalizedText[]
  bullets?: LocalizedText[]
}

export type LegalDocument = {
  path: string
  label: LocalizedText
  title: LocalizedText
  summary: LocalizedText
  lastUpdated: string
  sections: LegalSection[]
}

export const OPERATOR_DETAILS = {
  operatorName: 'Moritz Gansel',
  address: '[REPLACE BEFORE GO-LIVE: vollständige ladungsfähige Anschrift]',
  email: 'moritzgansel.mg@gmail.com',
  privacyEmail: 'moritzgansel.mg@gmail.com',
  legalContactEmail: 'moritzgansel.mg@gmail.com',
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  imprint: {
    path: '/impressum',
    label: { de: 'Impressum', en: 'Imprint' },
    title: { de: 'Impressum', en: 'Imprint' },
    summary: {
      de: 'Pflichtangaben zum Diensteanbieter nach DDG und Kontaktstellen nach DSA.',
      en: 'Mandatory provider details under German law and contact points under the DSA.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [
      {
        title: { de: 'Diensteanbieter', en: 'Service Provider' },
        paragraphs: [
          {
            de: `Betreiber dieser Website ist ${OPERATOR_DETAILS.operatorName}.`,
            en: `This website is operated by ${OPERATOR_DETAILS.operatorName}.`,
          },
          {
            de: `Anschrift: ${OPERATOR_DETAILS.address}.`,
            en: `Address: ${OPERATOR_DETAILS.address}.`,
          },
        ],
      },
      {
        title: { de: 'Kontakt', en: 'Contact' },
        bullets: [
          {
            de: `Allgemeine Kontaktadresse: ${OPERATOR_DETAILS.email}`,
            en: `General contact address: ${OPERATOR_DETAILS.email}`,
          },
          {
            de: `Kontakt für Datenschutzanfragen: ${OPERATOR_DETAILS.privacyEmail}`,
            en: `Privacy contact: ${OPERATOR_DETAILS.privacyEmail}`,
          },
          {
            de: `Elektronische Kontaktstelle für behördliche und rechtliche Anfragen: ${OPERATOR_DETAILS.legalContactEmail}`,
            en: `Electronic point of contact for legal and regulatory requests: ${OPERATOR_DETAILS.legalContactEmail}`,
          },
        ],
      },
      {
        title: { de: 'Hinweis vor Produktionsstart', en: 'Required Before Production' },
        paragraphs: [
          {
            de: 'Die markierten Platzhalter müssen vor dem Go-Live mit den realen Betreiberangaben ersetzt werden.',
            en: 'The placeholders on this page must be replaced with the real operator details before go-live.',
          },
        ],
      },
    ],
  },
  privacy: {
    path: '/datenschutz',
    label: { de: 'Datenschutz', en: 'Privacy' },
    title: { de: 'Datenschutzhinweise', en: 'Privacy Notice' },
    summary: {
      de: 'Informationen zu Verarbeitung, Rechtsgrundlagen, Speicherdauer, Betroffenenrechten und Community-Risiken.',
      en: 'Information on processing, legal bases, retention, data subject rights, and community risks.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [
      {
        title: { de: 'Verantwortlicher und Zweck', en: 'Controller and Purpose' },
        paragraphs: [
          {
            de: 'SpondylAtlas stellt einen Forschungsbereich und eine geschlossene Community für volljährige Nutzer bereit. Der öffentliche Forschungsbereich verarbeitet nur Inhalts- und Nutzungsdaten, die für Bereitstellung und Sicherheit erforderlich sind. Der geschützte Community-Bereich verarbeitet zusätzlich Registrierungs-, Profil- und Community-Inhalte.',
            en: 'SpondylAtlas provides a public research area and a closed community for adult users. The public research area processes only the content and usage data required for delivery and security. The protected community area also processes registration, profile, and community content.',
          },
        ],
      },
      {
        title: { de: 'Besondere Kategorien personenbezogener Daten', en: 'Special Categories of Personal Data' },
        paragraphs: [
          {
            de: 'Beiträge in der Community können Gesundheitsdaten enthalten oder Rückschlüsse darauf zulassen. Deshalb ist die Community nur nach Registrierung, E-Mail-Bestätigung und ausdrücklicher Einwilligung zur Verarbeitung gesundheitsbezogener Angaben zugänglich.',
            en: 'Community posts may contain health data or allow conclusions about health. For that reason, the community is available only after registration, email verification, and explicit consent to the processing of health-related information.',
          },
        ],
        bullets: [
          {
            de: 'Rechtsgrundlagen: Art. 6 Abs. 1 lit. b, c und f DSGVO; für gesundheitsbezogene Community-Angaben zusätzlich Art. 9 Abs. 2 lit. a DSGVO.',
            en: 'Legal bases: GDPR Art. 6(1)(b), (c), and (f); for health-related community information additionally GDPR Art. 9(2)(a).',
          },
          {
            de: 'Die Einwilligung kann im Profil widerrufen werden. Ein Widerruf wirkt für die Zukunft.',
            en: 'Consent can be withdrawn in the profile area. Withdrawal applies for the future.',
          },
        ],
      },
      {
        title: { de: 'Verarbeitungsvorgänge', en: 'Processing Activities' },
        bullets: [
          {
            de: 'Kontoregistrierung: Name, E-Mail-Adresse, Passwort-Hash beim Authentifizierungsdienst, Zeitpunkte der Registrierung und Bestätigung.',
            en: 'Account registration: name, email address, password hash at the authentication service, and registration/verification timestamps.',
          },
          {
            de: 'Rechts- und Einwilligungsnachweise: Versionen akzeptierter Dokumente, Zeitpunkte, Widerrufe und zugehörige Audit-Einträge.',
            en: 'Legal and consent records: accepted document versions, timestamps, withdrawals, and related audit entries.',
          },
          {
            de: 'Community-Betrieb: Themen, Antworten, Meldungen, Moderationsentscheidungen und notwendige Sicherheitsprotokolle.',
            en: 'Community operations: threads, replies, reports, moderation decisions, and necessary security logs.',
          },
          {
            de: 'Forschungsbereich: Abruf öffentlich gespeicherter Paper-Metadaten und Texte ohne personalisierte Werbung oder Tracking.',
            en: 'Research area: retrieval of publicly stored paper metadata and texts without personalised advertising or tracking.',
          },
        ],
      },
      {
        title: { de: 'Speicherdauer', en: 'Retention' },
        bullets: [
          {
            de: 'Account- und Einwilligungsnachweise werden grundsätzlich bis zur Löschung des Kontos und anschließend nur so lange aufbewahrt, wie gesetzliche Nachweis-, Sicherheits- oder Verteidigungspflichten dies erfordern.',
            en: 'Account and consent records are generally retained until account deletion and afterwards only as long as required for legal proof, security, or defence obligations.',
          },
          {
            de: 'Community-Inhalte werden nach Kontolöschung entweder gelöscht oder, soweit für Integrität laufender Diskussionen erforderlich, anonymisiert.',
            en: 'Community content is deleted or, where required to preserve ongoing discussions, anonymised after account deletion.',
          },
          {
            de: 'Sicherheits- und Zugriffsprotokolle werden kurzzeitig nach dem Need-to-keep-Prinzip aufbewahrt.',
            en: 'Security and access logs are retained for short periods on a need-to-keep basis.',
          },
        ],
      },
      {
        title: { de: 'Betroffenenrechte', en: 'Data Subject Rights' },
        bullets: [
          {
            de: 'Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch nach Maßgabe der DSGVO.',
            en: 'Access, rectification, erasure, restriction, portability, and objection as provided by the GDPR.',
          },
          {
            de: `Anfragen können über das Profil oder per E-Mail an ${OPERATOR_DETAILS.privacyEmail} gestellt werden.`,
            en: `Requests can be submitted via the profile area or by email to ${OPERATOR_DETAILS.privacyEmail}.`,
          },
        ],
      },
    ],
  },
  terms: {
    path: '/nutzungsbedingungen',
    label: { de: 'Nutzungsbedingungen', en: 'Terms' },
    title: { de: 'Nutzungsbedingungen', en: 'Terms of Use' },
    summary: {
      de: 'Regeln für Zugriff, Kontonutzung, Inhalte, Moderation und Haftungsgrenzen.',
      en: 'Rules for access, accounts, content, moderation, and liability limits.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [
      {
        title: { de: 'Geltungsbereich', en: 'Scope' },
        paragraphs: [
          {
            de: 'Die Plattform richtet sich ausschließlich an volljährige Nutzer. Medizinische Informationen dienen nur der allgemeinen Orientierung und ersetzen keine ärztliche Beratung.',
            en: 'The platform is intended for adults only. Medical information is provided for general orientation only and does not replace professional medical advice.',
          },
        ],
      },
      {
        title: { de: 'Nutzerkonten', en: 'User Accounts' },
        bullets: [
          {
            de: 'Für Community-Funktionen ist ein persönliches Konto mit wahrheitsgemäßen Angaben erforderlich.',
            en: 'A personal account with truthful information is required for community features.',
          },
          {
            de: 'Die E-Mail-Adresse muss vor dem Zugang zur Community bestätigt werden.',
            en: 'The email address must be verified before community access is granted.',
          },
          {
            de: 'Zugangsdaten sind vertraulich zu behandeln; missbräuchliche Nutzung ist untersagt.',
            en: 'Credentials must be kept confidential; misuse is prohibited.',
          },
        ],
      },
      {
        title: { de: 'Inhalte und Moderation', en: 'Content and Moderation' },
        bullets: [
          {
            de: 'Rechtswidrige, irreführende, beleidigende, diskriminierende oder gesundheitsgefährdende Inhalte sind unzulässig.',
            en: 'Illegal, misleading, abusive, discriminatory, or health-endangering content is not allowed.',
          },
          {
            de: 'Moderationsmaßnahmen können Beiträge ausblenden, einschränken oder Konten sperren; betroffene Nutzer erhalten eine dokumentierte Begründung.',
            en: 'Moderation measures may hide content, restrict access, or suspend accounts; affected users receive a documented explanation.',
          },
        ],
      },
      {
        title: { de: 'Haftung und Verfügbarkeit', en: 'Liability and Availability' },
        bullets: [
          {
            de: 'SpondylAtlas bemüht sich um eine sichere und verfügbare Plattform, schuldet jedoch keine unterbrechungsfreie Verfügbarkeit.',
            en: 'SpondylAtlas aims to provide a secure and available service, but does not guarantee uninterrupted availability.',
          },
          {
            de: 'Für medizinische Entscheidungen dürfen Inhalte der Plattform nicht allein maßgeblich sein.',
            en: 'Platform content must not be used as the sole basis for medical decisions.',
          },
        ],
      },
    ],
  },
  communityRules: {
    path: '/community-regeln',
    label: { de: 'Community-Regeln', en: 'Community Rules' },
    title: { de: 'Community-Regeln', en: 'Community Rules' },
    summary: {
      de: 'Klare Verhaltensregeln für einen sicheren, respektvollen und nachvollziehbar moderierten Austausch.',
      en: 'Clear conduct rules for a safe, respectful, and transparently moderated community.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [
      {
        title: { de: 'Grundprinzipien', en: 'Core Principles' },
        bullets: [
          {
            de: 'Respektvoll kommunizieren, auch bei Meinungsverschiedenheiten.',
            en: 'Communicate respectfully, including when you disagree.',
          },
          {
            de: 'Keine Diagnosen, Heilsversprechen oder Druck zu riskanten Behandlungen.',
            en: 'No diagnoses, miracle cures, or pressure toward risky treatments.',
          },
          {
            de: 'Keine Veröffentlichung fremder personenbezogener Daten ohne klare Berechtigung.',
            en: 'Do not publish other people’s personal data without clear authority.',
          },
        ],
      },
      {
        title: { de: 'Gesundheitsbezogene Inhalte', en: 'Health-Related Content' },
        bullets: [
          {
            de: 'Teile nur Angaben, die du bewusst öffentlich gegenüber anderen registrierten Mitgliedern machen möchtest.',
            en: 'Share only information that you intentionally want to make available to other registered members.',
          },
          {
            de: 'Kennzeichne persönliche Erfahrungen klar als persönliche Erfahrungen und nicht als medizinische Empfehlung.',
            en: 'Present personal experiences clearly as personal experience rather than medical advice.',
          },
          {
            de: 'Akute Krisen oder Notfälle gehören nicht in die Community, sondern an Notruf, Arzt oder Krisendienst.',
            en: 'Acute crises or emergencies do not belong in the community and should be directed to emergency services or healthcare professionals.',
          },
        ],
      },
      {
        title: { de: 'Meldungen und Durchsetzung', en: 'Reporting and Enforcement' },
        bullets: [
          {
            de: 'Verdächtige oder rechtswidrige Inhalte können über die Meldeseite gemeldet werden.',
            en: 'Suspicious or illegal content can be reported through the reporting page.',
          },
          {
            de: 'Wiederholte oder schwere Verstöße können zur Einschränkung oder Beendigung des Kontos führen.',
            en: 'Repeated or severe violations can lead to account restrictions or termination.',
          },
        ],
      },
    ],
  },
  storage: {
    path: '/cookies-und-speicherungen',
    label: { de: 'Cookies & Speicherungen', en: 'Cookies & Storage' },
    title: { de: 'Cookies und Speicherungen', en: 'Cookies and Storage' },
    summary: {
      de: 'Übersicht über die technisch erforderlichen Speicherungen der Website.',
      en: 'Overview of the technically necessary storage mechanisms used by the site.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [
      {
        title: { de: 'Grundsatz', en: 'Principle' },
        paragraphs: [
          {
            de: 'Zum Start werden keine Analyse-, Marketing- oder Werbe-Cookies eingesetzt. Die Website nutzt nur technisch erforderliche Speicherungen für Sprache, Anmeldung, Sicherheit und Rechtsnachweise.',
            en: 'At launch, the site does not use analytics, marketing, or advertising cookies. Only technically necessary storage is used for language, authentication, security, and legal records.',
          },
        ],
      },
      {
        title: { de: 'Erforderliche Speicherungen', en: 'Necessary Storage' },
        bullets: [
          {
            de: 'Sprachpräferenz-Cookie: merkt sich die gewählte Sprache auf dem eigenen Gerät.',
            en: 'Language preference cookie: remembers the selected language on the user’s device.',
          },
          {
            de: 'Anmeldungs- und Sicherheitsartefakte des Authentifizierungsdienstes: erforderlich für Login, Sitzungsführung und Missbrauchsschutz.',
            en: 'Authentication and security artefacts from the auth service: required for login, session handling, and abuse prevention.',
          },
          {
            de: 'Serverseitige Nachweise zu Einwilligungen, Widerrufen und Anträgen: erforderlich zur Erfüllung datenschutzrechtlicher Dokumentationspflichten.',
            en: 'Server-side records of consent, withdrawal, and requests: required to meet data protection documentation duties.',
          },
        ],
      },
      {
        title: { de: 'Zukünftige Änderungen', en: 'Future Changes' },
        paragraphs: [
          {
            de: 'Wenn später optionale Analyse- oder Komfortdienste eingeführt werden, wird vor deren Aktivierung ein gesondertes Einwilligungsmanagement mit gleichwertiger Ablehnungsoption bereitgestellt.',
            en: 'If optional analytics or convenience services are introduced later, a separate consent management layer with an equally easy reject option will be provided before activation.',
          },
        ],
      },
    ],
  },
  reporting: {
    path: '/meldung',
    label: { de: 'Meldung', en: 'Report Content' },
    title: { de: 'Meldung rechtswidriger oder regelwidriger Inhalte', en: 'Report Illegal or Rule-Breaking Content' },
    summary: {
      de: 'Meldestelle für Hinweise auf rechtswidrige Inhalte, Verstöße gegen Community-Regeln oder Sicherheitsprobleme.',
      en: 'Notice-and-action page for illegal content, community-rule violations, or security concerns.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [],
  },
  privacyContact: {
    path: '/kontakt-datenschutz',
    label: { de: 'Kontakt Datenschutz', en: 'Privacy Contact' },
    title: { de: 'Kontakt für Datenschutz und Recht', en: 'Privacy and Legal Contact' },
    summary: {
      de: 'Kontaktwege für Datenschutzrechte, Behördenanfragen, rechtliche Zustellungen und Sicherheitshinweise.',
      en: 'Contact details for privacy rights, regulatory requests, legal notices, and security issues.',
    },
    lastUpdated: LEGAL_VERSION,
    sections: [
      {
        title: { de: 'Kontaktkanäle', en: 'Contact Channels' },
        bullets: [
          {
            de: `Datenschutz: ${OPERATOR_DETAILS.privacyEmail}`,
            en: `Privacy: ${OPERATOR_DETAILS.privacyEmail}`,
          },
          {
            de: `Allgemein / Impressum: ${OPERATOR_DETAILS.email}`,
            en: `General / imprint: ${OPERATOR_DETAILS.email}`,
          },
          {
            de: `Recht / Behörden / DSA-Meldungen: ${OPERATOR_DETAILS.legalContactEmail}`,
            en: `Legal / authorities / DSA notices: ${OPERATOR_DETAILS.legalContactEmail}`,
          },
        ],
      },
      {
        title: { de: 'Betroffenenanfragen', en: 'Data Subject Requests' },
        paragraphs: [
          {
            de: 'Bitte gib bei Datenschutzanfragen möglichst dein Konto, die betroffene Funktion und das gewünschte Recht an, damit die Anfrage fristgerecht zugeordnet und beantwortet werden kann.',
            en: 'For privacy requests, please include your account, the affected function, and the right you want to exercise so the request can be assigned and answered within the required deadline.',
          },
        ],
      },
    ],
  },
}

export const PUBLIC_LEGAL_NAV = [
  LEGAL_DOCUMENTS.imprint,
  LEGAL_DOCUMENTS.privacy,
  LEGAL_DOCUMENTS.terms,
  LEGAL_DOCUMENTS.communityRules,
  LEGAL_DOCUMENTS.storage,
  LEGAL_DOCUMENTS.reporting,
  LEGAL_DOCUMENTS.privacyContact,
]

export const STORAGE_INVENTORY = [
  {
    key: 'language_preference',
    name: { de: 'Sprachpräferenz', en: 'Language preference' },
    storage: { de: 'First-Party-Cookie', en: 'First-party cookie' },
    purpose: {
      de: 'Speichert die manuell gewählte Sprache, damit die Website beim nächsten Besuch im gewünschten Sprachmodus startet.',
      en: 'Stores the manually chosen language so the site opens in the preferred language on the next visit.',
    },
    lifetime: { de: '12 Monate', en: '12 months' },
  },
  {
    key: 'auth_session',
    name: { de: 'Authentifizierung', en: 'Authentication' },
    storage: { de: 'Authentifizierungsartefakte', en: 'Authentication artefacts' },
    purpose: {
      de: 'Technisch erforderliche Anmeldung und Sitzungsverwaltung für geschützte Community-Bereiche.',
      en: 'Technically necessary sign-in and session handling for protected community areas.',
    },
    lifetime: { de: 'Dienstabhängig', en: 'Service-defined' },
  },
  {
    key: 'legal_records',
    name: { de: 'Rechtsnachweise', en: 'Legal records' },
    storage: { de: 'Serverseitige Datenbankeinträge', en: 'Server-side database records' },
    purpose: {
      de: 'Nachweis zu akzeptierten Rechtsdokumenten, Gesundheitsdaten-Einwilligungen, Widerrufen und Betroffenenanträgen.',
      en: 'Records accepted legal documents, health-data consent, withdrawals, and data subject requests.',
    },
    lifetime: { de: 'Nach Löschkonzept', en: 'According to retention policy' },
  },
] as const

export function isGermanLanguage(language: string) {
  return language.toLowerCase().startsWith('de')
}

export function localize(language: string, text: LocalizedText) {
  return isGermanLanguage(language) ? text.de : text.en
}
