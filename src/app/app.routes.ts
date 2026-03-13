import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { CaptureComponent } from './components/capture/capture.component';
import { CollageComponent } from './components/collage/collage.component';

export const appRoutes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'capture', component: CaptureComponent },
  { path: 'collage', component: CollageComponent },
  { path: '**', redirectTo: '' }
];
