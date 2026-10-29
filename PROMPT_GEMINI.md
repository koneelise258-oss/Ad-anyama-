# Prompt à donner à Gemini (Google AI Studio)

Copie tout le texte entre les deux lignes ci-dessous et colle-le dans Gemini, en joignant les fichiers du dossier (ou le zip).

---

Je te transmets une nouvelle version de mon projet React/Vite (site des Assemblées de Dieu d'Anyama, Ran Extension Résidentiel). Le design et l'ergonomie ont été entièrement refaits. Ta mission est d'intégrer cette version à l'identique, pas de la réécrire.

RÈGLE PRINCIPALE
Remplace le contenu de chaque fichier listé ci-dessous par le contenu EXACT du fichier que je te fournis, caractère pour caractère. Ne reformule pas, ne « simplifie » pas, ne réorganise pas, ne change aucune classe CSS, aucun texte, aucune couleur. Si un fichier que je fournis n'existe pas encore dans le projet, crée-le au même chemin.

FICHIERS NOUVEAUX (à créer)
- DESIGN.md
- src/calendar.ts
- src/vite-env.d.ts
- src/components/ui.tsx
- src/components/SiteFooter.tsx

FICHIERS MODIFIÉS (à remplacer entièrement)
- index.html
- src/index.css
- src/App.tsx
- src/types.ts
- src/mockData.ts
- src/components/Header.tsx
- src/components/MobileBottomNav.tsx
- src/components/HomeView.tsx
- src/components/CultesView.tsx
- src/components/CulteDetailPage.tsx
- src/components/EventsView.tsx
- src/components/EventDetailPage.tsx
- src/components/NewsView.tsx
- src/components/NewsDetailPage.tsx
- src/components/GalerieView.tsx
- src/components/AlbumDetailPage.tsx
- src/components/DepartementsView.tsx
- src/components/DepartmentDetailPage.tsx
- src/components/ShareModal.tsx
- src/components/NotificationModal.tsx
- src/components/AdminPortal.tsx

IMAGES
Les 4 images de src/assets/images/ ont été compressées (mêmes noms). Remplace-les par celles que je fournis. Ne génère pas de nouvelles images.
Les images sont maintenant importées dans src/mockData.ts (import heroImg from './assets/images/...'), et non plus référencées par un chemin « /src/assets/... » qui ne fonctionne pas une fois le site publié. Ne reviens pas à l'ancienne méthode.

CE QUE TU NE DOIS PAS FAIRE
- Ne pas remettre de numéros de téléphone, d'e-mail, de noms de responsables, d'horaires de départements ou de statistiques inventés. Les champs non confirmés restent vides volontairement.
- Ne pas inventer la signification des sigles (MIFA, PNPR, JADCI…). Les noms des départements sont exactement ceux de mockData.ts.
- Ne pas réintroduire de dégradés, d'ombres, de titres en MAJUSCULES espacées, de police « mono », ni les anciennes couleurs slate/emerald/rose.
- Ne pas remettre les onglets dans la page de détail d'un culte : c'est désormais une seule page qui défile avec un sommaire.
- Ne pas remettre de faux lecteur audio, de faux téléchargements ou de faux formulaire d'alertes : chaque bouton doit faire réellement ce qu'il annonce.
- Ne pas ajouter de nouvelles dépendances npm.

APRÈS LE REMPLACEMENT
1. Lance la vérification TypeScript (tsc --noEmit) et la compilation (vite build). Corrige uniquement une erreur bloquante éventuelle, de la façon la plus petite possible, et dis-moi exactement ce que tu as changé.
2. Vérifie dans l'aperçu, en format téléphone puis ordinateur : l'accueil, une prédication, un événement, la galerie, un département, et l'espace administration.
3. Fais-moi un compte rendu court : fichiers remplacés, fichiers créés, erreurs rencontrées et corrections.

Pour toutes les modifications futures, lis d'abord DESIGN.md et respecte ses règles : palette, typographie, composants partagés de src/components/ui.tsx, et règles de contenu.

---
