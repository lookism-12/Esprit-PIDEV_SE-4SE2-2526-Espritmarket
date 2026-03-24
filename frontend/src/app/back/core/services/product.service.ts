import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { Product } from '../models/entities.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private products$ = new BehaviorSubject<Product[]>(this.generateMockProducts());

    getProducts(): Observable<Product[]> {
        return this.products$.asObservable();
    }

    getProductById(id: string): Observable<Product | undefined> {
        return of(this.products$.value.find(p => p.id === id)).pipe(delay(300));
    }

    createProduct(product: Omit<Product, 'id'>): Observable<Product> {
        const newProduct: Product = {
            ...product,
            id: `prod_${Date.now()}`
        };
        const current = this.products$.value;
        this.products$.next([...current, newProduct]);
        return of(newProduct).pipe(delay(300));
    }

    updateProduct(id: string, updates: Partial<Product>): Observable<Product | null> {
        const current = this.products$.value;
        const index = current.findIndex(p => p.id === id);
        if (index === -1) return of(null);

        const updated = { ...current[index], ...updates };
        current[index] = updated;
        this.products$.next([...current]);
        return of(updated).pipe(delay(300));
    }

    deleteProduct(id: string): Observable<boolean> {
        const current = this.products$.value;
        this.products$.next(current.filter(p => p.id !== id));
        return of(true).pipe(delay(300));
    }

    private generateMockProducts(): Product[] {
        return [
            {
                id: 'prod_1',
                name: 'Laptop Stand',
                description: 'Adjustable aluminum laptop stand',
                price: 45.99,
                stock: 25,
                category: 'Electronics',
                status: 'active'
            },
            {
                id: 'prod_2',
                name: 'Wireless Mouse',
                description: 'Ergonomic wireless mouse with USB receiver',
                price: 25.50,
                stock: 50,
                category: 'Electronics',
                status: 'active'
            },
            {
                id: 'prod_3',
                name: 'Desk Lamp',
                description: 'LED desk lamp with adjustable brightness',
                price: 35.00,
                stock: 15,
                category: 'Furniture',
                status: 'active'
            },
            {
                id: 'prod_4',
                name: 'Notebook Set',
                description: 'Set of 3 premium notebooks',
                price: 12.99,
                stock: 100,
                category: 'Stationery',
                status: 'active'
            }
        ];
    }
}
