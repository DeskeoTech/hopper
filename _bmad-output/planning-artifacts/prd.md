---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain-skipped
  - step-06-innovation-skipped
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - docs/index.md
  - docs/architecture.md
  - docs/components.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 3
workflowType: 'prd'
projectContext: 'greenfield'
classification:
  projectType: 'Web Application SaaS (B2B)'
  domain: 'PropTech / Gestion espaces coworking'
  complexity: 'medium'
  integrations:
    - Supabase (DB + Auth + Storage)
    - Airtable (vérification collaborateurs Deskeo)
    - Stripe (paiements clients)
  devEnvironment:
    - BMAD (documentation + méthodologie)
    - Claude Code + MCP Linear (suivi tâches)
    - v0 (génération UI - contrainte compatibilité)
  team: 'Petite équipe assistée par IA'
---

# Product Requirements Document - Hopper

**Author:** Deskeo
**Date:** 2026-01-20
**Version:** 1.0

## Executive Summary

**Hopper** est une application web de gestion d'espaces de coworking pour Deskeo. Elle se compose de deux interfaces :

- **Interface Admin** : pour les équipes Deskeo (Sales et Office Managers) qui gèrent les sites, clients, abonnements et réservations
- **Interface Client** : pour les entreprises clientes et freelances qui réservent des salles de réunion et consultent leurs crédits

**Scope Hopper :** Gestion des clients existants uniquement. La souscription initiale et les modifications d'abonnement passent par d'autres canaux (app de réservation, formulaire de contact, équipe Sales).

**Vision long terme :** Commercialisation SaaS à d'autres gestionnaires de coworking (multi-tenant).

**Stack technique :** Next.js 16, React 19, Supabase, Tailwind CSS 4, shadcn/ui. Contrainte de compatibilité v0.

## Success Criteria

### User Success

**Admins Deskeo :**
- Administration fluide des clients et abonnements en quelques clics
- Gestion efficace des tâches courantes (création client, modification abonnement, suivi réservations)
- Gestion des abonnements bench (réservé à Deskeo)
- Gain de temps sur les opérations quotidiennes

**Admins Entreprise :**
- Gérer les utilisateurs de leur entreprise (ajouter/supprimer des collaborateurs)
- Contrôler le nombre d'utilisateurs selon leur forfait
- Visibilité sur l'utilisation des crédits par leur équipe

**Utilisateurs Client :**
- Accès rapides aux fonctionnalités clés (crédits, réservations, profil)
- Interface belle et agréable, cohérente avec l'identité Deskeo

### Business Success

**Court terme (focus Deskeo) :**
- Adoption de l'app par les clients (réduction des appels/emails à Deskeo)
- Autonomie des entreprises pour gérer leurs utilisateurs
- Gain de temps pour l'équipe admin

**Long terme (vision produit) :**
- Commercialisation SaaS à d'autres gestionnaires de coworking
- Architecture multi-tenant prête pour plusieurs opérateurs

### Technical Success

- Compatibilité v0 (contrainte de développement)
- Performance et réactivité de l'interface
- Intégrations fiables (Supabase, Airtable, Stripe)
- Architecture pensée pour le multi-tenant futur

### Measurable Outcomes

- Réduction du temps admin pour créer un client/abonnement
- Taux d'adoption de l'app par les clients vs contact direct Deskeo
- Nombre de réservations de salles via l'app

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche MVP :** Produit complet pour tous les parcours utilisateurs identifiés, focus Deskeo mono-tenant.

**Interfaces :** Admin et Client développées en parallèle.

**Parcours MVP :** Les 6 parcours complets (Sophie, Marc, Thomas, Léa, Julie, Antoine).

### Phase 1 - MVP

**Interface Admin (Sales Deskeo) :**
- Gestion des sites (CRUD, photos, équipements, horaires)
- Gestion des entreprises (CRUD)
- Gestion des abonnements (création, modification)
- Attribution des benchs
- Gestion des utilisateurs
- Gestion des réservations (visualisation, filtres, modification, annulation)

**Interface Admin (Office Manager) :**
- Gestion des infos de son site
- Gestion des réservations salles de son site
- Consultation des entreprises présentes

**Interface Client (Admin Entreprise) :**
- Gestion des utilisateurs de son entreprise
- Réservation de salles de réunion
- Consultation des crédits entreprise

**Interface Client (Utilisateur multi-users) :**
- Réservation de salles de réunion
- Consultation des crédits entreprise
- Historique des réservations

