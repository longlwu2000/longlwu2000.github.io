import { AuthService } from './../../services/auth.service';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  email: FormControl;
  password: FormControl;
  signupForm: FormGroup;
  constructor(private formBuilder: FormBuilder, public auth: AuthService) {
    this.email = new FormControl();
    this.password = new FormControl();
    this.signupForm = this.formBuilder.group({
      email: this.email,
      password: this.password,
    });
  }

  ngOnInit() {}
  onSubmit() {
    console.log(this.signupForm.value);
    if (this.signupForm.valid) {
      this.auth.register(this.email.value, this.password.value);
    }
  }
}
