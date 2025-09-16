import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/multi-auth.service';
import { SimulatorService, Device } from '../shared/services/simulator.service';
import { CertService } from '../shared/services/cert.service';
import { ComponentService } from '../shared/services/component.service';
import { LoginModalComponent } from '../shared/components/login-modal/login-modal.component';
import { EnvironmentConfigService } from '../config/environment.config';
import { switchMap } from 'rxjs/operators';

interface NewSimulatorForm {
  deviceId: string;
  type: string;
  environment: string;
  description: string;
  equipmentNo: string;
  organizationName: string;
}

interface LoginFormData {
  username: string;
  password: string;
  isLoggingIn: boolean;
}

enum StepStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface CreationStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  error?: string;
}

interface DeviceCreationState {
  isCreating: boolean;
  currentStepIndex: number;
  steps: CreationStep[];
}

@Component({
  selector: 'app-add-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LoginModalComponent],
  template: `
    <div class="add-simulator-container">
      <div class="add-simulator-main">
        <div class="add-simulator-content" [class.blurred]="creationState.isCreating">
          <form (ngSubmit)="createSimulator()" #simulatorForm="ngForm" class="simulator-form">
            
            <!-- Environment -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Environment</h3>
              </div>
              <div class="environment-selection">
                <div 
                  *ngFor="let env of environments" 
                  class="environment-option"
                  [class.selected]="isEnvironmentSelected(env)"
                  [style.border-color]="isEnvironmentSelected(env) ? getEnvironmentColors(env).primary : 'var(--border-color)'"
                  [style.background-color]="isEnvironmentSelected(env) ? getEnvironmentColors(env).background : 'transparent'"
                  (click)="selectEnvironment(env)">
                  <span 
                    class="environment-label"
                    [style.color]="isEnvironmentSelected(env) ? getEnvironmentColors(env).primary : 'var(--text-primary)'">
                    {{ getEnvironmentLabel(env) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Session -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Session</h3>
              </div>
              <div class="session-info-display">
                <div class="active-session">
                  <div class="user-details">
                    <span class="user-name">Demo User</span>
                    <span class="user-org">Demo Organization</span>
                  </div>
                  <span class="session-status active">Active Session</span>
                </div>
              </div>
            </div>

            <!-- Device Type -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Device Type</h3>
              </div>
              <div class="device-type-selection">
                <div 
                  *ngFor="let type of deviceTypes" 
                  class="device-type-option"
                  [class.selected]="isDeviceTypeSelected(type)"
                  (click)="selectDeviceType(type)">
                  <span class="device-type-label">{{ type }}</span>
                </div>
              </div>
            </div>

            <!-- Device ID -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Device ID</h3>
              </div>
              <div class="input-with-button">
                <input 
                  type="text" 
                  id="deviceId"
                  name="deviceId"
                  [(ngModel)]="newSimulator.deviceId" 
                  required
                  class="form-control"
                  placeholder="Enter device ID (e.g., AA:BB:CC:DD:EE:FF)">
                <button 
                  type="button" 
                  class="btn btn-generate" 
                  (click)="generateDeviceId()">
                  Generate
                </button>
              </div>
            </div>

            <!-- Equipment No -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Equipment No</h3>
              </div>
              <input 
                type="text" 
                id="equipmentNo"
                name="equipmentNo"
                [(ngModel)]="newSimulator.equipmentNo" 
                class="form-control"
                placeholder="Enter Equipment Number">
            </div>

            <!-- Organization Name -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Organization Name</h3>
              </div>
              <select 
                id="organizationName"
                name="organizationName"
                [(ngModel)]="newSimulator.organizationName" 
                class="form-control">
                <option value="">Select Organization</option>
                <option value="Organization A">Organization A</option>
                <option value="Organization B">Organization B</option>
                <option value="Organization C">Organization C</option>
              </select>
            </div>

            <!-- Description -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Description (Optional)</h3>
              </div>
              <textarea 
                id="simulatorDescription" 
                name="description"
                [(ngModel)]="newSimulator.description" 
                class="form-control description-textarea"
                rows="4"
                placeholder="Enter a description for this simulator..."></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="goBack()">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="simulatorForm.invalid || isCreatingSimulator">
                <span *ngIf="!isCreatingSimulator">Create Simulator</span>
                <span *ngIf="isCreatingSimulator" class="creating-text">
                  <span class="creating-spinner"></span>
                  <span>Creating...</span>
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Creation Progress Stepper Overlay -->
      <div *ngIf="creationState.isCreating" class="creation-overlay">
        <div class="creation-stepper">
          <div class="stepper-header">
            <h3>Creating Device Simulator</h3>
            <p>Please wait while we set up your device simulator...</p>
          </div>
          
          <div class="stepper-content">
            <div class="steps-container">
              <div 
                *ngFor="let step of creationState.steps; let i = index" 
                class="step-item"
                [class.current]="i === creationState.currentStepIndex"
                [class.completed]="step.status === 'success'"
                [class.error]="step.status === 'error'"
                [class.loading]="step.status === 'loading'">
                
                <div class="step-indicator">
                  <div class="step-number" *ngIf="step.status === 'pending'">
                    {{ i + 1 }}
                  </div>
                  <div class="step-icon" *ngIf="step.status === 'success'">
                    ✓
                  </div>
                  <div class="step-icon error" *ngIf="step.status === 'error'">
                    ✗
                  </div>
                  <div class="step-spinner" *ngIf="step.status === 'loading'">
                    <div class="spinner"></div>
                  </div>
                </div>
                
                <div class="step-content">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-description">{{ step.description }}</div>
                  <div *ngIf="step.error" class="step-error">{{ step.error }}</div>
                </div>
                
                <div class="step-connector" *ngIf="i < creationState.steps.length - 1"></div>
              </div>
            </div>
            
            <!-- Error Actions -->
            <div *ngIf="hasErrorSteps()" class="error-actions">
              <button type="button" class="btn btn-secondary" (click)="cancelCreation()">
                Cancel
              </button>
              <button type="button" class="btn btn-primary" (click)="retryCreation()">
                Retry
              </button>
            </div>
            
            <!-- Success Message -->
            <div *ngIf="allStepsSuccessful()" class="success-message">
              <div class="success-icon">🎉</div>
              <div class="success-text">
                <h4>Simulator Created Successfully!</h4>
                <p>Your device simulator has been created and is ready to use.</p>
              </div>
              <div class="success-actions">
                <button type="button" class="btn btn-primary" (click)="goToDashboard()">
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Login Modal -->
      <app-login-modal
        [isVisible]="showLoginModal"
        [environment]="newSimulator.environment"
        (loginSuccess)="onLoginSuccess()"
        (modalClosed)="onLoginModalClosed()">
      </app-login-modal>
    </div>
  `,
  styleUrls: ['./add-simulator.component.scss']
})
export class AddSimulatorComponent implements OnInit {
  environments = EnvironmentConfigService.getEnvironmentKeys();
  deviceTypes = ['AIQ Core', 'AIQ Core Torque'];
  
