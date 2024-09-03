import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { IonicModule, NavController } from "@ionic/angular";
import { AuthService } from "../../services/auth.service";
import { NewUser } from "../../models/newUser.model";
import { User } from "../../models/user.model";
import { ErrorHandlerService } from "src/app/core/error.handler.service";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.page.html",
  styleUrls: ["./signup.page.scss"],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class SignupPage implements OnInit {
  signupForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController,
    private authService: AuthService,
    private errorHandlerService: ErrorHandlerService,
  ) {
    this.signupForm = this.formBuilder.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.signupForm.valid) {
      const newUser: NewUser = this.signupForm.value;

      this.authService.register(newUser).subscribe((user: User) => {
        if (!user) {
          this.errorHandlerService.handleError<User>("register");
          return;
        }
        this.authService
          .login(newUser.email, newUser.password)
          .subscribe(() => {
            this.navCtrl.navigateRoot("/home");
          });
      });
    } else {
      this.errorHandlerService.presentErrorToast(
        "Please fill in correct details",
      );
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  continueWithGoogle() {
    console.log("Continue with Google clicked");
    // Implement Google sign-up
  }

  goToSignIn() {
    this.navCtrl.navigateForward("/auth/signin");
  }

  getHelp() {
    console.log("Get help clicked");
    // Implement help functionality or navigation
  }
}
