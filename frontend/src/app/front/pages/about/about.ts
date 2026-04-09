import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.html',
    styleUrl: './about.scss'
})
export class About {
  values = [
    { icon: '🔒', title: 'Trust & Safety', desc: 'Verified ESPRIT student accounts only. Every transaction is protected.' },
    { icon: '♻️', title: 'Sustainability', desc: 'Promoting reuse and reducing waste in our student community.' },
    { icon: '⚡', title: 'Innovation', desc: 'Continuously improving based on student feedback and needs.' },
    { icon: '🤝', title: 'Community', desc: 'Built by students, for students. We grow together.' },
    { icon: '💰', title: 'Best Prices', desc: 'Student-friendly deals with built-in negotiation tools.' },
    { icon: '🚀', title: 'Fast & Easy', desc: 'List in minutes, buy in seconds. No friction, just results.' },
  ];
}
