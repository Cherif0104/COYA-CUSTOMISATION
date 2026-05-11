# Automatisations — Core

| ID | Déclencheur | Actions |
|----|-------------|---------|
| AUTO-CORE-001 | `User.JoinedOrganization` | Notification admin org |
| AUTO-CORE-002 | `Organization.StatusChanged` → `suspended` | Révocation sessions actives (policy) |
| AUTO-CORE-003 | Seuil invitations échouées | Alerte sécurité |
