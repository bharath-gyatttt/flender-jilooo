import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

interface DeviceData {
  deviceId: string;
  deviceType: string;
  status: 'Connected' | 'Disconnected';
  speed: number;
  temperature: number;
  lastUpdate: Date;
}

interface AlarmData {
  type: string;
  message: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
}

interface HistoricalData {
  timestamp: Date;
  speed: number;
  temperature: number;
}

@Component({
  selector: 'app-device-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="device-monitor-container">
      <div class="monitor-header">
        <div class="header-title">Device Monitor - {{ deviceData.deviceId }}</div>
        <div class="header-actions">
          <button class="close-btn" (click)="goBack()">Back to Dashboard</button>
        </div>
      </div>
      
      <div class="monitor-content">
        <!-- Left Panel - Device Information -->
        <div class="left-panel">
          <div class="device-info-section">
            <h3>Device Information</h3>
            <div class="device-details">
              <div class="device-id">{{ deviceData.deviceId }}</div>
              <div class="device-type">{{ deviceData.deviceType }}</div>
            </div>
          </div>
          
          <div class="connection-status">
            <div class="wifi-icon">📶</div>
            <div class="status-text" [class]="deviceData.status.toLowerCase()">
              {{ deviceData.status }}
            </div>
          </div>
          
          <div class="features-section">
            <div class="feature-item">
              <input type="checkbox" id="stay-awake" checked>
              <label for="stay-awake">Activate stay-awake messages</label>
            </div>
          </div>
          
          <div class="file-upload-section">
            <h4>Drag & Drop Files</h4>
            <div class="drop-zone">
              <div class="drop-text">Drag & Drop Files</div>
            </div>
          </div>
        </div>
        
        <!-- Right Panel - Real-time Data -->
        <div class="right-panel">
          <!-- Speed Gauge -->
          <div class="gauge-section">
            <h4>Speed (0-100 RPM)</h4>
            <div class="gauge-container">
              <div class="gauge">
                <div class="gauge-fill" [style.width.%]="deviceData.speed"></div>
              </div>
              <div class="gauge-value">{{ deviceData.speed }}</div>
            </div>
          </div>
          
          <!-- Temperature Display -->
          <div class="temperature-section">
            <h4>Temperature</h4>
            <div class="temperature-display">
              <div class="temp-range">(0-500 °C)</div>
              <div class="temp-value">{{ deviceData.temperature }}</div>
            </div>
          </div>
          
          <!-- Send Alarm Message -->
          <div class="alarm-section">
            <h4>Send Alarm Message</h4>
            <div class="alarm-input">
              <input type="text" placeholder="System Alert: High Temperature" [(ngModel)]="alarmMessage">
              <button class="send-btn" (click)="sendAlarm()">Send</button>
            </div>
          </div>
          
          <!-- Historical Data -->
          <div class="historical-section">
            <h4>Historical Data</h4>
            <div class="data-controls">
              <select [(ngModel)]="selectedTimeRange">
                <option value="2022-2024">2022-2024</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2024">2024</option>
              </select>
              <select [(ngModel)]="selectedDataType">
                <option value="10M">10M</option>
                <option value="1H">1H</option>
                <option value="1D">1D</option>
              </select>
              <button class="export-btn" (click)="exportData()">Export Data</button>
            </div>
          </div>
          
          <!-- View Component Data Button -->
          <div class="component-data-section">
            <button class="view-component-btn" (click)="viewComponentData()">
              View Component Data
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./device-monitor.component.scss']
})
export class DeviceMonitorComponent implements OnInit, OnDestroy {
  deviceData: DeviceData = {
    deviceId: 'ZZ:ZZ:ZZ:00:00:01',
    deviceType: 'AIQ Core',
    status: 'Connected',
    speed: 75,
    temperature: 210,
    lastUpdate: new Date()
  };
  
  alarmMessage = 'System Alert: High Temperature';
  selectedTimeRange = '2022-2024';
  selectedDataType = '10M';
  
  private dataUpdateSubscription?: Subscription;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Get device ID from route params if available
    this.route.params.subscribe(params => {
      if (params['deviceId']) {
        this.deviceData.deviceId = params['deviceId'];
      }
    });
    
    // Start real-time data simulation
    this.startDataSimulation();
  }
  
  ngOnDestroy(): void {
    if (this.dataUpdateSubscription) {
      this.dataUpdateSubscription.unsubscribe();
    }
  }
  
  private startDataSimulation(): void {
    // Update data every 2 seconds to simulate real-time monitoring
    this.dataUpdateSubscription = interval(2000).subscribe(() => {
      this.updateSimulatedData();
    });
  }
  
  private updateSimulatedData(): void {
    // Simulate fluctuating speed (60-90 RPM)
    this.deviceData.speed = Math.floor(Math.random() * 30) + 60;
    
    // Simulate fluctuating temperature (180-250°C)
    this.deviceData.temperature = Math.floor(Math.random() * 70) + 180;
    
    this.deviceData.lastUpdate = new Date();
  }
  
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
  
  sendAlarm(): void {
    if (this.alarmMessage.trim()) {
      console.log('Sending alarm:', this.alarmMessage);
      // In a real app, this would send the alarm to the backend
      alert(`Alarm sent: ${this.alarmMessage}`);
    }
  }
  
  exportData(): void {
    console.log(`Exporting data for ${this.selectedTimeRange} with ${this.selectedDataType} intervals`);
    // In a real app, this would trigger a data export
    alert(`Exporting historical data for ${this.selectedTimeRange}`);
  }
  
  viewComponentData(): void {
    console.log('Opening component data view');
    // In a real app, this might open a detailed component analysis view
    alert('Component data view would open here');
  }
}
