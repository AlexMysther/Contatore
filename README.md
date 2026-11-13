# Contatore
## Versione web (iPhone) – GitHub Pages

L'app `counter-app` viene pubblicata automaticamente su GitHub Pages ad ogni push su `main`
(workflow `.github/workflows/deploy-pages.yml`):

**https://alexmysther.github.io/Contatore/**

Su iPhone: apri il link in **Safari** → tasto **Condividi** → **Aggiungi alla schermata Home**.
L'app si aprirà a schermo intero come un'app normale.

Prima attivazione (una sola volta): su GitHub vai in *Settings → Pages* e imposta
**Source: GitHub Actions**.

Build locale: `cd counter-app && npx expo export -p web` (output in `dist/`).
Se il repository viene rinominato, aggiorna `experiments.baseUrl` in `app.json` e `BASE` in `app/+html.tsx`.
