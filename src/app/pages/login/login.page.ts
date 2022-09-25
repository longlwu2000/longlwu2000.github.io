import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email: FormControl;
  password: FormControl;
  loginForm: FormGroup;
  constructor(private formBuilder: FormBuilder, public auth: AuthService) {
    this.email = new FormControl();
    this.password = new FormControl();
    this.loginForm = this.formBuilder.group({
      email: this.email,
      password: this.password,
    });
  }

  ngOnInit() {}
  onSubmit() {
    console.log(this.loginForm.value);
    this.auth.login(this.email.value, this.password.value);
  }
}
