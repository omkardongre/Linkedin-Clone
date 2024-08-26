import { CommonModule } from "@angular/common";
import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { Role } from "src/app/auth/models/user.model";
import { AuthService } from "src/app/auth/services/auth.service";
import filetypeinfo from "magic-bytes.js";
import { BehaviorSubject, Subscription, take } from "rxjs";

type ValidFileExtension = "png" | "jpg" | "jpeg";
type ValidMimeType = "image/png" | "image/jpg" | "image/jpeg";

@Component({
  selector: "app-profile-summary",
  templateUrl: "./profile-summary.component.html",
  styleUrls: ["./profile-summary.component.scss"],
  imports: [IonicModule, CommonModule],
  standalone: true,
})
export class ProfileSummaryComponent implements OnInit, OnDestroy {
  userRole: Role = "user";
  isWrapperHidden = false;
  isMobileView = false;
  form!: FormGroup;
  validFileExtensions: ValidFileExtension[] = ["png", "jpg", "jpeg"];
  validMimeTypes: ValidMimeType[] = ["image/png", "image/jpg", "image/jpeg"];

  userFullImagePath: string = "";
  private userImagePathSubscriptions!: Subscription;
  fullName$ = new BehaviorSubject<string>("");
  fullName = "";

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.form = new FormGroup({
      file: new FormControl(null),
    });
    this.checkScreenSize();
    this.authService.userRole.subscribe((role) => {
      this.userRole = role;
      this.setBackgroundColor();
    });
    this.authService.userFullName.pipe(take(1)).subscribe((fullName) => {
      this.fullName = fullName;
      this.fullName$.next(fullName);
    });

    this.userImagePathSubscriptions =
      this.authService.userFullImagePath.subscribe((imagePath: string) => {
        this.userFullImagePath = imagePath;
      });
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobileView = window.innerWidth < 768;
    this.isWrapperHidden = this.isMobileView;
  }

  toggleWrapper() {
    if (this.isMobileView) {
      this.isWrapperHidden = !this.isWrapperHidden;
    }
  }

  public setBackgroundColor(): string {
    switch (this.userRole) {
      case "admin":
        return "#f0d078";
      case "premium":
        return "#29d0ea";
      default:
        return "#a0b4b7";
    }
  }

  triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        this.detectFileType(arrayBuffer, file);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  private detectFileType(arrayBuffer: ArrayBuffer, file: File) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileType = filetypeinfo(uint8Array)[0];

    if (
      fileType &&
      this.validMimeTypes.includes(fileType.mime as ValidMimeType)
    ) {
      this.uploadFile(file);
    } else {
      console.error("Invalid file type");
    }
  }

  private uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    this.authService.uploadUserImage(formData).subscribe({
      next: (response) => {
        this.authService
          .updateUserImagePath(response.modifiedFileName)
          .subscribe();
      },
      error: (error) => {
        console.error("Error uploading file:", error);
      },
    });
  }

  ngOnDestroy() {
    this.userImagePathSubscriptions.unsubscribe();
  }
}
