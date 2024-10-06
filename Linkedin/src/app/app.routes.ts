import { Routes } from "@angular/router";
import { authGuard } from "./auth/guards/auth.guard";
import { UserProfileComponent } from "./home/components/user-profile/user-profile.component";
import { ConnectionProfileComponent } from "./home/components/connection-profile/connection-profile.component";
import { ChatComponent } from "./home/components/chat/chat.component";

export const routes: Routes = [
  {
    path: "home",
    loadComponent: () => import("./home/home.page").then((m) => m.HomePage),
    canMatch: [authGuard],
    children: [
      {
        path: "",
        component: UserProfileComponent,
      },
      {
        path: ":id",
        component: ConnectionProfileComponent,
      },
      {
        path: "chat/connections",
        component: ChatComponent,
      },
    ],
  },
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
  {
    path: "login",
    loadComponent: () =>
      import("./auth/components/signin/signin.page").then((m) => m.SigninPage),
  },
  {
    path: "signup",
    loadComponent: () =>
      import("./auth/components/signup/signup.page").then((m) => m.SignupPage),
  },
  {
    path: "home/:id",
    loadComponent: () =>
      import(
        "./home/components/connection-profile/connection-profile.component"
      ).then((m) => m.ConnectionProfileComponent),
  },
];
