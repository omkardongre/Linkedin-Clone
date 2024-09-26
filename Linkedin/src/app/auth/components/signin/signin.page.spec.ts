import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SigninPage } from "./signin.page";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { IonicModule, ToastController } from "@ionic/angular";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { ErrorHandlerService } from "src/app/core/error.handler.service";
import { of, throwError } from "rxjs";

describe("SigninPage", () => {
  let component: SigninPage;
  let fixture: ComponentFixture<SigninPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let errorHandlerServiceSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj("AuthService", ["login"]);
    const routerSpyObj = jasmine.createSpyObj("Router", ["navigate"]);
    const toastSpy = jasmine.createSpyObj("ToastController", ["create"]);
    const errorHandlerSpy = jasmine.createSpyObj("ErrorHandlerService", [
      "presentErrorToast",
    ]);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, IonicModule],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ToastController, useValue: toastSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SigninPage);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    toastControllerSpy = TestBed.inject(
      ToastController,
    ) as jasmine.SpyObj<ToastController>;
    errorHandlerServiceSpy = TestBed.inject(
      ErrorHandlerService,
    ) as jasmine.SpyObj<ErrorHandlerService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize the signin form", () => {
    expect(component.signinForm).toBeDefined();
    expect(component.signinForm.contains("email")).toBeTruthy();
    expect(component.signinForm.contains("password")).toBeTruthy();
  });

  it("should make the email control required", () => {
    const control = component.signinForm.get("email");
    control?.setValue("");
    expect(control?.valid).toBeFalsy();
  });

  it("should make the password control required", () => {
    const control = component.signinForm.get("password");
    control?.setValue("");
    expect(control?.valid).toBeFalsy();
  });

  it("should require a valid email", () => {
    const control = component.signinForm.get("email");
    control?.setValue("invalid-email");
    expect(control?.valid).toBeFalsy();
  });

  it("should require a password with at least 6 characters", () => {
    const control = component.signinForm.get("password");
    control?.setValue("12345");
    expect(control?.valid).toBeFalsy();
  });

  it("should toggle password visibility", () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it("should call AuthService.login and navigate to home on successful login", () => {
    authServiceSpy.login.and.returnValue(of({ token: "token" }));
    component.signinForm.setValue({
      email: "test@example.com",
      password: "password123",
    });
    component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(["/home"]);
  });

  it("should show error message on invalid form submission", () => {
    component.onSubmit();
    expect(errorHandlerServiceSpy.presentErrorToast).toHaveBeenCalledWith(
      "Please fill in all required fields.",
    );
  });

  it("should navigate to signup page when joinNow is called", () => {
    component.joinNow();
    expect(routerSpy.navigate).toHaveBeenCalledWith(["/signup"]);
  });
});
