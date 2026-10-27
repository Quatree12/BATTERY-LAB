
# BATTERY LAB

**Personal Battery Intelligence**

BATTERY LAB est une webapp mobile-first pour suivre manuellement le niveau de batterie de plusieurs appareils, visualiser les relevés et consulter leur historique.

## Fonctionnalités

- Tableau de bord avec statistiques.
- Suivi de plusieurs appareils.
- Enregistrement manuel du niveau de batterie.
- Historique et graphique des relevés.
- Marquage des recharges.
- Export des données au format JSON.
- Interface cyber-tech adaptée aux mobiles.

## Technologies

- React
- Vite
- Chart.js
- Lucide React
- GitHub Pages

## Lancement local

Installe Node.js, puis exécute :

```bash
npm install
npm run dev
```

Pour construire la version de production :

```bash
npm run build
```

Le site généré se trouve dans le dossier `dist`.

## Publication

Le déploiement est automatisé avec GitHub Actions, via le fichier `.github/workflows/deploy.yml`.

Dans les paramètres du dépôt GitHub, configure **Settings → Pages → Build and deployment → Source → GitHub Actions**.

## Confidentialité et limites

Les relevés sont stockés dans le stockage local du navigateur. Ils ne sont pas automatiquement synchronisés entre appareils.

La webapp ne lit pas automatiquement l'historique natif de la batterie iOS ni le niveau de batterie Bluetooth des écouteurs.

Les données saisies sont des relevés manuels.
