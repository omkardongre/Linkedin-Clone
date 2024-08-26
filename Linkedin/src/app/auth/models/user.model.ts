import { Post } from "src/app/home/components/models/Post";

export type Role = "user" | "admin" | "premium";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  imagePath: string;
  posts: Post[];
}

export interface FriendRequestSender {
  id: number;
  firstName: string;
  lastName: string;
  fullImagePath: string;
}
