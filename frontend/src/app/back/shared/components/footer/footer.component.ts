import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <footer class="bg-white border-t border-gray-200 text-gray-600 py-4 px-6 shrink-0">
      <div class="flex justify-between items-center">
        <p class="text-sm">&copy; 2026 Esprit Platform. All rights reserved.</p>
        <p class="text-sm">Version 1.0.0</p>
      </div>
    </footer>
  `
})
export class FooterComponent { }
