import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

/**
 * Sets the `srcObject` property on a <video> or <audio> element.
 * Angular's property binding [srcObject] does NOT work because srcObject
 * is not reflected as an HTML attribute — it must be set imperatively on
 * the DOM element.  This directive handles that correctly.
 *
 * Usage:
 *   <video [appMediaStream]="stream" autoplay playsinline muted></video>
 *   <audio [appMediaStream]="stream" autoplay></audio>
 */
@Directive({
  selector: '[appMediaStream]',
  standalone: true,
})
export class MediaStreamDirective implements OnChanges, OnInit {
  @Input('appMediaStream') stream: MediaStream | null = null;

  constructor(private el: ElementRef<HTMLVideoElement | HTMLAudioElement>) {}

  /** Called once when the element enters the DOM — attach whatever stream is already set */
  ngOnInit(): void {
    this.attach(this.stream);
  }

  /** Called whenever the bound stream signal changes */
  ngOnChanges(changes: SimpleChanges): void {
    if ('stream' in changes) {
      this.attach(this.stream);
    }
  }

  private attach(stream: MediaStream | null): void {
    const el = this.el.nativeElement;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      if (stream) {
        // Some browsers need an explicit play() after srcObject is set
        el.play?.().catch(() => {
          // Autoplay blocked — user interaction required; ignore silently
        });
      }
    }
  }
}
