import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-validation',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './otp-validation.component.html',
  styleUrl: './otp-validation.component.scss',
})
export class OtpValidationComponent {
  otpForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  onOtpInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.otpForm.get('otp')?.setValue(value);
  }

  onSubmit() {
    if (this.otpForm.valid) {
      console.log('OTP submitted', this.otpForm.value);
      // TODO: Implement OTP verification logic
    }
  }

  resendOtp() {
    console.log('Resend OTP');
    // TODO: Implement resend OTP logic
  }

  navigateToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
