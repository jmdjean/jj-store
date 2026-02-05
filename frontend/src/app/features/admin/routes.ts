import { Routes } from '@angular/router';
import { AdminPageComponent } from './pages/admin-page.component';
import { RagSearchPageComponent } from './pages/rag-search-page.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminPageComponent,
  },
  {
    path: 'rag',
    component: RagSearchPageComponent,
  },
];
