import { TestBed } from "@angular/core/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import { AuthService } from "./auth.service";
import { User, Role } from "../models/user.model";
import { NewUser } from "../models/newUser.model";
import { environment } from "src/environments/environment.prod";
import { Preferences } from "@capacitor/preferences";
import { ErrorHandlerService } from "src/app/core/error.handler.service";
import { of, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";

describe("AuthService", () => {
  let service: AuthService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let errorHandlerServiceSpy: jasmine.SpyObj<ErrorHandlerService>;

  let mockUser: User = {
    id: 1,
    role: "user",
    firstName: "John",
    lastName: "Doe",
    imagePath: "image.png",
    posts: [],
    email: "John@gmail.com",
  };

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj("HttpClient", ["post", "get"]);
    const errorHandlerSpy = jasmine.createSpyObj("ErrorHandlerService", [
      "handleError",
      "presentSuccessToast",
    ]);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    errorHandlerServiceSpy = TestBed.inject(
      ErrorHandlerService,
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  afterEach(() => {
    httpClientSpy.post.calls.reset();
    httpClientSpy.get.calls.reset();
  });

  it("should return true if user is logged in", (done: DoneFn) => {
    service["$user"].next(mockUser);
    service.isUserLoggedIn.subscribe((isLoggedIn) => {
      expect(isLoggedIn).toBeTrue();
      done();
    });
  });

  it("should return false if user is not logged in", (done: DoneFn) => {
    service["$user"].next(null);
    service.isUserLoggedIn.subscribe((isLoggedIn) => {
      expect(isLoggedIn).toBeFalse();
      done();
    });
  });

  it("should return the correct user role", (done: DoneFn) => {
    service["$user"].next(mockUser);
    service.userRole.subscribe((role) => {
      expect(role).toBe(mockUser.role);
      done();
    });
  });

  it("should return the correct user ID", (done: DoneFn) => {
    service["$user"].next(mockUser);
    service.userId.subscribe((id) => {
      expect(id).toBe(mockUser.id);
      done();
    });
  });

  it("should return the correct user full name", (done: DoneFn) => {
    service["$user"].next(mockUser);
    service.userFullName.subscribe((fullName) => {
      expect(fullName).toBe("John Doe");
      done();
    });
  });

  it("should set user on successful registration", (done: DoneFn) => {
    httpClientSpy.post.and.returnValue(of(mockUser));

    service
      .register({
        email: "test@example.com",
        password: "password",
        firstName: "John",
        lastName: "Doe",
      })
      .subscribe(() => {
        expect(service["$user"].value).toEqual(mockUser);
        done();
      });
  });

  it("should clear user and token on logout", () => {
    service["$user"].next(mockUser);
    spyOn(Preferences, "remove").and.returnValue(Promise.resolve());

    service.logout();

    expect(service["$user"].value).toBeNull();
    // TODO: Find a way to spy on Preferences.remove
    // expect(Preferences.remove).toHaveBeenCalledWith({ key: "token" });
  });

  it("should return the correct full image path based on image name", () => {
    const imageName = "image.png";
    const fullImagePath = service.getFullImagePath(imageName);
    expect(fullImagePath).toBe(
      `${environment.baseApiUrl}/feed/image/${imageName}`,
    );
  });

  it("should fetch the correct image name", (done: DoneFn) => {
    const imageName = "image.png";
    httpClientSpy.get.and.returnValue(of({ imageName }));

    service.getUserImageName().subscribe((response) => {
      expect(response.imageName).toBe(imageName);
      done();
    });
  });

  it("should update the user image path correctly", (done: DoneFn) => {
    service["$user"].next(mockUser);

    service.updateUserImagePath("new-image.png").subscribe(() => {
      expect(service["$user"].value?.imagePath).toBe("new-image.png");
      done();
    });
  });

  it("should upload the user image correctly", (done: DoneFn) => {
    const formData = new FormData();
    const modifiedFileName = "new-profile.jpg";
    httpClientSpy.post.and.returnValue(of({ modifiedFileName }));

    service.uploadUserImage(formData).subscribe((response) => {
      expect(response.modifiedFileName).toBe(modifiedFileName);
      done();
    });
  });

  // it("should return the correct user full image path", (done: DoneFn) => {
  //   service["$user"].next(mockUser);

  //   service.userFullImagePath.subscribe((fullImagePath) => {
  //     expect(fullImagePath).toBe(
  //       `${environment.baseApiUrl}/feed/image/image.png`,
  //     );
  //     done();
  //   });
  // });

  // TODO: Add test for login and find way to mock jwtDecode
});
