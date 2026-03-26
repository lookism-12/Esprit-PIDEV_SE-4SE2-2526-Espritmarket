import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    // Mock data for now
    getMetrics(): Observable<any> {
        return of([
            {
                label: 'Total Users',
                value: '8,542',
                icon: '👥',
                change: '+12.5%',
                trend: 'up',
                color: 'blue',
                subtitle: 'Vs previous 30 days',
                progress: 75
            },
            {
                label: 'Total Revenue',
                value: '$45.2K',
                icon: '💰',
                change: '+8.2%',
                trend: 'up',
                color: 'green',
                subtitle: 'Vs previous 30 days',
                progress: 62
            },
            {
                label: 'Active Listings',
                value: '1,234',
                icon: '🛍️',
                change: '-2.4%',
                trend: 'down',
                color: 'orange',
                subtitle: 'Vs previous 30 days',
                progress: 45
            },
            {
                label: 'Pending KYC',
                value: '12',
                icon: '🛡️',
                change: '+5',
                trend: 'up',
                color: 'purple',
                subtitle: 'Requires attention',
                progress: 88
            }
        ]);
    }

    getKycApplications(): Observable<any> {
        return of([
            {
                id: 'OUT-2024-1234',
                name: 'Ahmed Ben Ali',
                email: 'ahmed.benali@email.com',
                appliedDate: '2024-01-15',
                documents: ['ID Card', 'Proof'],
                status: 'pending',
                avatar: 'assets/avatars/1.jpg'
            },
            {
                id: 'OUT-2024-1235',
                name: 'Sarah Trabelsi',
                email: 'sarah.trabelsi@email.com',
                appliedDate: '2024-01-14',
                documents: ['ID Card', 'Missing'],
                status: 'review',
                avatar: 'assets/avatars/2.jpg'
            },
            {
                id: 'OUT-2024-1236',
                name: 'Mohamed Jebali',
                email: 'mohamed.jebali@email.com',
                appliedDate: '2024-01-13',
                documents: ['ID Card', 'Proof'],
                status: 'pending',
                avatar: 'assets/avatars/3.jpg'
            }
        ]);
    }

    getRecentActivities(): Observable<any> {
        return of([
            {
                type: 'success',
                icon: 'check-circle',
                title: 'KYC Application Approved',
                description: 'User "Fatima Khelil" has been verified and approved',
                time: '2 minutes ago'
            },
            {
                type: 'warning',
                icon: 'flag',
                title: 'Content Flagged',
                description: 'Product listing reported for inappropriate content',
                time: '15 minutes ago'
            },
            {
                type: 'info',
                icon: 'car',
                title: 'New Carpool Ride Created',
                description: 'Route: Tunis -> Sousse scheduled for tomorrow',
                time: '1 hour ago'
            },
            {
                type: 'info',
                icon: 'cpu',
                title: 'AI Model Updated',
                description: 'Stock prediction model retrained with new data',
                time: '3 hours ago'
            }
        ]);
    }

    getSystemStatus(): Observable<any> {
        return of([
            { service: 'API Services', status: 'operational', message: 'All endpoints operational', health: 100 },
            { service: 'Database', status: 'operational', message: 'Response time: 45ms', health: 100 },
            { service: 'AI Models', status: 'operational', message: '6/6 models active', health: 100 },
            { service: 'Notification Service', status: 'degraded', message: 'Delivery rate: 95.3%', health: 95 }
        ]);
    }
}