  newSimulator: NewSimulatorForm = {
    deviceId: '',
    type: this.deviceTypes[0], // Set first device type as default
    environment: EnvironmentConfigService.getEnvironmentKeys()[0], // Set first environment as default
    description: '',
    equipmentNo: '',
    organizationName: ''
  };
  
  loginForm: LoginFormData = {
    username: '',
    password: '',
    isLoggingIn: false
  };
  
  isCreatingSimulator = false;
  showLoginModal = false;
  creationState: DeviceCreationState = {
    isCreating: false,
    currentStepIndex: 0,
    steps: [        {
          id: 'get-credentials',
          title: 'Getting Credentials',
          description: 'Requesting device certificate and private key',
          status: StepStatus.PENDING
        },
        {
          id: 'check-enrollment',
          title: 'Checking Enrollment',
          description: 'Verifying device enrollment status',
          status: StepStatus.PENDING
        },
        {
          id: 'create-enrollment',
          title: 'Creating Enrollment',
          description: 'Enrolling device with provisioning service',
          status: StepStatus.PENDING
        },
        {
          id: 'create-simulator',
          title: 'Creating Simulator',
          description: 'Setting up simulator configuration',
          status: StepStatus.PENDING
        },
        {
          id: 'start-simulator',
          title: 'Starting Simulator',
          description: 'Initializing simulator and connecting to IoT Hub',
          status: StepStatus.PENDING
        }
    ]
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private simulatorService: SimulatorService,
    private certService: CertService,
    private componentService: ComponentService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.resetSimulatorForm();
  }

