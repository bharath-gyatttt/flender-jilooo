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
  torque: number;
  vibration: number;
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
          <!-- Speed Control -->
          <div class="control-section">
            <h4>Speed Control</h4>
            <div class="input-container">
              <input type="number" [(ngModel)]="deviceData.speed" (ngModelChange)="onSpeedChange()" 
                     placeholder="Enter speed" class="control-input">
              <span class="unit-label">RPM</span>
            </div>
            <div class="gauge-container">
              <div class="gauge">
                <div class="gauge-fill" [style.width.%]="getGaugePercentage(deviceData.speed, maxSpeed)"></div>
              </div>
              <div class="gauge-value">{{ deviceData.speed }}</div>
            </div>
          </div>
          
          <!-- Temperature Control -->
          <div class="control-section">
            <h4>Temperature Control</h4>
            <div class="input-container">
              <input type="number" [(ngModel)]="deviceData.temperature" (ngModelChange)="onTemperatureChange()" 
                     placeholder="Enter temperature" class="control-input">
              <span class="unit-label">°C</span>
            </div>
            <div class="temperature-display">
              <div class="temp-value">{{ deviceData.temperature }}</div>
            </div>
          </div>
          
          <!-- Torque Control -->
          <div class="control-section">
            <h4>Torque Control</h4>
            <div class="input-container">
              <input type="number" [(ngModel)]="deviceData.torque" (ngModelChange)="onTorqueChange()" 
                     placeholder="Enter torque" class="control-input">
              <span class="unit-label">Nm</span>
            </div>
            <div class="gauge-container">
              <div class="gauge">
                <div class="gauge-fill torque-fill" [style.width.%]="getGaugePercentage(deviceData.torque, maxTorque)"></div>
              </div>
              <div class="gauge-value">{{ deviceData.torque }}</div>
            </div>
          </div>
          
          <!-- Vibration Control -->
          <div class="control-section">
            <h4>Vibration Control</h4>
            <div class="input-container">
              <input type="number" [(ngModel)]="deviceData.vibration" (ngModelChange)="onVibrationChange()" 
                     placeholder="Enter vibration" class="control-input" step="0.1">
              <span class="unit-label">mm/s</span>
            </div>
            <div class="gauge-container">
              <div class="gauge">
                <div class="gauge-fill vibration-fill" [style.width.%]="getGaugePercentage(deviceData.vibration, maxVibration)"></div>
              </div>
              <div class="gauge-value">{{ deviceData.vibration }}</div>
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
          
          <!-- Generate Data to Export -->
          <div class="export-section">
            <h4>Generate Data to Export</h4>
            <div class="export-controls">
              <div class="export-options">
                <label>
                  <input type="checkbox" [(ngModel)]="exportOptions.speed"> Speed Data
                </label>
                <label>
                  <input type="checkbox" [(ngModel)]="exportOptions.temperature"> Temperature Data
                </label>
                <label>
                  <input type="checkbox" [(ngModel)]="exportOptions.torque"> Torque Data
                </label>
                <label>
                  <input type="checkbox" [(ngModel)]="exportOptions.vibration"> Vibration Data
                </label>
              </div>
              <div class="export-settings">
                <select [(ngModel)]="selectedTimeRange">
                  <option value="1H">Last 1 Hour</option>
                  <option value="1D">Last 1 Day</option>
                  <option value="1W">Last 1 Week</option>
                  <option value="1M">Last 1 Month</option>
                </select>
                <select [(ngModel)]="selectedDataType">
                  <option value="CSV">CSV Format</option>
                  <option value="JSON">JSON Format</option>
                  <option value="XML">XML Format</option>
                </select>
              </div>
              <button class="generate-btn" (click)="generateAndExportData()">Generate & Export</button>
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
    torque: 150,
    vibration: 2.5,
    lastUpdate: new Date()
  };
  
  alarmMessage = 'System Alert: High Temperature';
  selectedTimeRange = '1D';
  selectedDataType = 'CSV';
  
  // Maximum values for gauge calculations
  maxSpeed = 1000;
  maxTemperature = 500;
  maxTorque = 500;
  maxVibration = 10;
  
  exportOptions = {
    speed: true,
    temperature: true,
    torque: false,
    vibration: false
  };
  
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
    // Only update if user hasn't manually set values recently
    // This allows manual control while still showing some variation
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
  
  onSpeedChange(): void {
    console.log('Speed changed to:', this.deviceData.speed);
  }
  
  onTemperatureChange(): void {
    console.log('Temperature changed to:', this.deviceData.temperature);
  }
  
  onTorqueChange(): void {
    console.log('Torque changed to:', this.deviceData.torque);
  }
  
  onVibrationChange(): void {
    console.log('Vibration changed to:', this.deviceData.vibration);
  }
  
  getGaugePercentage(value: number, maxValue: number): number {
    return Math.min((value / maxValue) * 100, 100);
  }
  
  generateAndExportData(): void {
    const selectedData: string[] = [];
    if (this.exportOptions.speed) selectedData.push('Speed');
    if (this.exportOptions.temperature) selectedData.push('Temperature');
    if (this.exportOptions.torque) selectedData.push('Torque');
    if (this.exportOptions.vibration) selectedData.push('Vibration');
    
    if (selectedData.length === 0) {
      alert('Please select at least one data type to export');
      return;
    }
    
    // Generate sample data based on current values
    const generatedData = this.generateSampleData(selectedData);
    
    // Create and download file
    this.downloadData(generatedData, selectedData);
    
    console.log(`Generating and exporting ${selectedData.join(', ')} data for ${this.selectedTimeRange} in ${this.selectedDataType} format`);
  }
  
  private generateSampleData(dataTypes: string[]): any[] {
    const data: any[] = [];
    const now = new Date();
    const intervals = this.getIntervalCount();
    
    for (let i = 0; i < intervals; i++) {
      const timestamp = new Date(now.getTime() - (i * this.getIntervalMs()));
      const dataPoint: any = { timestamp: timestamp.toISOString() };
      
      dataTypes.forEach(type => {
        switch (type) {
          case 'Speed':
            dataPoint.speed = this.deviceData.speed + (Math.random() - 0.5) * 20;
            break;
          case 'Temperature':
            dataPoint.temperature = this.deviceData.temperature + (Math.random() - 0.5) * 10;
            break;
          case 'Torque':
            dataPoint.torque = this.deviceData.torque + (Math.random() - 0.5) * 30;
            break;
          case 'Vibration':
            dataPoint.vibration = this.deviceData.vibration + (Math.random() - 0.5) * 1;
            break;
        }
      });
      
      data.push(dataPoint);
    }
    
    return data.reverse(); // Chronological order
  }
  
  private getIntervalCount(): number {
    switch (this.selectedTimeRange) {
      case '1H': return 60; // 1 minute intervals
      case '1D': return 144; // 10 minute intervals
      case '1W': return 168; // 1 hour intervals
      case '1M': return 120; // 6 hour intervals
      default: return 100;
    }
  }
  
  private getIntervalMs(): number {
    switch (this.selectedTimeRange) {
      case '1H': return 60 * 1000; // 1 minute
      case '1D': return 10 * 60 * 1000; // 10 minutes
      case '1W': return 60 * 60 * 1000; // 1 hour
      case '1M': return 6 * 60 * 60 * 1000; // 6 hours
      default: return 60 * 1000;
    }
  }
  
  private downloadData(data: any[], dataTypes: string[]): void {
    let content = '';
    let filename = '';
    
    switch (this.selectedDataType) {
      case 'CSV':
        content = this.generateCSV(data);
        filename = `device_data_${this.selectedTimeRange}.csv`;
        break;
      case 'JSON':
        content = JSON.stringify(data, null, 2);
        filename = `device_data_${this.selectedTimeRange}.json`;
        break;
      case 'XML':
        content = this.generateXML(data);
        filename = `device_data_${this.selectedTimeRange}.xml`;
        break;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    alert(`Generated and exported ${dataTypes.join(', ')} data for ${this.selectedTimeRange} in ${this.selectedDataType} format`);
  }
  
  private generateCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  private generateXML(data: any[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<deviceData>\n';
    
    data.forEach(item => {
      xml += '  <dataPoint>\n';
      Object.keys(item).forEach(key => {
        xml += `    <${key}>${item[key]}</${key}>\n`;
      });
      xml += '  </dataPoint>\n';
    });
    
    xml += '</deviceData>';
    return xml;
  }
  
  viewComponentData(): void {
    console.log('Opening component data view');
    // In a real app, this might open a detailed component analysis view
    alert('Component data view would open here');
  }
}
