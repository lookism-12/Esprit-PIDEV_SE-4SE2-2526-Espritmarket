import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { ForumService } from '../../../front/core/forum.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    // Mock data for now
    constructor(private forum: ForumService) {}

    getMetrics(): Observable<any> {
        const baseMetrics = [
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
        ];

        // Forum metrics from backend. Your backend exposes:
        // GET /api/forum/posts, /api/forum/comments, /api/forum/replies, /api/forum/categories
        return forkJoin({
            posts: this.forum.getPosts(),
            comments: this.forum.getComments(),
            replies: this.forum.getReplies(),
            categories: this.forum.getCategories()
        }).pipe(
            map(({ posts, comments, replies, categories }) => {
                const postsCount = posts.length;
                const commentsCount = comments.length;
                const repliesCount = replies.length;

                const postsByCategory: Record<string, number> = {};
                for (const p of posts as any[]) {
                    postsByCategory[p.categoryId] = (postsByCategory[p.categoryId] ?? 0) + 1;
                }
                const topCategoryId = Object.entries(postsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0];
                const topCategoryName =
                    (categories as any[]).find((c) => c.id === topCategoryId)?.name ?? topCategoryId ?? '-';

                const forumMetrics = [
                    { label: 'Forum Posts', value: String(postsCount), icon: '📝', color: 'blue' },
                    { label: 'Forum Comments', value: String(commentsCount), icon: '💬', color: 'green' },
                    { label: 'Forum Replies', value: String(repliesCount), icon: '↩️', color: 'purple' },
                    { label: 'Top Category', value: topCategoryName, icon: '🏷️', color: 'orange' }
                ];

                return [...baseMetrics, ...forumMetrics];
            })
        );
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
