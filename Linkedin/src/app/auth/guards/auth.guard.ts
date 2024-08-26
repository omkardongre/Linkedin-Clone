import { CanMatchFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject } from "@angular/core";
import { of, switchMap, take, tap } from "rxjs";

export const authGuard: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isUserLoggedIn.pipe(
    take(1),
    switchMap((isLoggedIn) => {
      if (!isLoggedIn) {
        return authService.isTokenInStorage().pipe(
          take(1),
          switchMap((isTokenInStorage) => {
            if (isTokenInStorage) {
              return of(true);
            }
            router.navigate(["/login"]);
            return of(false);
          }),
        );
      }
      return of(true);
    }),
  );
};
