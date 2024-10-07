import { HttpStatus, Injectable } from '@nestjs/common';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { User } from '../models/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { In, Repository, UpdateResult } from 'typeorm';
import {
  FriendRequest,
  FriendRequest_Status,
  FriendRequestStatus,
} from '../models/friend-request.interface';
import { FriendRequestEntity } from '../models/friend-request.entity';
import { handleError } from 'src/core/error.utils';
import { join } from 'node:path';
import { removeFile } from '../helpers/image-storage';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FriendRequestEntity)
    private readonly friendRequestRepository: Repository<FriendRequestEntity>,
  ) {}

  findFriendRequest(
    user1IdInt: number,
    user2IdInt: number,
  ): Observable<FriendRequest> {
    return from(
      this.friendRequestRepository.findOne({
        where: [
          { creator: { id: user1IdInt }, receiver: { id: user2IdInt } },
          { creator: { id: user2IdInt }, receiver: { id: user1IdInt } },
        ],
        relations: ['creator', 'receiver'],
      }),
    ).pipe(
      switchMap((friendRequest: FriendRequest) => {
        if (!friendRequest) {
          return handleError(HttpStatus.NOT_FOUND, 'Friend request not found');
        }
        return of(friendRequest);
      }),
    );
  }

  findUserById(id: number): Observable<User> {
    return from(
      this.userRepository.findOne({
        where: { id },
      }),
    ).pipe(
      switchMap((user: User) => {
        if (!user) {
          return handleError(HttpStatus.NOT_FOUND, 'User not found');
        }
        return of(user);
      }),
    );
  }

  updateUserByImage(
    id: number,
    imagePath: string,
  ): Observable<{ modifiedFileName: string }> {
    return from(
      this.userRepository.findOne({
        where: { id },
      }),
    ).pipe(
      switchMap((user: User) => {
        if (user.imagePath !== null) {
          const imagesFolderPath = join(process.cwd(), 'images');
          const fullImagePath = join(imagesFolderPath, user.imagePath);
          removeFile(fullImagePath);
        }
        return from(
          this.userRepository.update(id, {
            imagePath,
          }),
        ).pipe(
          switchMap((updateResult: UpdateResult) => {
            if (updateResult.affected === 1) {
              return of({ modifiedFileName: imagePath });
            }
            return handleError(
              HttpStatus.INTERNAL_SERVER_ERROR,
              'Failed to update user image',
            );
          }),
        );
      }),
    );
  }

  findImageNameByUserId(id: number): Observable<string> {
    return from(
      this.userRepository.findOne({
        select: ['imagePath'],
        where: { id },
      }),
    ).pipe(
      switchMap((response: { imagePath: string }) => {
        if (response === null) {
          return of('blank-profile-picture.png');
        }
        return of(response.imagePath);
      }),
    );
  }

  hasRequestBeenSentOrReceived(
    creator: User,
    receiver: User,
  ): Observable<boolean> {
    return from(
      this.friendRequestRepository.findOne({
        where: [
          { creator, receiver },
          { creator: receiver, receiver: creator },
        ],
      }),
    ).pipe(
      map((friendRequest: FriendRequest) => {
        return !!friendRequest;
      }),
    );
  }

  sendFriendRequest(
    receiverIdInt: number,
    creator: User,
  ): Observable<FriendRequest> {
    if (receiverIdInt === creator.id) {
      return handleError(HttpStatus.BAD_REQUEST, 'Cannot send request to self');
    }

    return this.findUserById(receiverIdInt).pipe(
      switchMap((receiver: User) => {
        return this.hasRequestBeenSentOrReceived(creator, receiver).pipe(
          switchMap((hasRequestBeenSentOrReceived: boolean) => {
            if (hasRequestBeenSentOrReceived) {
              return handleError(
                HttpStatus.BAD_REQUEST,
                'Friend request already sent or received',
              );
            }
            return from(
              this.friendRequestRepository.save({
                creator,
                receiver,
                status: 'PENDING',
              }),
            );
          }),
        );
      }),
    );
  }

  getFriendRequestStatus(
    receiverId: number,
    user: User,
  ): Observable<FriendRequestStatus> {
    return this.findUserById(receiverId).pipe(
      switchMap((receiver: User) => {
        return from(
          this.friendRequestRepository.findOne({
            where: [
              { creator: user, receiver },
              { creator: receiver, receiver: user },
            ],
            relations: ['creator', 'receiver'],
          }),
        ).pipe(
          switchMap((friendRequest: FriendRequest) => {
            if (!friendRequest) {
              return handleError(
                HttpStatus.NOT_FOUND,
                'Friend request not found',
              );
            }

            if (friendRequest.receiver?.id === user.id) {
              return of({
                status: 'WAITING-FOR-APPROVAL' as FriendRequest_Status,
              });
            }

            return of({ status: friendRequest.status });
          }),
        );
      }),
    );
  }

  respondToFriendRequest(
    friendRequestId: number,
    statusResponse: FriendRequest_Status,
  ): Observable<FriendRequestStatus> {
    return from(
      this.friendRequestRepository.update(friendRequestId, {
        status: statusResponse,
      }),
    ).pipe(
      switchMap((updateResult: UpdateResult) => {
        if (updateResult.affected === 1) {
          return of({ status: statusResponse });
        }
        return handleError(HttpStatus.NOT_FOUND, 'Friend request not found');
      }),
    );
  }

  getFriendRequestsFromRecipients(user: User): Observable<FriendRequest[]> {
    return from(
      this.friendRequestRepository.find({
        where: { receiver: user },
        relations: ['receiver', 'creator'],
      }),
    );
  }

  getFriends(user: User): Observable<User[]> {
    return from(
      this.friendRequestRepository.find({
        where: [
          { creator: user, status: 'ACCEPTED' },
          { receiver: user, status: 'ACCEPTED' },
        ],
        relations: ['creator', 'receiver'],
      }),
    ).pipe(
      switchMap((friendRequests: FriendRequest[]) => {
        const userIds: number[] = [];
        friendRequests.forEach((friendRequest: FriendRequest) => {
          if (friendRequest.creator.id !== user.id) {
            userIds.push(friendRequest.creator.id);
          } else if (friendRequest.receiver.id !== user.id) {
            userIds.push(friendRequest.receiver.id);
          }
        });

        return from(
          this.userRepository.findBy({
            id: In(userIds),
          }),
        );
      }),
    );
  }
}
