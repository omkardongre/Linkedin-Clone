import { User } from "src/app/auth/models/user.model";

export type FriendRequest_Status =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "NOT-SENT"
  | "WAITING-FOR-APPROVAL";

export type FriendRequestResponse = "ACCEPTED" | "DECLINED";

export interface FriendRequestStatus {
  status: FriendRequest_Status;
}

export interface FriendRequest {
  id?: number;
  creator?: User;
  receiver?: User;
  status?: FriendRequest_Status;
}
