# Système de design — Assemblées de Dieu d'Anyama

À lire avant toute modification de l'interface (Gemini / Claude / développeur).

## Couleurs (définies dans `src/index.css`, utilisables en classes Tailwind)
- `church-blue` #2854A6 — actions, liens, repères actifs
- `church-navy` #173567 — titres, jours de culte, pied de page
- `church-light` #F4F6F9 — fond de page
- `church-dark` #343B46 — texte courant
- `church-line` #E1E6EE — bordures et séparateurs
- `church-muted` #5E6672 — texte secondaire
- Pas de dégradés décoratifs, pas d'ombres.

## Typographie
- Titres : Source Serif 4 (classe `font-serif`, appliquée automatiquement aux h1–h3)
- Texte : Public Sans, 16 px minimum sur mobile
- Titres en minuscules (pas de MAJUSCULES espacées), pas de police « mono ».

## Classes prêtes à l'emploi
`page` (conteneur), `btn-primary`, `btn-secondary`, `btn-ghost`, `surface` (bloc blanc bordé),
`chip` / `chip-active` (filtres), `field` (champ de saisie), `link`, `demo-tag`.
Composants : `src/components/ui.tsx`
- PageIntro (en-tête des pages de liste), SectionHead, Meta, DateBlock, EmptyState, formatDate
- BackBar (barre « ← Retour » + « Partager » des pages de détail), BlockTitle, Lightbox (visionneuse photo/vidéo, glisser au doigt), useToast (message de confirmation)

Agenda : `src/calendar.ts` crée des fichiers .ics (agenda du téléphone) pour les cultes hebdomadaires et les événements, avec rappel 1 h avant.

## Règles de contenu
- Horaires : source unique `CHURCH_INFO.schedules` dans `src/mockData.ts`.
- Téléphone / e-mail : vides tant qu'ils ne sont pas confirmés ; le pied de page les masque.
- Ne pas inventer la signification des sigles des départements.
- Les contenus de démonstration portent la mention « Démonstration » (`isDemo: true`).

## Règles d'ergonomie
- Pages de détail : toujours BackBar en haut, une seule page qui défile (pas d'onglets qui cachent le contenu).
- Une partie sans contenu ne s'affiche pas (pas de bloc vide, pas de faux contenu).
- Partage : sur téléphone, le menu de partage du système s'ouvre directement ; le lien pointe vers le contenu exact.
- Le public ne voit que les cultes au statut « publie ».
- Aucun bouton factice : un bouton fait vraiment ce qu'il annonce, sinon il est masqué ou indique « Bientôt disponible ».
- Zones tactiles d'au moins 44 px de haut.