  private resetSimulatorForm(): void {
    this.newSimulator = {
      deviceId: '',
      type: 'AIQ Core',
      environment: 'dev',
      description: '',
      equipmentNo: '',
      organizationName: ''
    };
    this.isCreatingSimulator = false;
    this.resetCreationState();
    this.resetLoginForm();
  }

  private resetCreationState(): void {
    this.creationState = {
      isCreating: false,
      currentStepIndex: 0,
      steps: [
        {
          id: 'get-credentials',
          title: 'Getting Credentials',
          description: 'Requesting device certificate and private key',
          status: StepStatus.PENDING
        },
        {
          id: 'check-enrollment',
          title: 'Checking Enrollment',
          description: 'Verifying device enrollment status',
          status: StepStatus.PENDING
        },
        {
          id: 'create-enrollment',
          title: 'Creating Enrollment',
          description: 'Enrolling device with provisioning service',
          status: StepStatus.PENDING
        },
        {
          id: 'create-simulator',
          title: 'Creating Simulator',
          description: 'Setting up simulator configuration',
          status: StepStatus.PENDING
        },
        {
          id: 'start-simulator',
          title: 'Starting Simulator',
          description: 'Initializing simulator and connecting to IoT Hub',
          status: StepStatus.PENDING
        }
      ]
    };
  }

