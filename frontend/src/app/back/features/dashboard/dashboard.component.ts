import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, MetricCardComponent, RouterLink],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    metrics = [
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

    secondaryMetrics = [
        { label: 'Support Tickets', value: '8', icon: '🎧', color: 'text-orange-600' },
        { label: 'Flagged Content', value: '5', icon: '🚩', color: 'text-red-600' },
        { label: 'Avg. Order Value', value: '$85', icon: '📈', color: 'text-green-600' },
        { label: 'AI Models Active', value: '6/6', icon: '🖥️', color: 'text-purple-600' },
        { label: 'System Uptime', value: '99.9%', icon: '🖧', color: 'text-green-600' },
        { label: 'New Feedback', value: '14', icon: '✉️', color: 'text-blue-600' }
    ];

    // Calendar state
    currentDate = signal(new Date());
    
    calendarMonthYear = computed(() => {
      const date = this.currentDate();
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });

    calendarDays = computed(() => {
      const date = this.currentDate();
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      
      // Padding from previous month
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({ day: prevMonthLastDay - i, currentMonth: false });
      }
      
      // Current month days
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, currentMonth: true, isToday: this.isToday(i, month, year) });
      }
      
      // Padding for next month to fill the grid (6 rows * 7 days = 42)
      const totalCells = 42;
      const nextMonthDays = totalCells - days.length;
      for (let i = 1; i <= nextMonthDays; i++) {
        days.push({ day: i, currentMonth: false });
      }
      
      return days;
    });

    kycApplications: any[] = [];
    recentActivities: any[] = [];
    systemStatus: any[] = [];
    serverLoad = 42;

    actionableAlerts = [
      { title: 'Pending KYC', value: '12', subtitle: 'Awaiting Verification', icon: '🆔', color: 'bg-[#7D0408]', route: '/admin/moderation' },
      { title: 'Flagged Content', value: '5', subtitle: 'Reported by Users', icon: '🚩', color: 'bg-[#C5A023]', route: '/admin/moderation' },
      { title: 'Open Tickets', value: '8', subtitle: 'Support Required', icon: '🎧', color: 'bg-[#508D96]', route: '/admin/support' }
    ];

    constructor(private dashboardService: DashboardService) { }

    ngOnInit() {
        this.dashboardService.getMetrics().subscribe(data => this.metrics = data);
        this.dashboardService.getKycApplications().subscribe(data => this.kycApplications = data);
        this.dashboardService.getRecentActivities().subscribe(data => this.recentActivities = data);
        this.dashboardService.getSystemStatus().subscribe(data => this.systemStatus = data);
    }

    private isToday(day: number, month: number, year: number): boolean {
      const today = new Date();
      return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    }

    prevMonth() {
      this.currentDate.update((d: Date) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }

    nextMonth() {
      this.currentDate.update((d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
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
