import { TestBed } from "@angular/core/testing";
import {
  HttpRequest,
  HttpEvent,
  HttpHandlerFn,
  HttpResponse,
} from "@angular/common/http";
import { AuthInterceptorService } from "./auth-interceptor.service";
import { Observable, of, lastValueFrom } from "rxjs";

describe("AuthInterceptorService", () => {
  let interceptor: typeof AuthInterceptorService;
  let mockHttpHandler: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    mockHttpHandler = jasmine
      .createSpy("HttpHandlerFn")
      .and.returnValue(of(new HttpResponse()));

    TestBed.configureTestingModule({});
    interceptor = AuthInterceptorService;

    // Clear localStorage before each test
    localStorage.clear();
  });

  // TODO : Fix this test to spy
  // it("should add an Authorization header when token is present", async () => {
  //   const mockToken = "mock-token";
  //   localStorage.setItem("token", mockToken);

  //   const mockRequest = new HttpRequest("GET", "/api/data");
  //   console.log("Starting interceptor test with token");

  //   const mockPreferencesService = jasmine.createSpyObj("PreferencesService", [
  //     "getToken",
  //   ]);
  //   mockPreferencesService.getToken.and.returnValue(
  //     Promise.resolve({ value: "mock-token" }),
  //   );

  //   const result = interceptor(mockRequest, mockHttpHandler);

  //   await lastValueFrom(result).catch((error) => {
  //     console.error("Error in interceptor:", error);
  //     fail("Interceptor observable errored");
  //   });

  //   console.log("Interceptor observable completed");
  //   expect(mockHttpHandler).toHaveBeenCalled();
  //   const modifiedRequest: HttpRequest<any> =
  //     mockHttpHandler.calls.first().args[0];
  //   console.log("Modified request headers:", modifiedRequest.headers.keys());
  //   expect(modifiedRequest.headers.has("Authorization")).toBeTrue();
  //   expect(modifiedRequest.headers.get("Authorization")).toBe(
  //     "Bearer " + mockToken,
  //   );
  // });

  it("should not add an Authorization header when token is not present", async () => {
    const mockRequest = new HttpRequest("GET", "/api/data");
    const result = interceptor(mockRequest, mockHttpHandler);

    await lastValueFrom(result).catch((error) => {
      console.error("Error in interceptor:", error);
      fail("Interceptor observable errored");
    });

    expect(mockHttpHandler).toHaveBeenCalled();
    const modifiedRequest: HttpRequest<any> =
      mockHttpHandler.calls.first().args[0];
    expect(modifiedRequest.headers.has("Authorization")).toBeFalse();
  });
});
