# Fix: Quantité de produit ne diminue pas après achat

## Problème identifié
Lorsqu'un client achète un produit dans le marketplace, la quantité en stock ne diminuait pas. 

## Cause
Le backend avait bien la logique de réduction de stock dans `StockManagementService.reduceStock()`, mais cette méthode n'était appelée que lors de la confirmation du paiement via `OrderServiceImpl.confirmPayment()`.

Le frontend créait la commande avec `checkout()` mais n'appelait JAMAIS `confirmPayment()`, donc le stock n'était jamais réduit.

## Solution appliquée

### 1. Ajout de la méthode `confirmPayment` dans `cart.service.ts`
```typescript
confirmPayment(orderId: string, paymentId: string): Observable<OrderResponse> {
  const ordersUrl = `${environment.apiUrl}/orders/${orderId}/confirm-payment`;
  return this.http.post<OrderResponse>(ordersUrl, null, { params: { paymentId } });
}
```

### 2. Modification de `submitOrder()` dans `cart.ts`
Après la création de la commande, on appelle maintenant `confirmPayment()` pour :
- Confirmer le paiement
- Réduire le stock des produits
- Ajouter les points de fidélité

```typescript
this.cartService.checkout(checkoutData).subscribe({
  next: (order) => {
    const paymentId = this.paymentMethod() === 'CARD' 
      ? `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      : 'CASH_ON_DELIVERY';
    
    this.cartService.confirmPayment(order.id, paymentId).subscribe({
      next: (confirmedOrder) => {
        // Commande confirmée, stock réduit ✅
      }
    });
  }
});
```

## Flux complet maintenant
1. Client ajoute produit au panier
2. Client procède au checkout → Crée commande (status: PENDING)
3. Client confirme le paiement → Appelle `confirmPayment()`
4. Backend réduit le stock via `StockManagementService.reduceStock()`
5. Backend met à jour le statut de la commande (status: PAID)
6. Backend ajoute les points de fidélité

## Test
1. Vérifier le stock d'un produit avant achat
2. Acheter le produit
3. Vérifier que le stock a bien diminué de la quantité achetée
