import { TestBed } from "@angular/core/testing";
import { ErrorHandlerService } from "./error.handler.service";
import { ToastController } from "@ionic/angular";
import { HttpErrorResponse } from "@angular/common/http";

describe("ErrorHandlerService", () => {
  let service: ErrorHandlerService;
  let toastController: jasmine.SpyObj<ToastController>;

  beforeEach(() => {
    const toastControllerSpy = jasmine.createSpyObj("ToastController", [
      "create",
    ]);

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: ToastController, useValue: toastControllerSpy },
      ],
    });

    service = TestBed.inject(ErrorHandlerService);
    toastController = TestBed.inject(
      ToastController,
    ) as jasmine.SpyObj<ToastController>;
  });

  it("should handle error and present error toast", () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: "Test error" },
      status: 500,
      statusText: "Internal Server Error",
    });

    spyOn(service, "presentErrorToast");

    const handleError = service.handleError("test operation");
    handleError(errorResponse).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    expect(service.presentErrorToast).toHaveBeenCalledWith("Test error");
  });
});
