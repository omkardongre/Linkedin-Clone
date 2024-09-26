import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { PostService } from "./post.service";
import { AuthService } from "src/app/auth/services/auth.service";
import { ErrorHandlerService } from "src/app/core/error.handler.service";
import { Post } from "../components/models/Post";
import { Observable, of, throwError } from "rxjs";
import { environment } from "src/environments/environment.prod";
import { HttpErrorResponse } from "@angular/common/http";
import { User } from "src/app/auth/models/user.model";

describe("PostService", () => {
  let service: PostService;
  let httpMock: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockErrorHandlerService: jasmine.SpyObj<ErrorHandlerService>;

  const mockUser: User = {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "",
    role: "user",
    imagePath: "",
    posts: [],
  };

  const mockPost: Post = {
    id: 1,
    body: "Post 1",
    createdAt: new Date(),
    fullImagePath: "",
    author: mockUser,
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj("AuthService", {
      getUserImageName: of({ imageName: "test-image.png" }), // Mocking observable return
      updateUserImagePath: of(void 0), // Mocking the update method
    });

    const errorHandlerSpy = jasmine.createSpyObj("ErrorHandlerService", [
      "handleError",
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PostService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    });

    service = TestBed.inject(PostService);
    httpMock = TestBed.inject(HttpTestingController);
    mockAuthService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
    mockErrorHandlerService = TestBed.inject(
      ErrorHandlerService,
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  afterEach(() => {
    httpMock.verify(); // Verifies that no unmatched requests are outstanding
  });

  describe("getSelectedPosts", () => {
    it("should return an array of posts", () => {
      const dummyPosts: Post[] = [mockPost];

      service.getSelectedPosts("?limit=2").subscribe((posts) => {
        expect(posts.length).toBe(1);
        expect(posts).toEqual(dummyPosts);
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed?limit=2`);
      expect(req.request.method).toBe("GET");
      req.flush(dummyPosts); // Return mock data
    });

    it("should throw an error when no posts are found", () => {
      mockErrorHandlerService.handleError.and.returnValue(() =>
        throwError(() => new Error("No posts found")),
      );
      service.getSelectedPosts("?limit=0").subscribe({
        next: () => {
          return fail("No posts found");
        },
        error: (error) => {
          expect(error.message).toBe("No posts found");
        },
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed?limit=0`);
      expect(req.request.method).toBe("GET");
      req.flush([]);
    });
  });

  describe("createPost", () => {
    it("should create and return a new post", () => {
      service.createPost("New post").subscribe((post) => {
        expect(post).toEqual(mockPost);
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed`);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({ body: "New post" });
      req.flush(mockPost); // Return mock post
    });

    it("should handle error if post creation fails", () => {
      mockErrorHandlerService.handleError.and.callFake((operation: string) => {
        return (error: any) =>
          throwError(() => new Error(`Failed to ${operation}`));
      });

      service.createPost("New post").subscribe({
        next: () => fail("expected an error"),
        error: (error) => {
          expect(error.message).toBe("Failed to createPost");
        },
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed`);
      req.flush("Error", { status: 500, statusText: "Server Error" }); // Simulate server error
    });
  });

  describe("updatePost", () => {
    it("should update and return the post", () => {
      const updatedPost: Post = { ...mockPost, body: "Updated post" };

      service.updatePost(1, "Updated post").subscribe((post) => {
        expect(post).toEqual(updatedPost);
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed/1`);
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual({ body: "Updated post" });
      req.flush(updatedPost); // Return mock updated post
    });

    it("should handle error if post update fails", () => {
      mockErrorHandlerService.handleError.and.callFake((operation: string) => {
        return (error: any) =>
          throwError(() => new Error(`Failed to ${operation}`));
      });

      service.updatePost(1, "Updated post").subscribe({
        next: () => fail("expected an error"),
        error: (error) => {
          expect(error.message).toBe("Failed to updatePost");
        },
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed/1`);
      req.flush("Error", { status: 500, statusText: "Server Error" });
    });
  });

  describe("deletePost", () => {
    it("should delete the post and return void", () => {
      service.deletePost(1).subscribe((result) => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed/1`);
      expect(req.request.method).toBe("DELETE");
      req.flush(null);
    });

    it("should handle error if post deletion fails", () => {
      mockErrorHandlerService.handleError.and.callFake((operation: string) => {
        return (error: any) =>
          throwError(() => new Error(`Failed to ${operation}`));
      });

      service.deletePost(1).subscribe({
        next: () => fail("expected an error"),
        error: (error) => {
          expect(error.message).toBe("Failed to deletePost");
        },
      });

      const req = httpMock.expectOne(`${environment.baseApiUrl}/feed/1`);
      req.flush("Error", { status: 500, statusText: "Server Error" });
    });
  });
});
