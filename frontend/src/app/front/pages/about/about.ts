import { Component, AfterViewInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.html',
    styleUrl: './about.scss',
    encapsulation: ViewEncapsulation.None
})
export class About implements AfterViewInit {

  @ViewChild('bgVideo') bgVideoRef!: ElementRef<HTMLVideoElement>;

  lightboxSrc: string | null = null;

  openLightbox(src: string): void {
    this.lightboxSrc = src;
  }

  closeLightbox(): void {
    this.lightboxSrc = null;
  }

  ngAfterViewInit(): void {
    if (this.bgVideoRef?.nativeElement) {
      const v = this.bgVideoRef.nativeElement;
      v.muted = true;
      v.volume = 0;
    }
  }

  values = [
    { icon: '🔒', title: 'Trust & Safety', desc: 'Verified ESPRIT student accounts only. Every transaction is protected.' },
    { icon: '♻️', title: 'Sustainability', desc: 'Promoting reuse and reducing waste in our student community.' },
    { icon: '⚡', title: 'Innovation', desc: 'Continuously improving based on student feedback and needs.' },
    { icon: '🤝', title: 'Community', desc: 'Built by students, for students. We grow together.' },
    { icon: '💰', title: 'Best Prices', desc: 'Student-friendly deals with built-in negotiation tools.' },
    { icon: '🚀', title: 'Fast & Easy', desc: 'List in minutes, buy in seconds. No friction, just results.' },
  ];

  deckPhotos = [
    { src: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=85', alt: 'Online Shopping' },
    { src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=85', alt: 'Marketplace' },
    { src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=85', alt: 'Campus' },
    { src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=85', alt: 'Carpooling' },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=85', alt: 'Community' },
    { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=85', alt: 'Students' },
    { src: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=85', alt: 'University' },
  ];
}
