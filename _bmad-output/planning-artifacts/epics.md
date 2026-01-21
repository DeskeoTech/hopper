---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-03b-codebase-analysis
  - step-04-final-validation
status: complete
completedAt: 2026-01-20
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
project_name: hopper
user_name: Deskeo
date: 2026-01-20
---

# Hopper - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Hopper, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentification & Accès**
- FR1: Tout utilisateur peut se connecter via magic link (email)
- FR2: Le système peut vérifier si un utilisateur est collaborateur Deskeo via Airtable
- FR3: Le système peut rediriger l'utilisateur vers l'interface appropriée selon son rôle

**Gestion des Sites**
- FR4: Sales Deskeo peut créer un site
- FR5: Sales Deskeo peut modifier les informations d'un site (nom, adresse, horaires, WiFi, équipements)
- FR6: Sales Deskeo peut ajouter/supprimer des photos d'un site
- FR7: Sales Deskeo peut définir si un site est "nomad" ou non
- FR8: Office Manager peut modifier les informations de son site
- FR9: Office Manager peut consulter les entreprises présentes sur son site

**Gestion des Ressources**
- FR47: Sales Deskeo peut créer une ressource sur un site (salle de réunion, bench, flex desk)
- FR48: Sales Deskeo peut modifier une ressource
- FR49: Sales Deskeo peut supprimer une ressource
- FR50: Sales Deskeo peut consulter les ressources d'un site

**Dashboard Admin**
- FR51: Sales Deskeo peut consulter un tableau de bord avec les métriques clés
- FR52: Sales Deskeo peut voir les alertes d'abonnements arrivant à expiration

**Gestion des Entreprises**
- FR10: Sales Deskeo peut créer une entreprise (multi-utilisateurs ou individuelle)
- FR11: Sales Deskeo peut modifier les informations d'une entreprise
- FR12: Sales Deskeo peut supprimer une entreprise
- FR13: Sales Deskeo peut consulter la liste des entreprises

**Gestion des Abonnements**
- FR14: Sales Deskeo peut créer un abonnement bench pour une entreprise
- FR15: Sales Deskeo peut modifier un abonnement

**Attribution des Benchs**
- FR16: Sales Deskeo peut attribuer des benchs à une entreprise sur un site
- FR17: Sales Deskeo peut modifier l'attribution des benchs
- FR18: Sales Deskeo peut consulter l'occupation des benchs par site

**Gestion des Utilisateurs**
- FR19: Sales Deskeo peut créer un utilisateur pour une entreprise
- FR20: Sales Deskeo peut modifier un utilisateur
- FR21: Sales Deskeo peut désactiver/activer un utilisateur
- FR22: Admin Entreprise peut ajouter un utilisateur à son entreprise
- FR23: Admin Entreprise peut supprimer un utilisateur de son entreprise
- FR24: Admin Entreprise peut consulter la liste des utilisateurs de son entreprise

**Réservation de Salles de Réunion**
- FR25: Utilisateur Client peut rechercher une salle disponible (site, date, créneau, capacité)
- FR26: Utilisateur Client peut réserver une salle de réunion
- FR27: Utilisateur Client peut annuler sa réservation
- FR28: Utilisateur Client peut consulter ses réservations
- FR29: Utilisateur Flex nomade peut réserver une salle sur n'importe quel site nomad
- FR30: Le système peut vérifier les crédits disponibles avant une réservation
- FR31: Le système peut déduire les crédits lors d'une réservation

**Gestion des Réservations (Admin)**
- FR32: Sales Deskeo peut consulter toutes les réservations (tous sites)
- FR33: Sales Deskeo peut modifier une réservation
- FR34: Sales Deskeo peut annuler une réservation
- FR35: Sales Deskeo peut créer une réservation pour un client
- FR36: Office Manager peut consulter les réservations de son site
- FR37: Office Manager peut modifier une réservation sur son site
- FR38: Office Manager peut annuler une réservation sur son site

**Crédits**
- FR39: Utilisateur Client peut consulter le solde de crédits de son entreprise
- FR40: Sales Deskeo peut consulter les crédits d'une entreprise
- FR41: Sales Deskeo peut modifier les crédits d'une entreprise

**Notifications Email**
- FR42: Le système peut envoyer des notifications email (événements à définir)

**Webhooks**
- FR43: Le système peut envoyer des webhooks vers n8n (événements à définir)

**Consultation Profil**
- FR44: Utilisateur Client peut consulter son profil
- FR45: Utilisateur Client peut consulter les informations de son entreprise
- FR46: Utilisateur Flex nomade peut consulter la liste des sites nomad disponibles

### NonFunctional Requirements

**Performance**
- NFR1: Les pages doivent se charger en moins de 3 secondes
- NFR2: Les actions utilisateur (réservation, sauvegarde) doivent répondre en moins de 2 secondes

**Sécurité**
- NFR3: Authentification via magic link Supabase (pas de mot de passe stocké)
- NFR4: Données transmises en HTTPS
- NFR5: Accès aux données restreint selon le rôle (RLS Supabase)
- NFR6: Conformité RGPD (données utilisateurs européens)

**Intégrations**
- NFR7: Disponibilité des intégrations (Supabase, Airtable, Stripe) > 99%
- NFR8: Gestion gracieuse des erreurs d'intégration (messages utilisateur clairs)
- NFR9: Webhooks avec retry en cas d'échec

**UI/UX**
- NFR10: Interface responsive (desktop, tablet, mobile)
- NFR11: Respect du design system Deskeo

### Additional Requirements

**Contexte Projet (Brownfield)**
- Projet existant avec structure Next.js 16 / React 19 établie
- Stack technique imposée : Tailwind CSS 4, shadcn/ui, Supabase
- Contrainte de compatibilité v0 (Vercel)

**Patterns Architecturaux**
- Server Components par défaut, Client Components uniquement si interactivité requise
- Server Actions pour toutes les mutations de données
- Revalidation avec revalidatePath() après mutations
- Retours Server Actions standardisés : { success: true } ou { error: "message" }

**Intégrations**
- Notifications email via n8n (webhooks sortants)
- Stripe Customer Portal pour gestion abonnements (bouton externe)
- Vérification collaborateurs Deskeo via Airtable à la connexion

