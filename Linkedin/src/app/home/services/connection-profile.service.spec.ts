import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { ConnectionProfileService } from "./connection-profile.service";
import { ErrorHandlerService } from "src/app/core/error.handler.service";
import { environment } from "src/environments/environment.prod";
import {
  FriendRequest,
  FriendRequestResponse,
  FriendRequestStatus,
} from "../components/models/FriendRequest";
import { User } from "src/app/auth/models/user.model";
import { of } from "rxjs";

describe("ConnectionProfileService", () => {
  let service: ConnectionProfileService;
  let httpMock: HttpTestingController;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj("ErrorHandlerService", [
      "handleError",
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConnectionProfileService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    });

    service = TestBed.inject(ConnectionProfileService);
    httpMock = TestBed.inject(HttpTestingController);
    errorHandlerService = TestBed.inject(
      ErrorHandlerService,
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should add a connection user", () => {
    const mockFriendRequest: FriendRequest = {
      id: 1,
    };
    const userId = 1;

    service.addConnectionUser(userId).subscribe((response) => {
      expect(response).toEqual(mockFriendRequest);
    });

    const req = httpMock.expectOne(
      `${environment.baseApiUrl}/user/friend-request/send/${userId}`,
    );
    expect(req.request.method).toBe("POST");
    req.flush(mockFriendRequest);
  });

  it("should get friend requests", () => {
    const mockFriendRequests: FriendRequest[] = [
      {
        id: 1,
      },
    ];

    service.getFriendRequests().subscribe((response) => {
      expect(response).toEqual(mockFriendRequests);
    });

    const req = httpMock.expectOne(
      `${environment.baseApiUrl}/user/friend-request/me/received-requests`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockFriendRequests);
  });

  it("should respond to a friend request", () => {
    const mockFriendRequestStatus: FriendRequestStatus = {
      status: "ACCEPTED",
    };
    const requestId = 1;
    const status: FriendRequestResponse = "ACCEPTED";

    service.responseToFriendRequest(requestId, status).subscribe((response) => {
      expect(response).toEqual(mockFriendRequestStatus);
    });

    const req = httpMock.expectOne(
      `${environment.baseApiUrl}/user/friend-request/response/${requestId}`,
    );
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual({ status });
    req.flush(mockFriendRequestStatus);
  });

  it("should get a friend request", () => {
    const mockFriendRequest: FriendRequest = {
      id: 1,
    };
    const friendId = 1;

    service.getFriendRequest(friendId).subscribe((response) => {
      expect(response).toEqual(mockFriendRequest);
    });

    const req = httpMock.expectOne(
      `${environment.baseApiUrl}/user/friend-request/between/${friendId}`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockFriendRequest);
  });
});
