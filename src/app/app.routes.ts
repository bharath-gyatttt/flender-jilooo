import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AddSimulatorComponent } from './add-simulator/add-simulator.component';
import { LoginComponent } from './login/login.component';
import { DeviceMonitorComponent } from './device-monitor/device-monitor.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent
  },
  { 
    path: 'add-simulator', 
    component: AddSimulatorComponent
  },
  { 
    path: 'device-monitor/:deviceId', 
    component: DeviceMonitorComponent
  },
  { path: '**', redirectTo: '/dashboard' }
];