  private resetLoginForm(): void {
    this.loginForm = {
      username: '',
      password: '',
      isLoggingIn: false
    };
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  generateDeviceId(): void {
    this.newSimulator.deviceId = this.generateMacAddress();
  }

  createSimulator(): void {
    if (!this.newSimulator.deviceId || !this.newSimulator.type || !this.newSimulator.environment) {
      return;
    }

    this.isCreatingSimulator = true;
    
    // Add a small delay before showing the overlay for smoother transition
    setTimeout(() => {
      this.creationState.isCreating = true;
      this.creationState.currentStepIndex = 0;
      this.executeCreationSteps();
    }, 100);
  }

  private executeCreationSteps(): void {
    // Demo mode - bypass all API calls and simulate successful creation
    this.executeStep1GetCredentials();
  }

  private executeStep1GetCredentials(): void {
    this.updateStepStatus(0, StepStatus.LOADING);
    
    // Simulate API call with dummy data
    setTimeout(() => {
      this.updateStepStatus(0, StepStatus.SUCCESS);
      this.creationState.currentStepIndex = 1;
      setTimeout(() => this.executeStep2CheckEnrollment(), 500);
    }, 800);
  }

  private executeStep2CheckEnrollment(): void {
    this.updateStepStatus(1, StepStatus.LOADING);
    
    // Simulate API call - always return not enrolled for demo
    setTimeout(() => {
      this.updateStepStatus(1, StepStatus.SUCCESS);
      this.creationState.currentStepIndex = 2;
      setTimeout(() => this.executeStep3CreateEnrollment(), 500);
    }, 800);
  }

  private executeStep3CreateEnrollment(): void {
    this.updateStepStatus(2, StepStatus.LOADING);
    
    // Simulate API call - always successful for demo
    setTimeout(() => {
      this.updateStepStatus(2, StepStatus.SUCCESS);
      this.creationState.currentStepIndex = 3;
      setTimeout(() => this.executeStep4CreateSimulator(), 500);
    }, 800);
  }

  private executeStep4CreateSimulator(): void {
    this.updateStepStatus(3, StepStatus.LOADING);
    
    // Simulate API call - always successful for demo
    setTimeout(() => {
      this.updateStepStatus(3, StepStatus.SUCCESS);
      this.creationState.currentStepIndex = 4;
      
      // Create dummy device object for demo
      const newDevice: Device = {
        id: this.newSimulator.deviceId,
        type: this.newSimulator.type,
        status: 'connected',
        environment: this.newSimulator.environment as 'dev' | 'test' | 'prod',
        lastActivity: new Date()
      };

      console.log('Demo device created:', newDevice);
      setTimeout(() => this.executeStep5StartSimulator(), 500);
    }, 800);
  }

  private executeStep5StartSimulator(): void {
    this.updateStepStatus(4, StepStatus.LOADING);
    
    // Simulate final step - always successful for demo
    setTimeout(() => {
      this.updateStepStatus(4, StepStatus.SUCCESS);
      setTimeout(() => this.onCreationComplete(), 1000);
    }, 800);
  }

  private updateStepStatus(stepIndex: number, status: StepStatus, error?: string): void {
    if (stepIndex >= 0 && stepIndex < this.creationState.steps.length) {
      this.creationState.steps[stepIndex].status = status;
      if (error) {
        this.creationState.steps[stepIndex].error = error;
      }
    }
  }

  private onCreationComplete(): void {
    // Navigate to device monitor after successful creation
    setTimeout(() => {
      this.goToDeviceMonitor();
    }, 2000);
  }

  goToDashboard(): void {
    this.resetCreationState();
    this.isCreatingSimulator = false;
    this.router.navigate(['/dashboard']);
  }

  goToDeviceMonitor(): void {
    this.resetCreationState();
    this.isCreatingSimulator = false;
    this.router.navigate(['/device-monitor', this.newSimulator.deviceId]);
  }

  retryCreation(): void {
    this.resetCreationState();
    this.createSimulator();
  }

  cancelCreation(): void {
    this.resetCreationState();
    this.isCreatingSimulator = false;
  }

  hasErrorSteps(): boolean {
    return this.creationState.steps.some(step => step.status === StepStatus.ERROR);
  }

  allStepsSuccessful(): boolean {
    return this.creationState.steps.every(step => step.status === StepStatus.SUCCESS);
  }

  private generateMacAddress(): string {
    const hexChars = '0123456789ABCDEF';
    // Start with ZZ:ZZ:ZZ to identify simulated devices
    let mac = 'ZZ:ZZ:ZZ';
    
    // Generate the remaining 3 octets with valid hex characters
    for (let i = 0; i < 3; i++) {
      mac += ':';
      mac += hexChars.charAt(Math.floor(Math.random() * 16));
      mac += hexChars.charAt(Math.floor(Math.random() * 16));
    }
    return mac;
  }

  // Environment session methods
  getEnvironmentSession(environment: string): any {
    return this.authService.getSessionForEnvironment(environment);
  }

  onEnvironmentChange(): void {
    // Reset login form when environment changes
    this.resetLoginForm();
  }

  openLoginModal(): void {
    this.showLoginModal = true;
  }

  onLoginSuccess(): void {
    this.showLoginModal = false;
    // The template will automatically update to show the session info
  }

  onLoginModalClosed(): void {
    this.showLoginModal = false;
  }

  selectDeviceType(type: string): void {
    this.newSimulator.type = type;
  }

  isDeviceTypeSelected(type: string): boolean {
    return this.newSimulator.type === type;
  }

  selectEnvironment(env: string): void {
    this.newSimulator.environment = env;
    this.onEnvironmentChange();
  }

  getEnvironmentLabel(env: string): string {
    return EnvironmentConfigService.getDisplayName(env);
  }

  getEnvironmentColors(env: string) {
    return EnvironmentConfigService.getColors(env);
  }

  isEnvironmentSelected(env: string): boolean {
    return this.newSimulator.environment === env;
  }

  loginToEnvironment(environment: string): void {
    if (!this.loginForm.username || !this.loginForm.password) {
      return;
    }

    this.loginForm.isLoggingIn = true;
    
    this.authService.login(this.loginForm.username, this.loginForm.password, environment).subscribe({
      next: (response) => {
        console.log(`Login successful for ${environment}:`, response);
        this.resetLoginForm();
        // The template will automatically update to show the session info
      },
      error: (error) => {
        console.error(`Login failed for ${environment}:`, error);
        this.loginForm.isLoggingIn = false;
        // Show error message - in a real app, you might want to display this in the UI
        alert(`Login failed: ${error.message || 'Please try again.'}`);
      }
    });
  }
}
