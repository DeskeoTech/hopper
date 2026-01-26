# Documentation Hopper

> Documentation du projet générée le 2026-01-19

## Introduction

**Hopper** est une application Next.js de gestion d'espaces de coworking développée par Deskeo. Elle comprend :

- Une **interface admin** (`/admin`) pour gérer les sites, réservations et clients
- Une **interface client** (`/`) pour les utilisateurs finaux (consulter leur profil, crédits, réservations)

## Documents disponibles

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Stack technique, structure du projet, modèle de données, patterns de code |
| [Composants](./components.md) | Catalogue des composants UI avec props et exemples d'utilisation |

## Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm (recommandé) ou npm

### Installation

\`\`\`bash
# Cloner le repo
git clone <repo-url>
cd hopper

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase et Airtable

# Lancer le serveur de développement
npm run dev
\`\`\`

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `AIRTABLE_API_TOKEN` | Token API Airtable (pour vérification collaborateurs) |

### Commandes disponibles

\`\`\`bash
npm run dev      # Serveur de développement (port 3000)
npm run build    # Build de production
npm run lint     # Vérification ESLint
npm run start    # Serveur de production
\`\`\`

## Architecture résumée

\`\`\`
hopper/
├── app/                 # Pages Next.js (App Router)
│   ├── admin/          # Routes admin protégées
│   └── ...
├── components/          # Composants React
│   ├── ui/             # shadcn/ui
│   ├── admin/          # Composants admin
│   └── client/         # Composants client
├── lib/                 # Utilitaires
│   ├── supabase/       # Clients Supabase
│   ├── actions/        # Server Actions
│   └── types/          # Types TypeScript
└── public/              # Assets statiques
\`\`\`

## Technologies clés

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth (Magic Link) |
| Déploiement | Vercel |
| Dev UI | v0 (compatibilité requise) |

## Modèle de données principal

- **Sites** : Espaces de coworking physiques
- **Resources** : Éléments réservables (salles, postes, bureaux)
- **Companies** : Entreprises clientes
- **Users** : Utilisateurs des entreprises
- **Bookings** : Réservations de ressources
- **Credits** : Crédits mensuels pour les salles de réunion

## Contacts

- **Organisation** : Deskeo
- **Projet** : Hopper Coworking

---

*Documentation générée par BMAD Document Project Workflow v1.2.0*
