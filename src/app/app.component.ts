import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  styleUrl: './app.component.scss',
  template: `
    <main class="app-shell">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {}
