# Mapping des Scopes par Story

Ce fichier définit les labels de scope à appliquer pour chaque story.

## Epic 1 - Authentification et Accès

| Story | Titre | Scopes |
|-------|-------|--------|
| 1.1 | Connexion via Magic Link | scope:auth, scope:app-client, scope:back-office |
| 1.2 | Vérification Collaborateur Deskeo via Airtable | scope:auth, scope:api, scope:integration |
| 1.3 | Routage par Rôle après Connexion | scope:auth, scope:app-client, scope:back-office |

## Epic 2 - Gestion Sites & Ressources

| Story | Titre | Scopes |
|-------|-------|--------|
| 2.1 | Créer un Site | scope:back-office, scope:database |
| 2.2 | Modifier les Informations d'un Site | scope:back-office, scope:database |
| 2.3 | Gérer les Photos d'un Site | scope:back-office, scope:database, scope:api |
| 2.4 | Définir le Statut Nomad d'un Site | scope:back-office, scope:database |
| 2.5 | Office Manager - Modifier son Site | scope:back-office |
| 2.6 | Office Manager - Consulter les Entreprises Présentes | scope:back-office |
| 2.7 | Créer une Ressource sur un Site | scope:back-office, scope:database |
| 2.8 | Modifier une Ressource | scope:back-office, scope:database |
| 2.9 | Supprimer une Ressource | scope:back-office, scope:database |
| 2.10 | Consulter les Ressources d'un Site | scope:back-office |

## Epic 3 - Entreprises & Abonnements

| Story | Titre | Scopes |
|-------|-------|--------|
| 3.1 | Créer une Entreprise | scope:back-office, scope:database |
| 3.2 | Modifier une Entreprise | scope:back-office, scope:database |
| 3.3 | Supprimer une Entreprise | scope:back-office, scope:database |
| 3.4 | Consulter la Liste des Entreprises | scope:back-office |
| 3.5 | Créer un Abonnement Bench | scope:back-office, scope:database |
| 3.6 | Modifier un Abonnement | scope:back-office, scope:database |
| 3.7 | Attribuer des Benchs à une Entreprise | scope:back-office, scope:database |
| 3.8 | Modifier l'Attribution des Benchs | scope:back-office, scope:database |
| 3.9 | Consulter l'Occupation des Benchs par Site | scope:back-office |

## Epic 4 - Gestion Utilisateurs

| Story | Titre | Scopes |
|-------|-------|--------|
| 4.1 | Sales - Créer un Utilisateur | scope:back-office, scope:database |
| 4.2 | Sales - Modifier un Utilisateur | scope:back-office, scope:database |
| 4.3 | Sales - Activer/Désactiver un Utilisateur | scope:back-office, scope:database |
| 4.4 | Admin Entreprise - Ajouter un Utilisateur | scope:app-client, scope:database |
| 4.5 | Admin Entreprise - Supprimer un Utilisateur | scope:app-client, scope:database |
| 4.6 | Admin Entreprise - Consulter la Liste des Utilisateurs | scope:app-client |

## Epic 5 - Interface Client Profil

| Story | Titre | Scopes |
|-------|-------|--------|
| 5.1 | Consulter son Profil | scope:app-client |
| 5.2 | Consulter les Informations de son Entreprise | scope:app-client |
| 5.3 | Consulter le Solde de Crédits | scope:app-client |
| 5.4 | Consulter les Sites Nomad Disponibles | scope:app-client |

## Epic 6 - Réservation Salles Client

| Story | Titre | Scopes |
|-------|-------|--------|
| 6.1 | Rechercher une Salle Disponible | scope:app-client, scope:database |
| 6.2 | Réserver une Salle de Réunion | scope:app-client, scope:database, scope:api |
| 6.3 | Annuler une Réservation | scope:app-client, scope:database |
| 6.4 | Consulter ses Réservations | scope:app-client |
| 6.5 | Flex Nomade - Réserver sur un Site Nomad | scope:app-client, scope:database |
| 6.6 | Vérification et Déduction des Crédits | scope:database, scope:api |

## Epic 7 - Admin Réservations & Dashboard

| Story | Titre | Scopes |
|-------|-------|--------|
| 7.1 | Sales - Consulter Toutes les Réservations | scope:back-office |
| 7.2 | Sales - Modifier une Réservation | scope:back-office, scope:database |
| 7.3 | Sales - Annuler une Réservation | scope:back-office, scope:database |
| 7.4 | Sales - Créer une Réservation pour un Client | scope:back-office, scope:database |
| 7.5 | Office Manager - Consulter les Réservations de son Site | scope:back-office |
| 7.6 | Office Manager - Modifier/Annuler une Réservation | scope:back-office, scope:database |
| 7.7 | Sales - Consulter les Crédits d'une Entreprise | scope:back-office |
| 7.8 | Sales - Modifier les Crédits d'une Entreprise | scope:back-office, scope:database |
| 7.9 | Dashboard Admin - Métriques Clés | scope:back-office, scope:database |
| 7.10 | Dashboard Admin - Alertes Abonnements | scope:back-office, scope:database |

## Epic 8 - Notifications & Automatisations

| Story | Titre | Scopes |
|-------|-------|--------|
| 8.1 | Envoyer des Notifications Email | scope:api, scope:integration |
| 8.2 | Envoyer des Webhooks vers n8n | scope:api, scope:integration |

## Résumé des Labels

| Label | Occurrences |
|-------|-------------|
| scope:back-office | 32 stories |
| scope:database | 28 stories |
| scope:app-client | 16 stories |
| scope:api | 6 stories |
| scope:auth | 3 stories |
| scope:integration | 4 stories |