**Migration**
- Import données Spacebring → Hopper (entreprises, utilisateurs)
- Abonnements legacy affichés comme "Géré dans Spacebring"

**Conventions**
- Naming DB : snake_case (tables, colonnes)
- Naming Code : PascalCase (composants, types), camelCase (variables, fonctions)
- Messages utilisateur en français
- Types DB centralisés dans lib/types/database.ts

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Connexion magic link |
| FR2 | Epic 1 | Vérification Airtable |
| FR3 | Epic 1 | Redirection selon rôle |
| FR4 | Epic 2 | Créer site |
| FR5 | Epic 2 | Modifier site |
| FR6 | Epic 2 | Photos site |
| FR7 | Epic 2 | Définir site nomad |
| FR8 | Epic 2 | OM modifier son site |
| FR9 | Epic 2 | OM voir entreprises |
| FR10 | Epic 3 | Créer entreprise |
| FR11 | Epic 3 | Modifier entreprise |
| FR12 | Epic 3 | Supprimer entreprise |
| FR13 | Epic 3 | Liste entreprises |
| FR14 | Epic 3 | Créer abonnement |
| FR15 | Epic 3 | Modifier abonnement |
| FR16 | Epic 3 | Attribuer benchs |
| FR17 | Epic 3 | Modifier benchs |
| FR18 | Epic 3 | Consulter occupation |
| FR19 | Epic 4 | Créer utilisateur |
| FR20 | Epic 4 | Modifier utilisateur |
| FR21 | Epic 4 | Activer/désactiver |
| FR22 | Epic 4 | Admin ajouter user |
| FR23 | Epic 4 | Admin supprimer user |
| FR24 | Epic 4 | Admin liste users |
| FR25 | Epic 6 | Rechercher salle |
| FR26 | Epic 6 | Réserver salle |
| FR27 | Epic 6 | Annuler réservation |
| FR28 | Epic 6 | Consulter réservations |
| FR29 | Epic 6 | Nomade multi-sites |
| FR30 | Epic 6 | Vérifier crédits |
| FR31 | Epic 6 | Déduire crédits |
| FR32 | Epic 7 | Admin voir réservations |
| FR33 | Epic 7 | Admin modifier résa |
| FR34 | Epic 7 | Admin annuler résa |
| FR35 | Epic 7 | Admin créer résa |
| FR36 | Epic 7 | OM voir résa site |
| FR37 | Epic 7 | OM modifier résa |
| FR38 | Epic 7 | OM annuler résa |
| FR39 | Epic 5 | Consulter crédits |
| FR40 | Epic 7 | Admin voir crédits |
| FR41 | Epic 7 | Admin modifier crédits |
| FR42 | Epic 8 | Notifications email |
| FR43 | Epic 8 | Webhooks n8n |
| FR44 | Epic 5 | Consulter profil |
| FR45 | Epic 5 | Consulter entreprise |
| FR46 | Epic 5 | Consulter sites nomad |
| FR47 | Epic 2 | Créer ressource |
| FR48 | Epic 2 | Modifier ressource |
| FR49 | Epic 2 | Supprimer ressource |
| FR50 | Epic 2 | Consulter ressources |
| FR51 | Epic 7 | Dashboard métriques |
| FR52 | Epic 7 | Alertes abonnements |

## Epic List

### Epic 1: Authentification et Accès
Les utilisateurs peuvent se connecter via magic link et être redirigés vers l'interface appropriée selon leur rôle (Sales Deskeo, Office Manager, Admin Entreprise, Utilisateur Client).

**FRs couverts:** FR1, FR2, FR3

---

### Epic 2: Gestion Complète des Sites (Admin)
Les Sales Deskeo peuvent gérer tous les sites (création, modification, photos, équipements, horaires, statut nomad) et leurs ressources (salles de réunion, benchs). Les Office Managers peuvent modifier les informations de leur site et consulter les entreprises présentes.

**FRs couverts:** FR4, FR5, FR6, FR7, FR8, FR9, FR47, FR48, FR49, FR50

---

### Epic 3: Gestion des Entreprises et Abonnements (Admin)
Les Sales Deskeo peuvent créer et gérer les entreprises clientes (CRUD), leurs abonnements (bench, flex) et l'attribution des benchs sur les sites.

**FRs couverts:** FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18

---

### Epic 4: Gestion des Utilisateurs (Admin & Entreprise)
Les Sales Deskeo peuvent créer, modifier et activer/désactiver tous les utilisateurs. Les Admins Entreprise peuvent gérer les utilisateurs de leur propre entreprise.

**FRs couverts:** FR19, FR20, FR21, FR22, FR23, FR24

---

### Epic 5: Interface Client - Profil et Consultation
Les clients peuvent consulter leur profil, les informations de leur entreprise, leurs crédits disponibles et la liste des sites nomad.

**FRs couverts:** FR39, FR44, FR45, FR46

---

### Epic 6: Réservation de Salles (Client)
Les clients peuvent rechercher des salles disponibles, effectuer des réservations, les annuler et consulter leur historique. Le système vérifie et déduit automatiquement les crédits. Les utilisateurs flex nomade peuvent réserver sur tous les sites nomad.

**FRs couverts:** FR25, FR26, FR27, FR28, FR29, FR30, FR31

---

### Epic 7: Gestion des Réservations et Crédits (Admin)
Les Sales Deskeo peuvent consulter, modifier, annuler et créer des réservations pour tous les sites et gérer les crédits des entreprises. Les Office Managers peuvent gérer les réservations de leur site. Inclut également le dashboard admin avec métriques et alertes.

**FRs couverts:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR40, FR41, FR51, FR52

---

### Epic 8: Notifications et Automatisations
Le système envoie des notifications email et des webhooks vers n8n pour les automatisations (événements à définir).

**FRs couverts:** FR42, FR43

---

## Implementation Status Summary

> **Légende:** ✅ `[DONE]` Implémenté | ⚠️ `[PARTIAL]` Partiel | 🔲 `[TODO]` À faire

