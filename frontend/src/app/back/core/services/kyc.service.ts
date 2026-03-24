import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { KYCApplication } from '../models/entities.model';

@Injectable({
    providedIn: 'root'
})
export class KYCService {
    private applications$ = new BehaviorSubject<KYCApplication[]>(this.generateMockApplications());

    getApplications(): Observable<KYCApplication[]> {
        return this.applications$.asObservable();
    }

    getApplicationById(id: string): Observable<KYCApplication | undefined> {
        return of(this.applications$.value.find(a => a.id === id)).pipe(delay(300));
    }

    approveApplication(id: string, reviewedBy: string, notes?: string): Observable<KYCApplication | null> {
        return this.updateApplicationStatus(id, 'approved', reviewedBy, notes);
    }

    rejectApplication(id: string, reviewedBy: string, notes?: string): Observable<KYCApplication | null> {
        return this.updateApplicationStatus(id, 'rejected', reviewedBy, notes);
    }

    private updateApplicationStatus(
        id: string,
        status: 'approved' | 'rejected',
        reviewedBy: string,
        notes?: string
    ): Observable<KYCApplication | null> {
        const current = this.applications$.value;
        const index = current.findIndex(a => a.id === id);
        if (index === -1) return of(null);

        const updated: KYCApplication = {
            ...current[index],
            status,
            reviewedAt: new Date(),
            reviewedBy,
            notes
        };

        current[index] = updated;
        this.applications$.next([...current]);
        return of(updated).pipe(delay(300));
    }

    private generateMockApplications(): KYCApplication[] {
        return [
            {
                id: 'kyc_1',
                userId: 'user_1',
                userName: 'Ahmed Ben Ali',
                email: 'ahmed.benali@esprit.tn',
                documentType: 'id_card',
                documentNumber: 'ID123456',
                status: 'pending',
                submittedAt: new Date('2024-02-15T10:30:00')
            },
            {
                id: 'kyc_2',
                userId: 'user_2',
                userName: 'Fatma Gharbi',
                email: 'fatma.gharbi@esprit.tn',
                documentType: 'passport',
                documentNumber: 'PP789012',
                status: 'pending',
                submittedAt: new Date('2024-02-16T09:15:00')
            },
            {
                id: 'kyc_3',
                userId: 'user_3',
                userName: 'Mohamed Trabelsi',
                email: 'mohamed.trabelsi@esprit.tn',
                documentType: 'driver_license',
                documentNumber: 'DL345678',
                status: 'approved',
                submittedAt: new Date('2024-02-14T14:20:00'),
                reviewedAt: new Date('2024-02-15T11:00:00'),
                reviewedBy: 'Admin User'
            }
        ];
    }
}
