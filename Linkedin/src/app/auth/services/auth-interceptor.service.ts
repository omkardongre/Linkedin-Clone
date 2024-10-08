import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { from, Observable, switchMap, take } from "rxjs";
import { Preferences } from "@capacitor/preferences";

export const AuthInterceptorService: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  return from(Preferences.get({ key: "token" })).pipe(
    take(1),
    switchMap((data) => {
      if (data.value) {
        const cloned = req.clone({
          headers: req.headers.set("Authorization", "Bearer " + data.value),
        });

        return next(cloned);
      } else {
        return next(req);
      }
    }),
  );
};
