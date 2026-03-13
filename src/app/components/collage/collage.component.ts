import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ImageStoreService, StoredImage } from '../../services/image-store.service';

type CollageLayoutId = 'pyramid' | 'diamond' | 'grid' | 'grid-vertical';

interface CollageLayout {
  id: CollageLayoutId;
  label: string;
  rows: number[];
}

@Component({
  selector: 'app-collage',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './collage.component.scss',
  template: `
    <section class="screen collage">
      <header class="collage-header">
        <h2>Your Memory Collage</h2>
        <p>Up to 10 moments, stitched together and ready to save.</p>
      </header>

      <div class="layout-panel">
        <div class="layout-row">
          <p class="layout-label">Layout</p>
          <div class="layout-options">
            <button
              class="ghost-btn"
              *ngFor="let layout of layouts"
              type="button"
              [class.is-active]="layout.id === selectedLayout.id"
              (click)="selectLayout(layout.id)"
            >
              {{ layout.label }}
            </button>
          </div>
        </div>
        <div class="layout-row">
          <p class="layout-label">Background</p>
          <div class="color-options">
            <button
              class="color-swatch"
              *ngFor="let color of backgroundColors"
              [style.background]="color"
              [class.is-active]="color === backgroundColor"
              type="button"
              (click)="setBackground(color)"
              aria-label="Background color"
            ></button>
            <label class="color-wheel">
              <input type="color" [value]="backgroundColor" (input)="setBackground($any($event.target).value)" />
            </label>
          </div>
        </div>
      </div>

      <div class="collage-canvas">
        <canvas #canvas></canvas>
      </div>

      <div class="collage-actions">
        <button class="primary-btn" (click)="downloadPng()" [disabled]="!ready">
          Download PNG
        </button>
        <button class="ghost-btn" (click)="captureMore()">Capture More</button>
      </div>
    </section>
  `
})
export class CollageComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  images: StoredImage[] = [];
  ready = false;
  backgroundColor = '#0d0d13';
  readonly backgroundColors = ['#0d0d13', '#1b1b2f', '#2b1a17', '#1c2a24', '#33221d', '#1c1a2b'];
  readonly layouts: CollageLayout[] = [
    { id: 'pyramid', label: 'Pyramid', rows: [1, 2, 3, 4] },
    { id: 'diamond', label: 'Diamond', rows: [2, 3, 3, 2] },
    { id: 'grid', label: 'Grid 5x2', rows: [5, 5] },
    { id: 'grid-vertical', label: 'Grid 2x5', rows: [2, 2, 2, 2, 2] }
  ];
  selectedLayout: CollageLayout = this.layouts[0];

  constructor(private store: ImageStoreService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.images = await this.store.getImages();
    if (this.images.length === 0) {
      this.router.navigateByUrl('/capture');
      return;
    }
    await this.buildCollage();
  }

  private async buildCollage(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cappedImages = this.images.slice(0, 10);
    const rows = this.buildRowsForCount(this.selectedLayout.rows, cappedImages.length);
    const gap = 18;
    const maxCols = Math.max(...rows);
    const targetWidth = 920;
    const tileSize = Math.floor((targetWidth - gap * (maxCols - 1)) / maxCols);
    const width = maxCols * tileSize + gap * (maxCols - 1);
    const height = rows.length * tileSize + (rows.length - 1) * gap;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const images = await Promise.all(cappedImages.map((img) => this.loadImage(img.dataUrl)));

    let imageIndex = 0;
    rows.forEach((count, rowIndex) => {
      const y = rowIndex * (tileSize + gap);
      const rowWidth = count * tileSize + (count - 1) * gap;
      const xStart = (width - rowWidth) / 2;

      for (let i = 0; i < count; i += 1) {
        const x = xStart + i * (tileSize + gap);
        const image = images[imageIndex];
        if (!image) break;
        this.drawCover(ctx, image, x, y, tileSize, tileSize);
        imageIndex += 1;
      }
    });

    this.ready = true;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  private drawCover(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const ratio = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    const dx = x - (drawWidth - width) / 2;
    const dy = y - (drawHeight - height) / 2;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, 18);
    } else {
      const radius = 18;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    ctx.clip();
    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
    ctx.restore();
  }

  downloadPng(): void {
    if (!this.ready) return;
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = 'birthday-memories.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async captureMore(): Promise<void> {
    await this.store.clearImages();
    this.router.navigateByUrl('/capture');
  }

  async selectLayout(layoutId: CollageLayoutId): Promise<void> {
    const nextLayout = this.layouts.find((layout) => layout.id === layoutId);
    if (!nextLayout || nextLayout.id === this.selectedLayout.id) return;
    this.selectedLayout = nextLayout;
    this.ready = false;
    await this.buildCollage();
  }

  async setBackground(color: string): Promise<void> {
    if (color === this.backgroundColor) return;
    this.backgroundColor = color;
    this.ready = false;
    await this.buildCollage();
  }

  private buildRowsForCount(layoutRows: number[], count: number): number[] {
    if (count <= 0) return [];
    const rows: number[] = [];
    let remaining = count;

    for (const rowCount of layoutRows) {
      if (remaining <= 0) break;
      const next = Math.min(rowCount, remaining);
      rows.push(next);
      remaining -= next;
    }

    if (rows.length === 0) {
      rows.push(Math.min(count, layoutRows[0]));
    }

    return rows;
  }
}
