import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SignupPage } from "./signup.page";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { IonicModule, NavController } from "@ionic/angular";
import { AuthService } from "../../services/auth.service";
import { ErrorHandlerService } from "src/app/core/error.handler.service";
import { of, throwError } from "rxjs";
import { User } from "../../models/user.model";

describe("SignupPage", () => {
  let component: SignupPage;
  let fixture: ComponentFixture<SignupPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;
  let errorHandlerServiceSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj("AuthService", ["register", "login"]);
    const navCtrlSpyObj = jasmine.createSpyObj("NavController", [
      "navigateRoot",
      "navigateForward",
    ]);
    const errorHandlerSpy = jasmine.createSpyObj("ErrorHandlerService", [
      "handleError",
      "presentErrorToast",
    ]);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, IonicModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authSpy },
        { provide: NavController, useValue: navCtrlSpyObj },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupPage);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    navCtrlSpy = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    errorHandlerServiceSpy = TestBed.inject(
      ErrorHandlerService,
    ) as jasmine.SpyObj<ErrorHandlerService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize the signup form", () => {
    expect(component.signupForm).toBeDefined();
    expect(component.signupForm.contains("firstName")).toBeTruthy();
    expect(component.signupForm.contains("lastName")).toBeTruthy();
    expect(component.signupForm.contains("email")).toBeTruthy();
    expect(component.signupForm.contains("password")).toBeTruthy();
  });

  it("should make the firstName control required", () => {
    const control = component.signupForm.get("firstName");
    control?.setValue("");
    expect(control?.valid).toBeFalsy();
  });

  it("should require firstName to have at least 2 characters", () => {
    const control = component.signupForm.get("firstName");
    control?.setValue("A");
    expect(control?.valid).toBeFalsy();
    control?.setValue("AB");
    expect(control?.valid).toBeTruthy();
  });

  it("should make the lastName control required", () => {
    const control = component.signupForm.get("lastName");
    control?.setValue("");
    expect(control?.valid).toBeFalsy();
  });

  it("should require lastName to have at least 2 characters", () => {
    const control = component.signupForm.get("lastName");
    control?.setValue("A");
    expect(control?.valid).toBeFalsy();
    control?.setValue("AB");
    expect(control?.valid).toBeTruthy();
  });

  it("should make the email control required", () => {
    const control = component.signupForm.get("email");
    control?.setValue("");
    expect(control?.valid).toBeFalsy();
  });

  it("should require a valid email", () => {
    const control = component.signupForm.get("email");
    control?.setValue("invalid-email");
    expect(control?.valid).toBeFalsy();
    control?.setValue("valid@email.com");
    expect(control?.valid).toBeTruthy();
  });

  it("should make the password control required", () => {
    const control = component.signupForm.get("password");
    control?.setValue("");
    expect(control?.valid).toBeFalsy();
  });

  it("should require a password with at least 6 characters", () => {
    const control = component.signupForm.get("password");
    control?.setValue("12345");
    expect(control?.valid).toBeFalsy();
    control?.setValue("123456");
    expect(control?.valid).toBeTruthy();
  });

  it("should toggle password visibility", () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it("should call AuthService.register and login on successful form submission", () => {
    const mockUser: User = {
      id: 1,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "user",
      imagePath: "",
      posts: [],
    };
    authServiceSpy.register.and.returnValue(of(mockUser));
    authServiceSpy.login.and.returnValue(of({ token: "token" }));

    component.signupForm.setValue({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123",
    });

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith(jasmine.any(Object));
    expect(authServiceSpy.login).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );
    expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith("/home");
  });

  it("should show error message on invalid form submission", () => {
    component.onSubmit();
    expect(errorHandlerServiceSpy.presentErrorToast).toHaveBeenCalledWith(
      "Please fill in correct details",
    );
  });

  it("should navigate to signin page when goToSignIn is called", () => {
    component.goToSignIn();
    expect(navCtrlSpy.navigateForward).toHaveBeenCalledWith("/auth/signin");
  });

  it('should log "Continue with Google clicked" when continueWithGoogle is called', () => {
    spyOn(console, "log");
    component.continueWithGoogle();
    expect(console.log).toHaveBeenCalledWith("Continue with Google clicked");
  });

  it('should log "Get help clicked" when getHelp is called', () => {
    spyOn(console, "log");
    component.getHelp();
    expect(console.log).toHaveBeenCalledWith("Get help clicked");
  });
});
