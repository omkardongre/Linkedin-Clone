import { Injectable } from "@angular/core";
import { Observable, of, tap } from "rxjs";
import { ToastController } from "@ionic/angular";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class ErrorHandlerService {
  constructor(private toastController: ToastController) {}

  async presentErrorToast(errorMessage: string) {
    const toast = await this.toastController.create({
      header: "Error occurred",
      message: errorMessage,
      duration: 2000,
      color: "danger",
      buttons: [
        {
          icon: "close",
          text: "dismiss",
          role: "cancel",
        },
      ],
    });
    toast.present();
  }

  async presentSuccessToast(successMessage: string) {
    const toast = await this.toastController.create({
      header: "Success",
      message: successMessage,
      duration: 2000,
      color: "success",
      buttons: [
        {
          icon: "close",
          text: "dismiss",
          role: "cancel",
        },
      ],
    });
    toast.present();
  }

  handleError<T>(operation = "operation", result?: T) {
    return (err: HttpErrorResponse): Observable<T> => {
      console.warn(`${operation} failed: ${err.error.message}`);
      return of(result as T).pipe(
        tap(() => {
          this.presentErrorToast(err.error.message);
        }),
      );
    };
  }
}
