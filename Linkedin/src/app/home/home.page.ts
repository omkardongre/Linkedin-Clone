import { Component } from "@angular/core";
import { HeaderComponent } from "./components/header/header.component";
import { IonicModule } from "@ionic/angular";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
  standalone: true,
  imports: [HeaderComponent, IonicModule],
})
export class HomePage {}