**Interface Client (Utilisateur individuel flex) :**
- Réservation de salles de réunion
- Consultation des crédits

**Transverse :**
- Notifications email (événements à définir)
- Webhooks n8n (événements à définir)

### Phase 2 - Growth (Post-MVP)

- Dashboard admin Deskeo avec statistiques
- Dashboard admin entreprise (usage détaillé par collaborateur)
- Notifications push
- Export de données / rapports
- Gestion avancée des contrats

### Phase 3 - Vision (Future)

- Multi-tenant : support de plusieurs gestionnaires de coworking
- White-label / personnalisation par opérateur
- Application mobile native
- Intégrations calendrier (Google, Outlook)
- Système de feedback / notation des espaces
- Fonctionnalités communautaires entre coworkers

### Crédits

**Modèle :** Crédits au niveau entreprise (pas par utilisateur).

Tous les utilisateurs d'une entreprise voient le même solde de crédits restants.

### Risk Mitigation Strategy

| Type de risque | Risque | Mitigation |
|----------------|--------|------------|
| **Technique** | Compatibilité v0 | Validation régulière avec l'outil v0 |
| **Ressources** | Petite équipe | Méthodologie BMAD + assistance IA |
| **Marché** | Adoption | Focus Deskeo d'abord, validation avant multi-tenant |

## User Roles

| Rôle | Périmètre | Permissions |
|------|-----------|-------------|
| **Sales Deskeo** | Tous les sites | Tout gérer : clients, abonnements, benchs, salles, infos entreprises, réservations |
| **Office Manager** | Son site | Gérer infos site, gérer réservations salles, voir entreprises présentes |
| **Admin Entreprise** | Son entreprise | Gérer utilisateurs, réserver salles, voir crédits |
| **Utilisateur Client** (multi-users) | Son compte | Réserver salles, voir crédits |
| **Utilisateur Individuel** (flex) | Son compte | Réserver salles, voir crédits |

## Types d'entreprises

| Type | Caractéristiques | Abonnement typique |
|------|------------------|-------------------|
| **Multi-utilisateurs** | Équipe de plusieurs personnes | Custom + benchs attribués par Sales Deskeo |
| **Individuelle** | Freelance / solo | Flex classique ou nomade |

## Types d'abonnements

| Abonnement | Accès | Périodicité | Souscription |
|------------|-------|-------------|--------------|
| **Bench** | Poste attribué sur un site | Custom | Via Sales Deskeo uniquement |
| **Flex classique** | Poste flexible sur **un site** | Jour/semaine/mois | Autre app (hors scope) |
| **Flex nomade** | Poste flexible sur **tous les sites nomad** | Semaine/mois uniquement | Autre app (hors scope) |

## Gestion des abonnements

| Action | Qui peut faire | Comment |
|--------|----------------|---------|
| Souscrire (initial) | - | Hors scope Hopper (app de réservation ou Sales) |
| Upgrader flex → nomade | - | Hors scope Hopper (app de réservation ou Sales) |
| Modifier abonnement | - | Formulaire de contact Deskeo |
| Résilier | - | Formulaire de contact Deskeo |

## User Journeys

### 1. Sophie, Sales Deskeo

**Persona :** Sophie, 28 ans, commerciale chez Deskeo. Elle gère le portefeuille clients sur l'ensemble des sites.

**Parcours - Création client :**
1. Créer l'entreprise cliente dans Hopper
2. Choisir le site et attribuer les benchs
3. Créer l'abonnement (type, durée, crédits salles)
4. Créer l'admin entreprise
5. Le client reçoit son accès

**Capacités :**
- Tout gérer sur tous les sites
- Créer/modifier/supprimer entreprises, abonnements, utilisateurs
- Attribuer des benchs
- Gérer les salles de réunion et réservations

---

### 2. Marc, Office Manager

**Persona :** Marc, 35 ans, Office Manager du site Deskeo République.

**Parcours - Gestion quotidienne :**
1. Modifier les infos du site (horaires, WiFi, équipements, photos)
2. Gérer les réservations de salles (voir, modifier, annuler)
3. Voir les entreprises présentes sur son site

**Limites :**
- Ne peut pas créer/modifier clients ou abonnements
- Ne voit que son site

---

### 3. Thomas, Admin Entreprise (multi-utilisateurs)

**Persona :** Thomas, 40 ans, dirigeant de la startup "TechFlow" (8 personnes).

