import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
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

    quickActions = [
        {
            title: 'Create Coupon',
            description: 'Generate discount codes',
            icon: '🎫',
            route: '/admin/coupons/create',
            bgColor: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'Manage Users',
            description: 'View and moderate users',
            icon: '👥',
            route: '/admin/users',
            bgColor: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Review Products',
            description: 'Approve pending listings',
            icon: '📦',
            route: '/admin/marketplace/products',
            bgColor: 'bg-green-50 text-green-600'
        },
        {
            title: 'Support Tickets',
            description: 'Handle customer issues',
            icon: '🎧',
            route: '/admin/support',
            bgColor: 'bg-orange-50 text-orange-600'
        }
    ];

    chartData = [
        { label: 'Mon', value: 75 },
        { label: 'Tue', value: 55 },
        { label: 'Wed', value: 85 },
        { label: 'Thu', value: 65 },
        { label: 'Fri', value: 90 },
        { label: 'Sat', value: 45 },
        { label: 'Sun', value: 70 }
    ];

    recentActivities = [
        {
            title: 'New user registered',
            time: '2 min ago',
            icon: '👤',
            bgColor: 'bg-green-50 text-green-600',
            description: 'A new user has successfully completed registration'
        },
        {
            title: 'Product approved',
            time: '5 min ago',
            icon: '✅',
            bgColor: 'bg-blue-50 text-blue-600',
            description: 'Product listing has been reviewed and approved'
        },
        {
            title: 'Order completed',
            time: '8 min ago',
            icon: '📦',
            bgColor: 'bg-purple-50 text-purple-600',
            description: 'Customer order has been successfully completed'
        },
        {
            title: 'Support ticket resolved',
            time: '12 min ago',
            icon: '🎧',
            bgColor: 'bg-orange-50 text-orange-600',
            description: 'Customer support issue has been resolved'
        }
    ];

    actionableAlerts = [
        {
            title: 'Pending Reviews',
            value: '23',
            subtitle: 'Products awaiting approval',
            icon: '⏳',
            route: '/admin/marketplace/products',
            color: 'bg-gradient-to-br from-orange-500 to-orange-600'
        },
        {
            title: 'Support Tickets',
            value: '8',
            subtitle: 'Unresolved customer issues',
            icon: '🎧',
            route: '/admin/support',
            color: 'bg-gradient-to-br from-red-500 to-red-600'
        },
        {
            title: 'KYC Applications',
            value: '12',
            subtitle: 'Identity verifications pending',
            icon: '🛡️',
            route: '/admin/users',
            color: 'bg-gradient-to-br from-blue-500 to-blue-600'
        }
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
      
      // Previous month days
      const prevMonth = new Date(year, month - 1, 0);
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
          day: prevMonth.getDate() - i,
          currentMonth: false,
          isToday: false
        });
      }
      
      // Current month days
      const today = new Date();
      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = today.getFullYear() === year && 
                       today.getMonth() === month && 
                       today.getDate() === day;
        days.push({
          day,
          currentMonth: true,
          isToday
        });
      }
      
      // Next month days to fill the grid
      const remainingDays = 42 - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          day,
          currentMonth: false,
          isToday: false
        });
      }
      
      return days;
    });

    constructor() {}

    ngOnInit(): void {}

    getCurrentDate(): string {
        return new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    getMetricBorderColor(color: string): string {
        const colors: { [key: string]: string } = {
            'blue': 'border-l-blue-500',
            'green': 'border-l-green-500',
            'orange': 'border-l-orange-500',
            'purple': 'border-l-purple-500'
        };
        return colors[color] || 'border-l-gray-500';
    }

    getMetricBgGradient(color: string): string {
        const colors: { [key: string]: string } = {
            'blue': 'bg-gradient-to-br from-blue-500 to-blue-600',
            'green': 'bg-gradient-to-br from-green-500 to-green-600',
            'orange': 'bg-gradient-to-br from-orange-500 to-orange-600',
            'purple': 'bg-gradient-to-br from-purple-500 to-purple-600'
        };
        return colors[color] || 'bg-gradient-to-br from-gray-500 to-gray-600';
    }

    getMetricBgColor(color: string): string {
        const colors: { [key: string]: string } = {
            'blue': 'bg-blue-500',
            'green': 'bg-green-500',
            'orange': 'bg-orange-500',
            'purple': 'bg-purple-500'
        };
        return colors[color] || 'bg-gray-500';
    }

    getMetricIconBg(color: string): string {
        const colors: { [key: string]: string } = {
            'blue': 'bg-blue-50 text-blue-600 border-blue-200',
            'green': 'bg-green-50 text-green-600 border-green-200',
            'orange': 'bg-orange-50 text-orange-600 border-orange-200',
            'purple': 'bg-purple-50 text-purple-600 border-purple-200'
        };
        return colors[color] || 'bg-gray-50 text-gray-600 border-gray-200';
    }

    getMetricProgressColor(color: string): string {
        const colors: { [key: string]: string } = {
            'blue': 'bg-gradient-to-r from-blue-500 to-blue-600',
            'green': 'bg-gradient-to-r from-green-500 to-green-600',
            'orange': 'bg-gradient-to-r from-orange-500 to-orange-600',
            'purple': 'bg-gradient-to-r from-purple-500 to-purple-600'
        };
        return colors[color] || 'bg-gradient-to-r from-gray-500 to-gray-600';
    }

    getChartBarColor(index: number): string {
        const colors = [
            'bg-[#7D0408]',
            'bg-[#C5A023]',
            'bg-[#508D96]',
            'bg-[#7D0408]',
            'bg-[#C5A023]',
            'bg-[#508D96]',
            'bg-[#7D0408]'
        ];
        return colors[index] || 'bg-gray-400';
    }

    prevMonth(): void {
        this.currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    }

    nextMonth(): void {
        this.currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    }
}