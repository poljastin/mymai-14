import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ImageStoreService, StoredImage } from '../../services/image-store.service';

@Component({
  selector: 'app-capture',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: './capture.component.scss',
  template: `
    <section class="screen capture">
      <header class="capture-header">
        <a class="ghost-btn" routerLink="/">Back</a>
        <div class="counter">{{ images.length }}/10</div>
      </header>

      <div class="lens-frame">
        <video #video autoplay playsinline muted></video>
        <div class="lens-overlay"></div>
      </div>

      <div class="capture-actions">
        <button class="primary-btn" (click)="capture()" [disabled]="isCapturing || images.length >= 10">
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="8.2" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
          </span>
          Take Photo
        </button>
        <button class="ghost-btn" type="button" (click)="goToCollage()" [disabled]="images.length === 0">
          Go to Layout
        </button>
        <p class="helper">{{ helperText }}</p>
      </div>

      <div class="filmstrip">
        <div class="thumb" *ngFor="let img of images; let i = index">
          <img [src]="img.dataUrl" [alt]="'Memory ' + (i + 1)" />
        </div>
      </div>
    </section>
  `
})
export class CaptureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  images: StoredImage[] = [];
  isCapturing = false;
  helperText = 'Hold still and tap the shutter.';

  private stream: MediaStream | null = null;

  constructor(private store: ImageStoreService, private router: Router) {}

  async ngAfterViewInit(): Promise<void> {
    await this.loadImages();
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async loadImages(): Promise<void> {
    this.images = await this.store.getImages();
    if (this.images.length >= 10) {
      this.router.navigateByUrl('/collage');
    }
  }

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      this.videoRef.nativeElement.srcObject = this.stream;
    } catch (error) {
      this.helperText = 'Camera access is blocked. Please allow access to continue.';
    }
  }

  private stopCamera(): void {
    if (!this.stream) return;
    for (const track of this.stream.getTracks()) {
      track.stop();
    }
    this.stream = null;
  }

  async capture(): Promise<void> {
    if (this.isCapturing || this.images.length >= 10) return;

    const video = this.videoRef.nativeElement;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    if (!width || !height) {
      this.helperText = 'Camera is still warming up. Try again in a moment.';
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.isCapturing = true;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');

    await this.store.addImage(dataUrl);
    await this.loadImages();

    this.isCapturing = false;

    if (this.images.length >= 10) {
      this.stopCamera();
      this.router.navigateByUrl('/collage');
    }
  }

  goToCollage(): void {
    if (this.images.length === 0) return;
    this.stopCamera();
    this.router.navigateByUrl('/collage');
  }
}