**Parcours - Gestion équipe :**
1. Ajouter/supprimer des collaborateurs
2. Voir l'utilisation des crédits par son équipe

**Parcours - Utilisation personnelle :**
- Réserver des salles de réunion (c'est aussi un utilisateur)
- Voir ses crédits

**Limites :**
- Ne peut pas modifier/résilier l'abonnement (→ formulaire contact)

---

### 4. Léa, Utilisatrice Client (multi-utilisateurs)

**Persona :** Léa, 26 ans, développeuse chez TechFlow.

**Parcours - Réservation salle :**
1. Se connecter à Hopper
2. Voir ses crédits disponibles
3. Chercher une salle disponible (site, date, capacité)
4. Réserver le créneau
5. Recevoir confirmation

---

### 5. Julie, Freelance - Flex classique

**Persona :** Julie, 34 ans, consultante indépendante avec un abonnement flex classique sur République.

**Parcours :**
- Réserver des salles de réunion
- Voir ses crédits

**Limites :**
- Ne peut pas modifier/upgrader son abonnement (→ formulaire contact ou app de réservation)

---

### 6. Antoine, Freelance - Flex nomade

**Persona :** Antoine, 29 ans, consultant digital nomade avec un abonnement flex nomade.

**Parcours :**
- Consulter les sites disponibles (labellisés nomad)
- Travailler depuis n'importe quel site nomad
- Réserver des salles de réunion sur différents sites
- Voir ses crédits et réservations

---

### Edge case : Crédits insuffisants

**Scénario :** Léa essaie de réserver mais n'a plus assez de crédits.

**Parcours :**
1. Tentative de réservation → message "crédits insuffisants"
2. Contacte Thomas (admin entreprise)
3. Thomas voit l'usage équipe et peut modifier l'abonnement

## Journey Requirements Summary

| Capacité requise | Parcours concernés |
|------------------|-------------------|
| Gestion des sites (CRUD) | Sophie, Marc |
| Gestion des entreprises (CRUD) | Sophie |
| Gestion des abonnements | Sophie |
| Attribution de benchs | Sophie |
| Gestion des utilisateurs | Sophie, Thomas |
| Réservation de salles | Tous sauf Marc |
| Gestion des réservations | Sophie, Marc |
| Consultation crédits | Thomas, Léa, Julie, Antoine |
| Accès multi-sites | Antoine |

## SaaS B2B Specific Requirements

### Architecture MVP

| Aspect | Décision |
|--------|----------|
| **Multi-tenancy** | Hors scope MVP - mono-tenant Deskeo |
| **Permissions** | 5 rôles fixes, pas de configuration fine |

### Intégrations

| Service | Usage |
|---------|-------|
| **Supabase** | DB + Auth (magic link) + Storage (photos) |
| **Airtable** | Vérification collaborateurs Deskeo à la connexion |
| **Stripe** | Paiements clients |
| **Webhooks n8n** | Automatisations externes |

### Architecture Webhooks

| Aspect | Décision |
|--------|----------|
| **Approche** | URLs en variables d'environnement (Option B) |
| **Configuration** | `WEBHOOK_N8N_URL` dans les variables d'env |
| **Événements** | À définir (ex: création réservation admin) |
| **Payload** | À définir ultérieurement avec l'équipe n8n |

### Contraintes techniques

- **Compatibilité v0** : Code compatible avec l'outil v0 de Vercel pour génération UI
- **Stack imposée** : Next.js 16, React 19, Tailwind CSS 4, shadcn/ui

## Functional Requirements

### Authentification & Accès

- **FR1:** Tout utilisateur peut se connecter via magic link (email)
- **FR2:** Le système peut vérifier si un utilisateur est collaborateur Deskeo via Airtable
- **FR3:** Le système peut rediriger l'utilisateur vers l'interface appropriée selon son rôle

### Gestion des Sites

- **FR4:** Sales Deskeo peut créer un site
- **FR5:** Sales Deskeo peut modifier les informations d'un site (nom, adresse, horaires, WiFi, équipements)
- **FR6:** Sales Deskeo peut ajouter/supprimer des photos d'un site
- **FR7:** Sales Deskeo peut définir si un site est "nomad" ou non
- **FR8:** Office Manager peut modifier les informations de son site
- **FR9:** Office Manager peut consulter les entreprises présentes sur son site

### Gestion des Ressources

- **FR47:** Sales Deskeo peut créer une ressource sur un site (salle de réunion, bench, flex desk)
- **FR48:** Sales Deskeo peut modifier une ressource
- **FR49:** Sales Deskeo peut supprimer une ressource
- **FR50:** Sales Deskeo peut consulter les ressources d'un site

### Gestion des Entreprises

- **FR10:** Sales Deskeo peut créer une entreprise (multi-utilisateurs ou individuelle)
- **FR11:** Sales Deskeo peut modifier les informations d'une entreprise
- **FR12:** Sales Deskeo peut supprimer une entreprise
- **FR13:** Sales Deskeo peut consulter la liste des entreprises

### Gestion des Abonnements

- **FR14:** Sales Deskeo peut créer un abonnement bench pour une entreprise
- **FR15:** Sales Deskeo peut modifier un abonnement

### Attribution des Benchs

- **FR16:** Sales Deskeo peut attribuer des benchs à une entreprise sur un site
- **FR17:** Sales Deskeo peut modifier l'attribution des benchs
- **FR18:** Sales Deskeo peut consulter l'occupation des benchs par site

### Gestion des Utilisateurs

- **FR19:** Sales Deskeo peut créer un utilisateur pour une entreprise
- **FR20:** Sales Deskeo peut modifier un utilisateur
- **FR21:** Sales Deskeo peut désactiver/activer un utilisateur
- **FR22:** Admin Entreprise peut ajouter un utilisateur à son entreprise
- **FR23:** Admin Entreprise peut supprimer un utilisateur de son entreprise
- **FR24:** Admin Entreprise peut consulter la liste des utilisateurs de son entreprise

### Réservation de Salles de Réunion

- **FR25:** Utilisateur Client peut rechercher une salle disponible (site, date, créneau, capacité)
- **FR26:** Utilisateur Client peut réserver une salle de réunion
- **FR27:** Utilisateur Client peut annuler sa réservation
- **FR28:** Utilisateur Client peut consulter ses réservations
- **FR29:** Utilisateur Flex nomade peut réserver une salle sur n'importe quel site nomad
- **FR30:** Le système peut vérifier les crédits disponibles avant une réservation
- **FR31:** Le système peut déduire les crédits lors d'une réservation

### Gestion des Réservations (Admin)

- **FR32:** Sales Deskeo peut consulter toutes les réservations (tous sites)
- **FR33:** Sales Deskeo peut modifier une réservation
- **FR34:** Sales Deskeo peut annuler une réservation
- **FR35:** Sales Deskeo peut créer une réservation pour un client
- **FR36:** Office Manager peut consulter les réservations de son site
- **FR37:** Office Manager peut modifier une réservation sur son site
- **FR38:** Office Manager peut annuler une réservation sur son site

### Crédits

- **FR39:** Utilisateur Client peut consulter le solde de crédits de son entreprise
- **FR40:** Sales Deskeo peut consulter les crédits d'une entreprise
- **FR41:** Sales Deskeo peut modifier les crédits d'une entreprise

### Notifications Email

- **FR42:** Le système peut envoyer des notifications email (événements à définir)

### Webhooks

- **FR43:** Le système peut envoyer des webhooks vers n8n (événements à définir)

### Consultation Profil

- **FR44:** Utilisateur Client peut consulter son profil
- **FR45:** Utilisateur Client peut consulter les informations de son entreprise
- **FR46:** Utilisateur Flex nomade peut consulter la liste des sites nomad disponibles

### Dashboard Admin

- **FR51:** Sales Deskeo peut consulter un tableau de bord avec les métriques clés (nombre de sites, entreprises, réservations)
- **FR52:** Sales Deskeo peut voir les alertes d'abonnements arrivant à expiration

## Non-Functional Requirements

### Performance

- Les pages doivent se charger en moins de 3 secondes
- Les actions utilisateur (réservation, sauvegarde) doivent répondre en moins de 2 secondes

### Sécurité

- Authentification via magic link Supabase (pas de mot de passe stocké)
- Données transmises en HTTPS
- Accès aux données restreint selon le rôle (RLS Supabase)
- Conformité RGPD (données utilisateurs européens)

### Intégrations

- Disponibilité des intégrations (Supabase, Airtable, Stripe) > 99%
- Gestion gracieuse des erreurs d'intégration (messages utilisateur clairs)
- Webhooks avec retry en cas d'échec

### UI/UX

- Interface responsive (desktop, tablet, mobile)
- Respect du design system Deskeo
