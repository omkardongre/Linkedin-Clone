import { Component, OnInit } from "@angular/core";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { IonicModule, ToastController } from "@ionic/angular";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-signin",
  templateUrl: "./signin.page.html",
  styleUrls: ["./signin.page.scss"],
  standalone: true,
  imports: [ReactiveFormsModule, IonicModule, CommonModule],
})
export class SigninPage implements OnInit {
  signinForm: FormGroup;
  showPassword: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController,
  ) {
    this.signinForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {}

  async presentToast(message: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: "bottom", // You can also use 'top' or 'middle'
    });
    toast.present();
  }

  onSubmit() {
    if (this.signinForm.valid) {
      const { email, password } = this.signinForm.value;

      this.authService.login(email, password).subscribe({
        next: (response: { token: string }) => {
          this.router.navigate(["/home"]);
          this.presentToast("Login successful!", 2000);
        },
        error: (error) => {
          this.presentToast("Login failed. Please try again.", 2000);
        },
      });
    } else {
      this.presentToast("Please fill in all required fields.", 2000);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  forgotPassword() {
    console.log("Forgot password clicked");
    // Implement forgot password logic
  }

  signInWithGoogle() {
    console.log("Sign in with Google clicked");
    // Implement Google sign-in
  }

  signInWithApple() {
    console.log("Sign in with Apple clicked");
    // Implement Apple sign-in
  }

  joinNow() {
    this.router.navigate(["/signup"]);
  }
}
