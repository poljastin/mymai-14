import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './landing.component.scss',
  template: `
    <section class="screen landing">
      <div class="landing-card">
        <p class="eyebrow">Happy Birthday</p>
        <h1>Let's capture some memories</h1>
        <a class="primary-btn icon-only" routerLink="/capture" aria-label="Start camera">
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8.2 5.2h7.6l1.35 1.9H20a2 2 0 0 1 2 2v7.9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.1a2 2 0 0 1 2-2h2.85l1.35-1.9z" />
              <circle cx="12" cy="13" r="3.25" fill="rgba(0, 0, 0, 0.28)" />
            </svg>
          </span>
        </a>
      </div>
      <div class="glow-orb" aria-hidden="true"></div>
    </section>
  `
})
export class LandingComponent {}