| Epic | Done | Partial | TODO | Total |
|------|------|---------|------|-------|
| 1 - Authentification | 3 | 0 | 0 | 3 |
| 2 - Sites & Ressources | 3 | 4 | 3 | 10 |
| 3 - Entreprises | 2 | 1 | 6 | 9 |
| 4 - Utilisateurs | 3 | 0 | 3 | 6 |
| 5 - Client Profil | 3 | 1 | 0 | 4 |
| 6 - Réservation Client | 4 | 2 | 0 | 6 |
| 7 - Admin Réservations & Dashboard | 4 | 1 | 5 | 10 |
| 8 - Notifications | 0 | 0 | 2 | 2 |
| **Total** | **22** | **9** | **19** | **50** |

### Priorités de Développement

**Gaps Critiques à Combler:**
1. 🔲 Création de sites et entreprises (CRUD incomplet)
2. 🔲 Gestion des ressources (création/suppression salles et benchs)
3. 🔲 Gestion des benchs (attribution, visualisation)
4. 🔲 Interface Admin Entreprise (gestion utilisateurs côté client)
5. 🔲 Actions admin sur réservations (modifier, annuler, créer)
6. 🔲 Gestion des crédits (historique, modification)
7. 🔲 Notifications et webhooks n8n

---

## Epic 1: Authentification et Accès ✅ COMPLET

Les utilisateurs peuvent se connecter via magic link et être redirigés vers l'interface appropriée selon leur rôle.

### Story 1.1: Connexion via Magic Link ✅ [DONE]

As a **utilisateur (tous rôles)**,
I want **me connecter via magic link envoyé par email**,
So that **je puisse accéder à l'application sans gérer de mot de passe**.

**Acceptance Criteria:**

**Given** je suis sur la page de connexion
**When** je saisis mon email et soumets le formulaire
**Then** un email avec un lien de connexion est envoyé
**And** un message de confirmation s'affiche à l'écran

**Given** j'ai reçu un magic link par email
**When** je clique sur le lien dans les 60 minutes
**Then** je suis authentifié et une session est créée
**And** je suis redirigé vers l'application

**Given** je clique sur un magic link expiré ou invalide
**When** le système vérifie le token
**Then** une page d'erreur s'affiche avec un message clair en français
**And** un lien permet de demander un nouveau magic link

---

### Story 1.2: Vérification Collaborateur Deskeo via Airtable ✅ [DONE]

As a **collaborateur Deskeo (Sales ou Office Manager)**,
I want **être automatiquement reconnu comme admin lors de ma connexion**,
So that **j'accède directement à l'interface admin sans configuration manuelle**.

**Acceptance Criteria:**

**Given** je suis authentifié avec un email
**When** le système vérifie mon email dans la base Airtable des collaborateurs
**Then** si mon email est présent, mon rôle admin (Sales ou OM) est attribué
**And** mon rôle est stocké dans la session utilisateur

**Given** mon email n'est pas dans la liste Airtable
**When** la vérification est effectuée
**Then** je suis traité comme utilisateur client
**And** je n'ai pas accès à l'interface admin

**Given** l'API Airtable est indisponible
**When** le système tente la vérification
**Then** une erreur gracieuse est affichée en français
**And** l'utilisateur peut réessayer plus tard

---

### Story 1.3: Routage par Rôle après Connexion ✅ [DONE]

As a **utilisateur authentifié**,
I want **être automatiquement redirigé vers l'interface correspondant à mon rôle**,
So that **j'accède directement aux fonctionnalités qui me concernent**.

**Acceptance Criteria:**

**Given** je suis authentifié en tant que Sales Deskeo
**When** la session est établie
**Then** je suis redirigé vers `/admin`
**And** j'ai accès à toutes les fonctionnalités admin (tous sites)

**Given** je suis authentifié en tant qu'Office Manager
**When** la session est établie
**Then** je suis redirigé vers `/admin`
**And** j'ai accès uniquement aux fonctionnalités de mon site assigné

**Given** je suis authentifié en tant qu'Admin Entreprise ou Utilisateur Client
**When** la session est établie
**Then** je suis redirigé vers `/` (interface client)
**And** j'ai accès aux fonctionnalités client selon mon rôle

**Given** je tente d'accéder à `/admin/*` sans rôle admin
**When** le middleware vérifie mes permissions
**Then** je suis redirigé vers l'interface client
**And** un message toast m'informe que je n'ai pas accès à cette section

---

## Epic 2: Gestion Complète des Sites et Ressources (Admin) ⚠️ PARTIEL

Les Sales Deskeo et Office Managers peuvent gérer les sites de coworking et leurs ressources (salles, benchs).

### Story 2.1: Créer un Site 🔲 [TODO]

As a **Sales Deskeo**,
I want **créer un nouveau site de coworking**,
So that **je puisse ajouter de nouveaux espaces au réseau Deskeo**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que Sales Deskeo sur `/admin/sites`
**When** je clique sur "Nouveau site" et remplis le formulaire (nom, adresse obligatoires)
**Then** le site est créé dans la base de données
**And** je suis redirigé vers la page de détail du site
**And** un toast confirme "Site créé avec succès"

**Given** je soumets un formulaire avec des champs obligatoires manquants
**When** la validation s'exécute
**Then** les erreurs sont affichées inline sous les champs concernés
**And** le formulaire n'est pas soumis

---

### Story 2.2: Modifier les Informations d'un Site ✅ [DONE]

As a **Sales Deskeo**,
I want **modifier les informations d'un site (nom, adresse, horaires, WiFi, équipements)**,
So that **les informations affichées aux clients soient toujours à jour**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site `/admin/sites/[id]`
**When** je clique sur "Modifier" pour une section (horaires, WiFi, équipements, etc.)
**Then** une modale s'ouvre avec les champs éditables
**And** les valeurs actuelles sont pré-remplies

**Given** je modifie les informations dans la modale
**When** je clique sur "Enregistrer"
**Then** les données sont mises à jour en base
**And** la modale se ferme
**And** la page se rafraîchit avec les nouvelles valeurs
**And** un toast confirme "Site mis à jour"

**Given** je clique sur "Annuler" dans la modale
**When** des modifications sont en cours
**Then** la modale se ferme sans sauvegarder
**And** les données originales sont conservées

---

### Story 2.3: Gérer les Photos d'un Site ✅ [DONE]

