import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WheelOfFortuneService, RewardDTO, SpinResultDTO } from '../../../core/services/wheel-of-fortune.service';

@Component({
  selector: 'app-wheel-of-fortune',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wheel-of-fortune.html',
  styleUrl: './wheel-of-fortune.scss'
})
export class WheelOfFortune implements OnInit {
  private wheelService = inject(WheelOfFortuneService);

  @ViewChild('wheelCanvas', { static: false }) wheelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confettiCanvas', { static: false }) confettiCanvas!: ElementRef<HTMLCanvasElement>;

  // State
  rewards = signal<RewardDTO[]>([]);
  canSpin = signal<boolean>(true);
  isSpinning = signal<boolean>(false);
  showResultModal = signal<boolean>(false);
  spinResult = signal<SpinResultDTO | null>(null);
  
  // Canvas context
  private ctx: CanvasRenderingContext2D | null = null;
  private currentRotation = 0;
  private targetRotation = 0;
  private animationId: number | null = null;

  // Audio
  private spinSound: HTMLAudioElement | null = null;
  private winSound: HTMLAudioElement | null = null;

  ngOnInit(): void {
    this.loadRewards();
    this.checkCanSpin();
    this.initAudio();
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  /**
   * Initialize audio
   */
  private initAudio(): void {
    // You can add actual sound files here
    // this.spinSound = new Audio('assets/sounds/spin.mp3');
    // this.winSound = new Audio('assets/sounds/win.mp3');
  }

  /**
   * Load rewards from backend
   */
  private loadRewards(): void {
    this.wheelService.getRewards().subscribe({
      next: (rewards) => {
        this.rewards.set(rewards);
        setTimeout(() => this.drawWheel(), 100);
      },
      error: (err) => console.error('Failed to load rewards:', err)
    });
  }

  /**
   * Check if user can spin today
   */
  private checkCanSpin(): void {
    this.wheelService.canSpin().subscribe({
      next: (response) => this.canSpin.set(response.canSpin),
      error: (err) => console.error('Failed to check spin status:', err)
    });
  }

  /**
   * Initialize canvas
   */
  private initCanvas(): void {
    const canvas = this.wheelCanvas?.nativeElement;
    if (!canvas) return;

    canvas.width = 500;
    canvas.height = 500;
    this.ctx = canvas.getContext('2d');
    
    this.drawWheel();
  }

  /**
   * Draw the wheel
   */
  private drawWheel(): void {
    if (!this.ctx) return;

    const canvas = this.wheelCanvas.nativeElement;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const rewards = this.rewards();

    if (rewards.length === 0) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.save();

    // Rotate canvas
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((this.currentRotation * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);

    const segmentAngle = (2 * Math.PI) / rewards.length;

    // Draw segments
    rewards.forEach((reward, index) => {
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      this.ctx!.beginPath();
      this.ctx!.moveTo(centerX, centerY);
      this.ctx!.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx!.closePath();
      this.ctx!.fillStyle = reward.color;
      this.ctx!.fill();

      // Draw border
      this.ctx!.strokeStyle = '#ffffff';
      this.ctx!.lineWidth = 3;
      this.ctx!.stroke();

      // Draw text
      this.ctx!.save();
      this.ctx!.translate(centerX, centerY);
      this.ctx!.rotate(startAngle + segmentAngle / 2);
      this.ctx!.textAlign = 'center';
      this.ctx!.fillStyle = '#ffffff';
      this.ctx!.font = 'bold 16px Inter, sans-serif';
      this.ctx!.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx!.shadowBlur = 4;
      
      // Draw icon
      this.ctx!.font = '32px Arial';
      this.ctx!.fillText(reward.icon, radius * 0.7, -5);
      
      // Draw label
      this.ctx!.font = 'bold 14px Inter, sans-serif';
      this.ctx!.fillText(reward.label, radius * 0.7, 20);
      
      this.ctx!.restore();
    });

    // Draw center circle
    this.ctx!.beginPath();
    this.ctx!.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    this.ctx!.fillStyle = '#800000';
    this.ctx!.fill();
    this.ctx!.strokeStyle = '#ffffff';
    this.ctx!.lineWidth = 5;
    this.ctx!.stroke();

    // Draw "SPIN" text
    this.ctx!.fillStyle = '#ffffff';
    this.ctx!.font = 'bold 18px Inter, sans-serif';
    this.ctx!.textAlign = 'center';
    this.ctx!.textBaseline = 'middle';
    this.ctx!.fillText('SPIN', centerX, centerY);

    this.ctx!.restore();

    // Draw pointer
    this.drawPointer(centerX, centerY, radius);
  }

  /**
   * Draw pointer at top
   */
  private drawPointer(centerX: number, centerY: number, radius: number): void {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius - 5);
    this.ctx.lineTo(centerX - 15, centerY - radius - 25);
    this.ctx.lineTo(centerX + 15, centerY - radius - 25);
    this.ctx.closePath();
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fill();
    this.ctx.strokeStyle = '#800000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Spin the wheel
   */
  spin(): void {
    if (!this.canSpin() || this.isSpinning()) return;

    this.isSpinning.set(true);

    // Play spin sound
    this.spinSound?.play();

    // Call backend
    this.wheelService.spin().subscribe({
      next: (result) => {
        this.spinResult.set(result);
        this.targetRotation = this.currentRotation + result.rotationDegrees;
        this.animateSpin();
      },
      error: (err) => {
        console.error('Spin failed:', err);
        alert(err.error?.message || 'Failed to spin. Please try again.');
        this.isSpinning.set(false);
      }
    });
  }

  /**
   * Animate wheel spin
   */
  private animateSpin(): void {
    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    const startRotation = this.currentRotation;
    const totalRotation = this.targetRotation - startRotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.currentRotation = startRotation + totalRotation * easeOut;
      this.drawWheel();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.onSpinComplete();
      }
    };

    animate();
  }

  /**
   * Handle spin completion
   */
  private onSpinComplete(): void {
    this.isSpinning.set(false);
    this.canSpin.set(false);

    // Play win sound
    this.winSound?.play();

    // Show confetti
    this.showConfetti();

    // Show result modal
    setTimeout(() => {
      this.showResultModal.set(true);
    }, 500);
  }

  /**
   * Show confetti animation
   */
  private showConfetti(): void {
    const canvas = this.confettiCanvas?.nativeElement;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: any[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#C7CEEA'];

    // Create particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 8 + 4,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 4 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5
      });
    }

    // Animate particles
    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        requestAnimationFrame(animateConfetti);
      }
    };

    animateConfetti();
  }

  /**
   * Close result modal
   */
  closeResultModal(): void {
    this.showResultModal.set(false);
  }

  /**
   * Get reward icon class
   */
  getRewardIconClass(type: string): string {
    switch (type) {
      case 'DISCOUNT': return 'reward-discount';
      case 'FREE_SHIPPING': return 'reward-shipping';
      case 'POINTS': return 'reward-points';
      case 'COUPON': return 'reward-coupon';
      default: return 'reward-default';
    }
  }
}
