import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { SupportTicket } from '../models/entities.model';

@Injectable({
    providedIn: 'root'
})
export class SupportService {
    private tickets$ = new BehaviorSubject<SupportTicket[]>(this.generateMockTickets());

    getTickets(): Observable<SupportTicket[]> {
        return this.tickets$.asObservable();
    }

    getTicketById(id: string): Observable<SupportTicket | undefined> {
        return of(this.tickets$.value.find(t => t.id === id)).pipe(delay(300));
    }

    createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Observable<SupportTicket> {
        const newTicket: SupportTicket = {
            ...ticket,
            id: `ticket_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const current = this.tickets$.value;
        this.tickets$.next([...current, newTicket]);
        return of(newTicket).pipe(delay(300));
    }

    updateTicket(id: string, updates: Partial<SupportTicket>): Observable<SupportTicket | null> {
        const current = this.tickets$.value;
        const index = current.findIndex(t => t.id === id);
        if (index === -1) return of(null);

        const updated = { ...current[index], ...updates, updatedAt: new Date() };
        current[index] = updated;
        this.tickets$.next([...current]);
        return of(updated).pipe(delay(300));
    }

    deleteTicket(id: string): Observable<boolean> {
        const current = this.tickets$.value;
        this.tickets$.next(current.filter(t => t.id !== id));
        return of(true).pipe(delay(300));
    }

    private generateMockTickets(): SupportTicket[] {
        return [
            {
                id: 'ticket_1',
                userId: 'user_1',
                userName: 'Ahmed Ben Ali',
                subject: 'Cannot access marketplace',
                description: 'I am unable to access the marketplace section. Getting error 403.',
                status: 'open',
                priority: 'high',
                createdAt: new Date('2024-02-16T10:30:00'),
                updatedAt: new Date('2024-02-16T10:30:00')
            },
            {
                id: 'ticket_2',
                userId: 'user_2',
                userName: 'Fatma Gharbi',
                subject: 'Payment not processed',
                description: 'My payment was deducted but order status shows pending.',
                status: 'in_progress',
                priority: 'urgent',
                assignedTo: 'Admin User',
                createdAt: new Date('2024-02-16T09:15:00'),
                updatedAt: new Date('2024-02-16T11:20:00')
            },
            {
                id: 'ticket_3',
                userId: 'user_3',
                userName: 'Mohamed Trabelsi',
                subject: 'Account verification issue',
                description: 'My account verification has been pending for 3 days.',
                status: 'resolved',
                priority: 'medium',
                assignedTo: 'Admin User',
                createdAt: new Date('2024-02-15T14:20:00'),
                updatedAt: new Date('2024-02-16T08:00:00')
            }
        ];
    }
}