As a **Sales Deskeo**,
I want **ajouter et supprimer des photos d'un site**,
So that **les clients puissent visualiser les espaces avant de réserver**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site
**When** je clique sur "Ajouter une photo" et sélectionne un fichier image
**Then** l'image est uploadée dans Supabase Storage (bucket `site-photos`)
**And** la photo apparaît dans la galerie du site
**And** un toast confirme "Photo ajoutée"

**Given** une photo existe dans la galerie du site
**When** je clique sur l'icône de suppression de cette photo
**Then** une confirmation est demandée
**And** si confirmé, la photo est supprimée du Storage et de la base
**And** un toast confirme "Photo supprimée"

**Given** j'uploade un fichier non-image ou trop volumineux
**When** la validation s'exécute
**Then** une erreur est affichée
**And** l'upload est refusé

---

### Story 2.4: Définir le Statut Nomad d'un Site ⚠️ [PARTIAL]

As a **Sales Deskeo**,
I want **définir si un site est accessible aux abonnés flex nomade**,
So that **les nomades puissent voir quels sites leur sont accessibles**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site
**When** je modifie le toggle "Site Nomad"
**Then** le statut `is_nomad` est mis à jour en base
**And** un toast confirme le changement

**Given** un site est marqué comme "nomad"
**When** un utilisateur flex nomade consulte les sites disponibles
**Then** ce site apparaît dans sa liste de sites accessibles

---

### Story 2.5: Office Manager - Modifier son Site ⚠️ [PARTIAL]

As a **Office Manager**,
I want **modifier les informations de mon site assigné**,
So that **je puisse maintenir les informations à jour sans passer par les Sales**.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'Office Manager
**When** j'accède à `/admin/sites`
**Then** je vois uniquement mon site assigné

**Given** je suis sur la page de mon site
**When** je modifie les informations (horaires, WiFi, équipements, photos)
**Then** les modifications sont sauvegardées
**And** le comportement est identique à celui d'un Sales

**Given** je tente d'accéder à un site qui n'est pas le mien
**When** je navigue vers `/admin/sites/[autre-id]`
**Then** je reçois une erreur 404 ou suis redirigé

---

### Story 2.6: Office Manager - Consulter les Entreprises Présentes ⚠️ [PARTIAL]

