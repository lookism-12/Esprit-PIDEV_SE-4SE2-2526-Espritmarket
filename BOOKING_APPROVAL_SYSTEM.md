# Système d'Approbation des Réservations ✅

## Vue d'ensemble
Ajout d'un système d'approbation/refus des réservations par le fournisseur. Les clients font des demandes de réservation qui doivent être approuvées par le fournisseur.

## Flux de Réservation

### 1. Client fait une demande
- Client sélectionne date et heure
- Client clique "Book Service"
- Réservation créée avec status **PENDING**
- Client reçoit confirmation de demande

### 2. Fournisseur reçoit la demande
- Fournisseur voit les réservations en attente
- Peut voir: nom client, date, heure, notes

### 3. Fournisseur répond
**Option A: Approuver**
- Status change à **CONFIRMED**
- Date d'approbation enregistrée
- Slot devient réservé
- Client est notifié

**Option B: Refuser**
- Status change à **REJECTED**
- Fournisseur doit donner une raison
- Raisons possibles:
  - "Date non disponible"
  - "Heure non disponible"
  - "Service non disponible ce jour"
  - "Autre raison personnalisée"
- Date de refus enregistrée
- Slot redevient disponible
- Client est notifié avec la raison

## Statuts de Réservation

1. **PENDING** - En attente d'approbation du fournisseur
2. **CONFIRMED** - Approuvée par le fournisseur
3. **REJECTED** - Refusée par le fournisseur (avec raison)
4. **CANCELLED** - Annulée par le client
5. **COMPLETED** - Service terminé
6. **NO_SHOW** - Client ne s'est pas présenté

## Backend Implementation

### Entité ServiceBooking
Nouveaux champs ajoutés:
```java
- status (default: PENDING au lieu de CONFIRMED)
- rejectionReason (String)
- rejectedAt (LocalDateTime)
- approvedAt (LocalDateTime)
```

### Enum BookingStatus
Ajout de:
- PENDING
- REJECTED

### ServiceBookingService
Nouvelles méthodes:
```java
- approveBooking(bookingId) - Approuver une réservation
- rejectBooking(bookingId, reason) - Refuser avec raison
- getPendingBookingsForProvider() - Liste des demandes en attente
```

### API Endpoints

```
POST /api/service-bookings/{id}/approve
- Approuve une réservation
- Provider only

POST /api/service-bookings/{id}/reject
Body: { "reason": "Date non disponible" }
- Refuse une réservation avec raison
- Provider only

GET /api/service-bookings/pending
- Liste des réservations en attente
- Provider only
```

## Frontend Implementation

### BookingService
Nouvelles méthodes:
```typescript
- approveBooking(bookingId)
- rejectBooking(bookingId, reason)
- getPendingBookings()
```

### BookingResponse Interface
Nouveaux champs:
```typescript
- status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | ...
- userName: string
- rejectionReason?: string
- rejectedAt?: string
- approvedAt?: string
```

## Logique de Validation

### Lors de la génération des slots
- Seules les réservations **CONFIRMED** bloquent les slots
- Les réservations PENDING ne bloquent PAS les slots
- Les réservations REJECTED/CANCELLED libèrent les slots

### Lors de l'approbation
- Vérifie que le status est PENDING
- Vérifie qu'il n'y a pas de conflit avec d'autres réservations CONFIRMED
- Change status à CONFIRMED
- Met à jour la disponibilité du service

### Lors du refus
- Vérifie que le status est PENDING
- Raison obligatoire
- Change status à REJECTED
- Enregistre la raison et la date

## Interface Utilisateur (À implémenter)

### Pour le Client
**Page "Mes Réservations":**
- Liste des réservations avec statuts
- Badge coloré selon status:
  - 🟡 PENDING - Jaune "En attente"
  - 🟢 CONFIRMED - Vert "Confirmée"
  - 🔴 REJECTED - Rouge "Refusée"
  - ⚫ CANCELLED - Gris "Annulée"
- Affiche raison de refus si REJECTED

### Pour le Fournisseur
**Page "Demandes de Réservation":**
- Liste des réservations PENDING
- Pour chaque demande:
  - Nom du client
  - Service demandé
  - Date et heure
  - Notes du client
  - Boutons: [Approuver] [Refuser]
- Modal de refus avec champ "Raison"

## Notifications (Recommandé)

### Notifications à implémenter:
1. **Client → Fournisseur**: Nouvelle demande de réservation
2. **Fournisseur → Client**: Réservation approuvée
3. **Fournisseur → Client**: Réservation refusée (avec raison)

## Exemples de Raisons de Refus

Raisons courantes:
- "Cette date n'est plus disponible"
- "Cette heure est déjà réservée"
- "Service non disponible ce jour"
- "Durée insuffisante pour ce service"
- "Demande en dehors des heures d'ouverture"
- "Service temporairement indisponible"

## Tests

### Scénario 1: Approbation
1. Client crée réservation → Status PENDING
2. Fournisseur approuve → Status CONFIRMED
3. Slot devient indisponible
4. Client voit "Confirmée"

### Scénario 2: Refus
1. Client crée réservation → Status PENDING
2. Fournisseur refuse avec raison → Status REJECTED
3. Slot redevient disponible
4. Client voit "Refusée: [raison]"

### Scénario 3: Conflit
1. Client A crée réservation → PENDING
2. Client B crée même slot → PENDING (autorisé)
3. Fournisseur approuve Client A → CONFIRMED
4. Fournisseur essaie d'approuver Client B → ERREUR (conflit)

## Status

✅ **Backend COMPLET**
- Entités mises à jour
- Services implémentés
- Endpoints créés
- Validation en place

⏳ **Frontend EN ATTENTE**
- Service TypeScript mis à jour
- UI à créer:
  - Page demandes fournisseur
  - Page mes réservations client
  - Modals d'approbation/refus

## Prochaines Étapes

1. Créer page "Demandes de Réservation" pour fournisseur
2. Créer page "Mes Réservations" pour client
3. Ajouter système de notifications
4. Ajouter filtres par status
5. Ajouter statistiques (taux d'approbation, etc.)

---

**Le système d'approbation est prêt côté backend!** 🚀
