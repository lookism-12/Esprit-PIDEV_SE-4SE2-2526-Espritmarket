import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartType } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { KycTableComponent } from './components/kyc-table/kyc-table.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, MetricCardComponent, KycTableComponent, ChartComponent, LucideAngularModule],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    metrics = [
        {
            label: 'Total Users',
            value: '8,542',
            icon: 'users',
            change: '+12.5%',
            trend: 'up',
            color: 'blue',
            subtitle: 'Vs previous 30 days',
            progress: 75
        },
        {
            label: 'Total Revenue',
            value: '$45.2K',
            icon: 'dollar-sign',
            change: '+8.2%',
            trend: 'up',
            color: 'green',
            subtitle: 'Vs previous 30 days',
            progress: 62
        },
        {
            label: 'Active Listings',
            value: '1,234',
            icon: 'shopping-bag',
            change: '-2.4%',
            trend: 'down',
            color: 'orange',
            subtitle: 'Vs previous 30 days',
            progress: 45
        },
        {
            label: 'Pending KYC',
            value: '12',
            icon: 'shield',
            change: '+5',
            trend: 'up',
            color: 'purple',
            subtitle: 'Requires attention',
            progress: 88
        }
    ];

    secondaryMetrics = [
        { label: 'Support Tickets', value: '8', icon: 'headphones', color: 'text-orange-600' },
        { label: 'Flagged Content', value: '5', icon: 'flag', color: 'text-red-600' },
        { label: 'Avg. Order Value', value: '$85', icon: 'trending-up', color: 'text-green-600' },
        { label: 'AI Models Active', value: '6/6', icon: 'cpu', color: 'text-purple-600' },
        { label: 'System Uptime', value: '99.9%', icon: 'server', color: 'text-green-600' },
        { label: 'New Feedback', value: '14', icon: 'mail', color: 'text-blue-600' }
    ];

    kycApplications: any[] = [];
    recentActivities: any[] = [];
    systemStatus: any[] = [];
    serverLoad = 42;

    // Charts Configuration
    registrationChartData: ChartConfiguration['data'] = {
        labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30'],
        datasets: [
            {
                data: [2800, 3200, 3100, 3800, 4200, 4100, 4800],
                label: 'Students',
                borderColor: '#8B0000',
                backgroundColor: 'rgba(139, 0, 0, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                data: [1200, 1500, 1400, 1800, 2100, 2000, 2400],
                label: 'Outsiders',
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };
    registrationChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' }
        },
        scales: {
            y: { beginAtZero: true, grid: { display: true, color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    };

    distributionChartData: ChartConfiguration['data'] = {
        labels: ['Students', 'Outsiders'],
        datasets: [{
            data: [85, 15],
            backgroundColor: ['#8B0000', '#F59E0B'],
            hoverBackgroundColor: ['#A52A2A', '#FBBF24']
        }]
    };
    distributionChartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' }
        },
        cutout: '60%'
    };
    doughnutChartType: ChartType = 'doughnut';

    constructor(private dashboardService: DashboardService) { }

    ngOnInit() {
        this.dashboardService.getMetrics().subscribe(data => this.metrics = data);
        this.dashboardService.getKycApplications().subscribe(data => this.kycApplications = data);
        this.dashboardService.getRecentActivities().subscribe(data => this.recentActivities = data);
        this.dashboardService.getSystemStatus().subscribe(data => this.systemStatus = data);
    }

    getActivityIconClass(type: string): string {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-600';
            case 'warning': return 'bg-yellow-100 text-yellow-600';
            case 'info': return 'bg-blue-100 text-blue-600';
            case 'error': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    getStatusColor(status: string): string {
        return status === 'operational' ? 'text-green-500' : 'text-yellow-500';
    }

    getStatusBadgeClass(status: string): string {
        return status === 'operational'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700';
    }
}
