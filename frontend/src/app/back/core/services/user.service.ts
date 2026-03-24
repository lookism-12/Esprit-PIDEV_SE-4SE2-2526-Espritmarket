import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { User } from '../models/entities.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private users$ = new BehaviorSubject<User[]>(this.generateMockUsers());

    getUsers(): Observable<User[]> {
        return this.users$.asObservable();
    }

    getUserById(id: string): Observable<User | undefined> {
        return of(this.users$.value.find(u => u.id === id)).pipe(delay(300));
    }

    createUser(user: Omit<User, 'id' | 'createdAt'>): Observable<User> {
        const newUser: User = {
            ...user,
            id: `user_${Date.now()}`,
            createdAt: new Date()
        };
        const current = this.users$.value;
        this.users$.next([...current, newUser]);
        return of(newUser).pipe(delay(300));
    }

    updateUser(id: string, updates: Partial<User>): Observable<User | null> {
        const current = this.users$.value;
        const index = current.findIndex(u => u.id === id);
        if (index === -1) return of(null);

        const updated = { ...current[index], ...updates };
        current[index] = updated;
        this.users$.next([...current]);
        return of(updated).pipe(delay(300));
    }

    deleteUser(id: string): Observable<boolean> {
        const current = this.users$.value;
        this.users$.next(current.filter(u => u.id !== id));
        return of(true).pipe(delay(300));
    }

    private generateMockUsers(): User[] {
        return [
            {
                id: 'user_1',
                name: 'Ahmed Ben Ali',
                email: 'ahmed.benali@esprit.tn',
                role: 'user',
                status: 'active',
                createdAt: new Date('2024-01-15'),
                lastLogin: new Date('2024-02-16')
            },
            {
                id: 'user_2',
                name: 'Fatma Gharbi',
                email: 'fatma.gharbi@esprit.tn',
                role: 'moderator',
                status: 'active',
                createdAt: new Date('2024-01-20'),
                lastLogin: new Date('2024-02-15')
            },
            {
                id: 'user_3',
                name: 'Mohamed Trabelsi',
                email: 'mohamed.trabelsi@esprit.tn',
                role: 'user',
                status: 'suspended',
                createdAt: new Date('2024-02-01'),
                lastLogin: new Date('2024-02-10')
            }
        ];
    }
}