As a **Office Manager**,
I want **consulter la liste des entreprises présentes sur mon site**,
So that **je connaisse les clients qui utilisent mon espace**.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'Office Manager
**When** j'accède à la section entreprises de mon site
**Then** je vois la liste des entreprises ayant un abonnement ou des benchs sur mon site
**And** je peux voir les informations de base (nom, type, nombre d'utilisateurs)

**Given** je clique sur une entreprise
**When** la page de détail s'affiche
**Then** je vois les informations de l'entreprise en lecture seule
**And** je ne peux pas modifier les données de l'entreprise

---

### Story 2.7: Créer une Ressource sur un Site 🔲 [TODO]

As a **Sales Deskeo**,
I want **créer une ressource (salle de réunion, bench, flex desk) sur un site**,
So that **les clients puissent réserver ces espaces**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site
**When** je clique sur "Ajouter une ressource"
**Then** un formulaire s'affiche avec : nom, type (meeting_room, bench, flex_desk, fixed_desk), capacité, étage, équipements

**Given** je remplis le formulaire avec des données valides
**When** je soumets
**Then** la ressource est créée et liée au site
**And** un toast confirme "Ressource créée"
**And** la ressource apparaît dans la liste des ressources du site

**Given** je crée une salle de réunion
**When** la ressource est créée
**Then** elle devient disponible à la réservation pour les clients

---

### Story 2.8: Modifier une Ressource ⚠️ [PARTIAL]

As a **Sales Deskeo**,
I want **modifier les informations d'une ressource**,
So that **les détails affichés aux clients soient à jour**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site avec des ressources
**When** je clique sur "Modifier" pour une ressource
**Then** une modale s'ouvre avec les champs éditables

**Given** je modifie les informations (nom, capacité, équipements)
**When** je sauvegarde
**Then** la ressource est mise à jour
**And** un toast confirme "Ressource mise à jour"

---

### Story 2.9: Supprimer une Ressource 🔲 [TODO]

As a **Sales Deskeo**,
I want **supprimer une ressource**,
So that **je puisse retirer les espaces qui ne sont plus disponibles**.

**Acceptance Criteria:**

**Given** je suis sur la liste des ressources d'un site
**When** je clique sur "Supprimer" pour une ressource
**Then** une confirmation est demandée

**Given** la ressource a des réservations futures
**When** je confirme la suppression
**Then** une erreur est affichée "Impossible de supprimer : réservations futures existantes"

**Given** la ressource n'a pas de réservations futures
**When** je confirme la suppression
**Then** la ressource est supprimée
**And** un toast confirme "Ressource supprimée"

---

### Story 2.10: Consulter les Ressources d'un Site ✅ [DONE]

As a **Sales Deskeo**,
I want **consulter la liste des ressources d'un site**,
So that **je connaisse les espaces disponibles**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site
**When** je consulte la section ressources
**Then** je vois la liste des ressources avec : nom, type, capacité, étage

**Given** je filtre par type de ressource
**When** j'applique le filtre
**Then** seules les ressources du type sélectionné sont affichées

---

## Epic 3: Gestion des Entreprises et Abonnements (Admin) ⚠️ PARTIEL

Les Sales Deskeo peuvent gérer les entreprises clientes, leurs abonnements et l'attribution des benchs.

### Story 3.1: Créer une Entreprise 🔲 [TODO]

As a **Sales Deskeo**,
I want **créer une nouvelle entreprise cliente**,
So that **je puisse onboarder de nouveaux clients dans Hopper**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que Sales sur `/admin/clients`
**When** je clique sur "Nouvelle entreprise"
**Then** un formulaire s'affiche avec les champs : nom (obligatoire), type (multi-utilisateurs/individuelle), SIRET, adresse, contact

**Given** je remplis le formulaire avec des données valides
**When** je soumets le formulaire
**Then** l'entreprise est créée en base
**And** je suis redirigé vers la page de détail de l'entreprise
**And** un toast confirme "Entreprise créée"

**Given** je soumets un formulaire avec un nom déjà existant
**When** la validation s'exécute
**Then** une erreur est affichée "Une entreprise avec ce nom existe déjà"

---

### Story 3.2: Modifier une Entreprise ✅ [DONE]

As a **Sales Deskeo**,
I want **modifier les informations d'une entreprise**,
So that **je puisse mettre à jour les données clients**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'une entreprise `/admin/clients/[id]`
**When** je clique sur "Modifier" pour une section
**Then** une modale s'ouvre avec les champs éditables

**Given** je modifie les informations
**When** je sauvegarde
**Then** les données sont mises à jour
**And** un toast confirme "Entreprise mise à jour"

---

### Story 3.3: Supprimer une Entreprise 🔲 [TODO]

As a **Sales Deskeo**,
I want **supprimer une entreprise**,
So that **je puisse retirer les clients qui ne sont plus actifs**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'une entreprise
**When** je clique sur "Supprimer l'entreprise"
**Then** une modale de confirmation s'affiche avec un avertissement

**Given** l'entreprise a des utilisateurs ou des réservations actives
**When** je confirme la suppression
**Then** une erreur est affichée "Impossible de supprimer : utilisateurs ou réservations actifs"

**Given** l'entreprise n'a pas de données liées actives
**When** je confirme la suppression
**Then** l'entreprise est supprimée (soft delete ou hard delete selon la politique)
**And** je suis redirigé vers la liste des entreprises
**And** un toast confirme "Entreprise supprimée"

---

### Story 3.4: Consulter la Liste des Entreprises ✅ [DONE]

As a **Sales Deskeo**,
I want **consulter et filtrer la liste des entreprises**,
So that **je puisse trouver rapidement un client**.

**Acceptance Criteria:**

**Given** je suis sur `/admin/clients`
**When** la page se charge
**Then** je vois la liste paginée de toutes les entreprises
**And** je peux voir : nom, type, site principal, nombre d'utilisateurs

**Given** je saisis du texte dans la barre de recherche
**When** je tape
**Then** la liste se filtre en temps réel sur le nom de l'entreprise

**Given** je sélectionne un filtre (type, site)
**When** le filtre est appliqué
**Then** la liste affiche uniquement les entreprises correspondantes

---

### Story 3.5: Créer un Abonnement Bench 🔲 [TODO]

As a **Sales Deskeo**,
I want **créer un abonnement bench pour une entreprise**,
So that **l'entreprise puisse avoir des postes attribués**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'une entreprise
**When** je clique sur "Créer un abonnement"
**Then** un formulaire s'affiche avec : type (bench), site, date début, date fin, crédits salles inclus

**Given** je remplis le formulaire avec des données valides
**When** je soumets
**Then** l'abonnement est créé et lié à l'entreprise
**And** un toast confirme "Abonnement créé"

---

### Story 3.6: Modifier un Abonnement ⚠️ [PARTIAL]

As a **Sales Deskeo**,
I want **modifier un abonnement existant**,
So that **je puisse ajuster les conditions d'un client**.

**Acceptance Criteria:**

**Given** je suis sur la page d'une entreprise avec un abonnement
**When** je clique sur "Modifier l'abonnement"
**Then** une modale s'ouvre avec les champs éditables

**Given** je modifie les données (dates, crédits)
**When** je sauvegarde
**Then** l'abonnement est mis à jour
**And** un toast confirme "Abonnement mis à jour"

---

### Story 3.7: Attribuer des Benchs à une Entreprise 🔲 [TODO]

As a **Sales Deskeo**,
I want **attribuer des benchs spécifiques à une entreprise sur un site**,
So that **l'entreprise ait des postes réservés**.

**Acceptance Criteria:**

**Given** je suis sur la page d'une entreprise avec un abonnement bench
**When** je clique sur "Attribuer des benchs"
**Then** je vois la liste des benchs disponibles sur le site de l'abonnement

**Given** je sélectionne un ou plusieurs benchs
**When** je confirme l'attribution
**Then** les benchs sont liés à l'entreprise
**And** ils n'apparaissent plus comme disponibles
**And** un toast confirme "Benchs attribués"

---

### Story 3.8: Modifier l'Attribution des Benchs 🔲 [TODO]

As a **Sales Deskeo**,
I want **modifier les benchs attribués à une entreprise**,
So that **je puisse réorganiser l'espace**.

**Acceptance Criteria:**

**Given** une entreprise a des benchs attribués
**When** je clique sur "Modifier les benchs"
**Then** je peux ajouter ou retirer des benchs

**Given** je retire un bench
**When** je sauvegarde
**Then** le bench redevient disponible pour d'autres entreprises
**And** un toast confirme la modification

---

### Story 3.9: Consulter l'Occupation des Benchs par Site 🔲 [TODO]

As a **Sales Deskeo**,
I want **consulter l'occupation des benchs sur un site**,
So that **je connaisse la disponibilité avant d'attribuer**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'un site
**When** je consulte la section "Occupation des benchs"
**Then** je vois la liste des benchs avec leur statut (disponible/attribué)
**And** pour les benchs attribués, je vois l'entreprise associée

**Given** je filtre par statut
**When** j'applique le filtre
**Then** seuls les benchs correspondants sont affichés

---

## Epic 4: Gestion des Utilisateurs (Admin & Entreprise) ⚠️ PARTIEL

Les Sales Deskeo et Admins Entreprise peuvent gérer les utilisateurs.

### Story 4.1: Sales - Créer un Utilisateur ✅ [DONE]

As a **Sales Deskeo**,
I want **créer un utilisateur pour une entreprise**,
So that **les collaborateurs puissent accéder à l'application**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'une entreprise
**When** je clique sur "Ajouter un utilisateur"
**Then** un formulaire s'affiche avec : email (obligatoire), prénom, nom, rôle (admin entreprise ou utilisateur)

**Given** je soumets un email valide
**When** l'utilisateur n'existe pas déjà
**Then** l'utilisateur est créé et lié à l'entreprise
**And** un email d'invitation peut être envoyé (optionnel)
**And** un toast confirme "Utilisateur créé"

**Given** l'email existe déjà dans le système
**When** je soumets
**Then** une erreur est affichée "Cet email est déjà utilisé"

---

### Story 4.2: Sales - Modifier un Utilisateur ✅ [DONE]

As a **Sales Deskeo**,
I want **modifier les informations d'un utilisateur**,
So that **je puisse corriger ou mettre à jour les données**.

**Acceptance Criteria:**

**Given** je suis sur la page d'une entreprise avec des utilisateurs
**When** je clique sur "Modifier" pour un utilisateur
**Then** une modale s'ouvre avec les champs éditables

**Given** je modifie les informations (nom, rôle)
**When** je sauvegarde
**Then** les données sont mises à jour
**And** un toast confirme "Utilisateur mis à jour"

---

### Story 4.3: Sales - Activer/Désactiver un Utilisateur ✅ [DONE]

As a **Sales Deskeo**,
I want **activer ou désactiver un utilisateur**,
So that **je puisse contrôler l'accès sans supprimer le compte**.

**Acceptance Criteria:**

**Given** un utilisateur est actif
**When** je clique sur "Désactiver"
**Then** l'utilisateur est marqué comme inactif
**And** il ne peut plus se connecter
**And** un toast confirme "Utilisateur désactivé"

**Given** un utilisateur est inactif
**When** je clique sur "Activer"
**Then** l'utilisateur peut à nouveau se connecter
**And** un toast confirme "Utilisateur activé"

---

### Story 4.4: Admin Entreprise - Ajouter un Utilisateur 🔲 [TODO]

As a **Admin Entreprise**,
I want **ajouter un collaborateur à mon entreprise**,
So that **mon équipe puisse utiliser Hopper**.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'Admin Entreprise
**When** j'accède à la gestion des utilisateurs de mon entreprise
**Then** je vois la liste de mes collaborateurs et un bouton "Ajouter"

**Given** je clique sur "Ajouter un utilisateur"
**When** je saisis un email valide
**Then** l'utilisateur est créé avec le rôle "utilisateur client"
**And** un toast confirme "Collaborateur ajouté"

**Given** mon entreprise a atteint le nombre maximum d'utilisateurs selon le forfait
**When** j'essaie d'ajouter un utilisateur
**Then** une erreur est affichée "Limite d'utilisateurs atteinte"

---

### Story 4.5: Admin Entreprise - Supprimer un Utilisateur 🔲 [TODO]

As a **Admin Entreprise**,
I want **supprimer un collaborateur de mon entreprise**,
So that **les anciens employés n'aient plus accès**.

**Acceptance Criteria:**

**Given** je suis Admin Entreprise avec des collaborateurs
**When** je clique sur "Supprimer" pour un utilisateur
**Then** une confirmation est demandée

**Given** je confirme la suppression
**When** l'utilisateur n'a pas de réservations futures
**Then** l'utilisateur est retiré de l'entreprise
**And** un toast confirme "Collaborateur retiré"

**Given** l'utilisateur a des réservations futures
**When** je confirme
**Then** les réservations sont annulées ou transférées (selon la règle métier)
**And** l'utilisateur est retiré

---

### Story 4.6: Admin Entreprise - Consulter la Liste des Utilisateurs 🔲 [TODO]

As a **Admin Entreprise**,
I want **consulter la liste des utilisateurs de mon entreprise**,
So that **je puisse gérer mon équipe**.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'Admin Entreprise
**When** j'accède à la page de gestion des utilisateurs
**Then** je vois la liste de tous les utilisateurs de mon entreprise
**And** je vois pour chaque utilisateur : nom, email, rôle, statut

**Given** la liste contient plusieurs utilisateurs
**When** je recherche par nom ou email
**Then** la liste est filtrée en temps réel

---

## Epic 5: Interface Client - Profil et Consultation ✅ QUASI-COMPLET

Les clients peuvent consulter leur profil, entreprise, crédits et sites nomad.

### Story 5.1: Consulter son Profil ✅ [DONE]

As a **Utilisateur Client**,
I want **consulter mon profil**,
So that **je puisse voir mes informations personnelles**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que client
**When** j'accède à la page d'accueil `/`
**Then** je vois mes informations de profil (nom, email)
**And** je vois mon rôle (admin entreprise ou utilisateur)

---

### Story 5.2: Consulter les Informations de son Entreprise ✅ [DONE]

As a **Utilisateur Client (multi-users)**,
I want **consulter les informations de mon entreprise**,
So that **je connaisse les détails de mon abonnement**.

**Acceptance Criteria:**

**Given** je suis client d'une entreprise multi-utilisateurs
**When** j'accède à la page d'accueil
**Then** je vois les informations de mon entreprise (nom, type d'abonnement)
**And** je vois le site principal si applicable

**Given** je suis un utilisateur individuel (flex)
**When** j'accède à mon profil
**Then** je vois mon type d'abonnement personnel

---

### Story 5.3: Consulter le Solde de Crédits ✅ [DONE]

As a **Utilisateur Client**,
I want **consulter le solde de crédits de mon entreprise**,
So that **je sache combien de crédits sont disponibles pour réserver**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que client
**When** j'accède à la page d'accueil
**Then** je vois le solde de crédits actuel de mon entreprise
**And** le solde est affiché de manière visible (card dédiée)

**Given** mon entreprise n'a pas de crédits
**When** je consulte
**Then** je vois "0 crédit disponible"

---

### Story 5.4: Consulter les Sites Nomad Disponibles ⚠️ [PARTIAL]

As a **Utilisateur Flex Nomade**,
I want **consulter la liste des sites nomad disponibles**,
So that **je sache où je peux travailler**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que flex nomade
**When** j'accède à la section sites
**Then** je vois la liste des sites marqués comme "nomad"
**And** je vois pour chaque site : nom, adresse, équipements

**Given** je suis un utilisateur flex classique (non nomade)
**When** j'accède à la section sites
**Then** je vois uniquement mon site d'abonnement

---

## Epic 6: Réservation de Salles (Client) ⚠️ QUASI-COMPLET

Les clients peuvent rechercher et réserver des salles de réunion.

### Story 6.1: Rechercher une Salle Disponible ✅ [DONE]

As a **Utilisateur Client**,
I want **rechercher une salle disponible selon mes critères**,
So that **je trouve une salle adaptée à mes besoins**.

**Acceptance Criteria:**

**Given** je suis sur l'interface de réservation
**When** je sélectionne un site, une date et une plage horaire
**Then** je vois les salles disponibles correspondant à mes critères

**Given** je filtre par capacité
**When** je sélectionne "6 personnes minimum"
**Then** seules les salles de 6+ personnes sont affichées

**Given** aucune salle n'est disponible pour mes critères
**When** la recherche s'exécute
**Then** un message "Aucune salle disponible" s'affiche
**And** des créneaux alternatifs peuvent être suggérés

---

### Story 6.2: Réserver une Salle de Réunion ✅ [DONE]

As a **Utilisateur Client**,
I want **réserver une salle de réunion**,
So that **je puisse organiser mes réunions**.

**Acceptance Criteria:**

**Given** j'ai trouvé une salle disponible
**When** je clique sur "Réserver" et confirme le créneau
**Then** la réservation est créée
**And** les crédits sont vérifiés puis déduits
**And** un toast confirme "Réservation confirmée"
**And** la salle n'est plus disponible pour ce créneau

**Given** je n'ai pas assez de crédits
**When** je tente de réserver
**Then** une erreur est affichée "Crédits insuffisants"
**And** la réservation n'est pas effectuée

---

### Story 6.3: Annuler une Réservation ⚠️ [PARTIAL]

As a **Utilisateur Client**,
I want **annuler une de mes réservations**,
So that **je puisse libérer le créneau si je ne peux plus venir**.

**Acceptance Criteria:**

**Given** j'ai une réservation future
**When** je clique sur "Annuler" depuis mes réservations
**Then** une confirmation est demandée

**Given** je confirme l'annulation
**When** l'annulation est dans les délais autorisés
**Then** la réservation est annulée
**And** les crédits sont restitués à l'entreprise
**And** un toast confirme "Réservation annulée"

**Given** l'annulation est hors délai
**When** je confirme
**Then** la réservation est annulée
**And** les crédits ne sont pas restitués (selon règle métier)
**And** un message m'en informe

---

### Story 6.4: Consulter ses Réservations ✅ [DONE]

As a **Utilisateur Client**,
I want **consulter l'historique de mes réservations**,
So that **je puisse voir mes réservations passées et futures**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que client
**When** j'accède à la section "Mes réservations"
**Then** je vois mes réservations à venir en premier
**And** je peux voir l'historique des réservations passées

**Given** j'ai des réservations
**When** je consulte la liste
**Then** je vois pour chaque réservation : date, heure, salle, site, statut

---

### Story 6.5: Flex Nomade - Réserver sur un Site Nomad ⚠️ [PARTIAL]

As a **Utilisateur Flex Nomade**,
I want **réserver une salle sur n'importe quel site nomad**,
So that **je puisse travailler depuis différents lieux**.

**Acceptance Criteria:**

**Given** je suis un utilisateur flex nomade
**When** je recherche une salle
**Then** je peux sélectionner n'importe quel site marqué comme "nomad"

**Given** je sélectionne un site nomad
**When** je réserve une salle
**Then** la réservation est créée normalement
**And** mes crédits sont utilisés

**Given** je suis un utilisateur flex classique (non nomade)
**When** je recherche une salle
**Then** je ne peux sélectionner que mon site d'abonnement

---

### Story 6.6: Vérification et Déduction des Crédits ✅ [DONE]

As a **Système**,
I want **vérifier et déduire automatiquement les crédits lors d'une réservation**,
So that **le solde de crédits soit toujours à jour**.

**Acceptance Criteria:**

**Given** un utilisateur effectue une réservation
**When** le système traite la demande
**Then** le système vérifie que l'entreprise a suffisamment de crédits
**And** si oui, les crédits sont déduits atomiquement

**Given** une réservation est annulée dans les délais
**When** l'annulation est traitée
**Then** les crédits sont restitués au solde de l'entreprise

**Given** deux utilisateurs réservent simultanément le dernier crédit
**When** les deux requêtes arrivent
**Then** une seule réservation réussit
**And** l'autre reçoit une erreur "Crédits insuffisants"

---

## Epic 7: Gestion des Réservations, Crédits et Dashboard (Admin) ⚠️ PARTIEL

Les Sales Deskeo et Office Managers peuvent gérer les réservations et crédits, avec un dashboard de suivi.

### Story 7.1: Sales - Consulter Toutes les Réservations ✅ [DONE]

As a **Sales Deskeo**,
I want **consulter toutes les réservations sur tous les sites**,
So that **j'aie une vue globale de l'activité**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que Sales
**When** j'accède à `/admin/reservations`
**Then** je vois la liste de toutes les réservations (tous sites)
**And** je peux filtrer par site, date, entreprise, statut

**Given** je filtre par site "République"
**When** le filtre est appliqué
**Then** seules les réservations de République sont affichées

**Given** je sélectionne une vue calendrier
**When** la vue change
**Then** les réservations sont affichées dans un format calendrier (semaine/mois)

---

### Story 7.2: Sales - Modifier une Réservation 🔲 [TODO]

As a **Sales Deskeo**,
I want **modifier une réservation existante**,
So that **je puisse ajuster les réservations pour les clients**.

**Acceptance Criteria:**

**Given** je suis sur la page des réservations
**When** je clique sur une réservation puis "Modifier"
**Then** une modale s'ouvre avec les champs éditables (date, heure, salle)

**Given** je modifie le créneau
**When** le nouveau créneau est disponible
**Then** la réservation est mise à jour
**And** un toast confirme "Réservation modifiée"

**Given** le nouveau créneau n'est pas disponible
**When** je tente de sauvegarder
**Then** une erreur est affichée "Créneau non disponible"

---

### Story 7.3: Sales - Annuler une Réservation 🔲 [TODO]

As a **Sales Deskeo**,
I want **annuler une réservation**,
So that **je puisse libérer des créneaux si nécessaire**.

**Acceptance Criteria:**

**Given** je suis sur une réservation
**When** je clique sur "Annuler"
**Then** une confirmation est demandée avec option de restituer les crédits

**Given** je confirme avec restitution des crédits
**When** l'annulation est traitée
**Then** la réservation est annulée
**And** les crédits sont restitués
**And** un toast confirme "Réservation annulée, crédits restitués"

---

### Story 7.4: Sales - Créer une Réservation pour un Client 🔲 [TODO]

As a **Sales Deskeo**,
I want **créer une réservation au nom d'un client**,
So that **je puisse aider les clients qui en ont besoin**.

**Acceptance Criteria:**

**Given** je suis sur la page des réservations
**When** je clique sur "Nouvelle réservation"
**Then** un formulaire s'affiche avec : entreprise, utilisateur, site, salle, date, heure

**Given** je remplis le formulaire avec des données valides
**When** je soumets
**Then** la réservation est créée au nom de l'utilisateur sélectionné
**And** les crédits de l'entreprise sont déduits
**And** un toast confirme "Réservation créée"

---

### Story 7.5: Office Manager - Consulter les Réservations de son Site ⚠️ [PARTIAL]

As a **Office Manager**,
I want **consulter les réservations de mon site**,
So that **je puisse gérer l'occupation des salles**.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'Office Manager
**When** j'accède à la page des réservations
**Then** je vois uniquement les réservations de mon site

**Given** je filtre par date
**When** le filtre est appliqué
**Then** les réservations sont filtrées pour mon site uniquement

---

### Story 7.6: Office Manager - Modifier/Annuler une Réservation 🔲 [TODO]

As a **Office Manager**,
I want **modifier ou annuler une réservation sur mon site**,
So that **je puisse gérer les imprévus**.

**Acceptance Criteria:**

**Given** je suis Office Manager sur une réservation de mon site
**When** je clique sur "Modifier" ou "Annuler"
**Then** je peux effectuer l'action comme un Sales
**And** les règles de crédits s'appliquent

**Given** je tente de modifier une réservation d'un autre site
**When** je navigue vers cette réservation
**Then** je n'ai pas accès aux actions de modification

---

### Story 7.7: Sales - Consulter les Crédits d'une Entreprise ✅ [DONE]

As a **Sales Deskeo**,
I want **consulter le solde de crédits d'une entreprise**,
So that **je puisse informer le client de sa situation**.

**Acceptance Criteria:**

**Given** je suis sur la page de détail d'une entreprise
**When** je consulte la section crédits
**Then** je vois le solde actuel de crédits
**And** je vois l'historique des mouvements (réservations, ajustements)

**Implementation Notes (2026-01-21):**
- Section Crédits ajoutée sur `/admin/clients/[id]`
- Composants: `CreditsSection`, `CreditsHistoryTable`
- Filtrage par type (Réservation, Annulation, Ajustement)
- Design responsive intégré

---

### Story 7.8: Sales - Modifier les Crédits d'une Entreprise 🔲 [TODO]

As a **Sales Deskeo**,
I want **modifier le solde de crédits d'une entreprise**,
So that **je puisse ajuster les crédits (ajout, geste commercial, correction)**.

**Acceptance Criteria:**

**Given** je suis sur la section crédits d'une entreprise
**When** je clique sur "Modifier les crédits"
**Then** une modale s'ouvre pour ajouter ou retirer des crédits avec un motif

**Given** j'ajoute 10 crédits avec le motif "Geste commercial"
**When** je sauvegarde
**Then** le solde est augmenté de 10
**And** le mouvement est enregistré dans l'historique
**And** un toast confirme "Crédits mis à jour"

---

### Story 7.9: Dashboard Admin - Métriques Clés ✅ [DONE]

As a **Sales Deskeo**,
I want **consulter un tableau de bord avec les métriques clés**,
So that **j'aie une vue d'ensemble de l'activité**.

**Acceptance Criteria:**

**Given** je suis connecté en tant que Sales Deskeo
**When** j'accède à `/admin`
**Then** je vois le dashboard avec les métriques : nombre de sites, nombre d'entreprises, réservations de la semaine

**Given** je consulte le dashboard
**When** les données sont chargées
**Then** les compteurs sont affichés dans des cards dédiées
**And** je peux cliquer sur chaque card pour accéder à la section correspondante

---

### Story 7.10: Dashboard Admin - Alertes Abonnements ✅ [DONE]

As a **Sales Deskeo**,
I want **voir les alertes d'abonnements arrivant à expiration**,
So that **je puisse anticiper les renouvellements**.

**Acceptance Criteria:**

**Given** je suis sur le dashboard admin
**When** des abonnements expirent dans les 30 prochains jours
**Then** une section "Abonnements à renouveler" s'affiche
**And** je vois la liste des entreprises concernées avec la date d'expiration

**Given** je clique sur une entreprise dans la liste
**When** je suis redirigé
**Then** j'arrive sur la page de détail de l'entreprise

**Given** aucun abonnement n'expire prochainement
**When** je consulte le dashboard
**Then** la section alertes n'affiche pas d'éléments ou affiche "Aucun abonnement à renouveler"

---

## Epic 8: Notifications et Automatisations 🔲 NON IMPLÉMENTÉ

Le système envoie des notifications et webhooks pour les automatisations.

### Story 8.1: Envoyer des Notifications Email 🔲 [TODO]

As a **Système**,
I want **envoyer des notifications email aux utilisateurs**,
So that **ils soient informés des événements importants**.

**Acceptance Criteria:**

**Given** un événement déclencheur se produit (ex: réservation confirmée)
**When** l'événement est traité
**Then** un webhook est envoyé à n8n avec les données de l'événement
**And** n8n se charge d'envoyer l'email approprié

**Given** le webhook échoue
**When** n8n ne répond pas
**Then** le système logue l'erreur
**And** un retry est tenté (selon configuration)

**Événements à supporter (MVP):**
- Réservation confirmée
- Réservation annulée
- Nouvel utilisateur ajouté

---

### Story 8.2: Envoyer des Webhooks vers n8n 🔲 [TODO]

As a **Système**,
I want **envoyer des webhooks vers n8n pour les événements métier**,
So that **des automatisations externes puissent être déclenchées**.

**Acceptance Criteria:**

**Given** un événement métier se produit
**When** l'événement est configuré pour envoyer un webhook
**Then** une requête POST est envoyée à l'URL configurée (`WEBHOOK_N8N_URL`)
**And** le payload contient les données de l'événement (type, entité, timestamp)

**Given** le webhook échoue (timeout, erreur 5xx)
**When** l'échec est détecté
**Then** le système tente jusqu'à 3 retries avec backoff exponentiel
**And** les échecs définitifs sont loggés

**Given** l'URL webhook n'est pas configurée
**When** un événement se produit
**Then** aucun webhook n'est envoyé
**And** l'application continue de fonctionner normalement

