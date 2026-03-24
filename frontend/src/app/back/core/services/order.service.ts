import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { Order } from '../models/entities.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private orders$ = new BehaviorSubject<Order[]>(this.generateMockOrders());

    getOrders(): Observable<Order[]> {
        return this.orders$.asObservable();
    }

    getOrderById(id: string): Observable<Order | undefined> {
        return of(this.orders$.value.find(o => o.id === id)).pipe(delay(300));
    }

    updateOrder(id: string, updates: Partial<Order>): Observable<Order | null> {
        const current = this.orders$.value;
        const index = current.findIndex(o => o.id === id);
        if (index === -1) return of(null);

        const updated = { ...current[index], ...updates, updatedAt: new Date() };
        current[index] = updated;
        this.orders$.next([...current]);
        return of(updated).pipe(delay(300));
    }

    private generateMockOrders(): Order[] {
        return [
            {
                id: 'order_1',
                userId: 'user_1',
                userName: 'Ahmed Ben Ali',
                items: [
                    { productId: 'prod_1', productName: 'Laptop Stand', quantity: 1, price: 45.99 },
                    { productId: 'prod_2', productName: 'Wireless Mouse', quantity: 2, price: 25.50 }
                ],
                total: 96.99,
                status: 'pending',
                paymentStatus: 'paid',
                createdAt: new Date('2024-02-16T10:30:00'),
                updatedAt: new Date('2024-02-16T10:30:00')
            },
            {
                id: 'order_2',
                userId: 'user_2',
                userName: 'Fatma Gharbi',
                items: [
                    { productId: 'prod_3', productName: 'Desk Lamp', quantity: 1, price: 35.00 }
                ],
                total: 35.00,
                status: 'shipped',
                paymentStatus: 'paid',
                createdAt: new Date('2024-02-15T14:20:00'),
                updatedAt: new Date('2024-02-16T09:00:00')
            },
            {
                id: 'order_3',
                userId: 'user_3',
                userName: 'Mohamed Trabelsi',
                items: [
                    { productId: 'prod_4', productName: 'Notebook Set', quantity: 3, price: 12.99 }
                ],
                total: 38.97,
                status: 'delivered',
                paymentStatus: 'paid',
                createdAt: new Date('2024-02-14T11:15:00'),
                updatedAt: new Date('2024-02-15T16:30:00')
            }
        ];
    }
}
