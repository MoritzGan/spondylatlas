# Retention Matrix

Version: `2026-04-02`

| Dataset | Default retention | End state |
|---|---|---|
| User account core data | Until account deletion | Delete unless statutory retention applies |
| Legal acceptance records | Account lifetime + compliance defence window | Delete when no longer needed |
| Health-data consent records | Account lifetime + proof window | Delete when no longer needed |
| Community posts | Until user deletion or moderation outcome | Delete or anonymise |
| Content reports | Until review closure + follow-up window | Delete or minimise |
| Moderation decisions | Audit window | Delete when no longer needed |
| Audit events | Short to medium security/compliance window | Delete on schedule |
| Access/security logs | Short retention | Delete automatically |

Exact day-based retention values must be fixed in production operations and applied consistently in backend jobs.
