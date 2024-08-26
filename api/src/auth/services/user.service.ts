import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  catchError,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { User } from '../models/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import {
  FriendRequest,
  FriendRequest_Status,
  FriendRequestStatus,
} from '../models/friend-request.interface';
import { FriendRequestEntity } from '../models/friend-request.entity';

@Injectable()
export class UserService {
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
      map((friendRequest: FriendRequest) => {
        if (!friendRequest) {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              error: 'Friend request not found',
            },
            HttpStatus.NOT_FOUND,
          );
        }
        return friendRequest;
      }),
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Friend request retrieval failed',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FriendRequestEntity)
    private readonly friendRequestRepository: Repository<FriendRequestEntity>,
  ) {}

  findUserById(id: number): Observable<User> {
    return from(
      this.userRepository.findOne({
        where: { id },
      }),
    ).pipe(
      map((user: User) => {
        if (!user) {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              error: 'User not found',
            },
            HttpStatus.NOT_FOUND,
          );
        }
        return user;
      }),
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'User retrieval failed',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }

  updateUserByImage(id: number, imagePath: string): Observable<UpdateResult> {
    return from(
      this.userRepository.update(id, {
        imagePath,
      }),
    ).pipe(
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'User image update failed',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
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
      switchMap((response) => {
        if (!response) return of('');
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
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Friend request retrieval failed',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }

  sendFriendRequest(
    receiverIdInt: number,
    creator: User,
  ): Observable<FriendRequest | { error: string }> {
    if (receiverIdInt === creator.id) {
      return throwError(
        () =>
          new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              error: 'Cannot send request to self',
            },
            HttpStatus.BAD_REQUEST,
          ),
      );
    }

    return this.findUserById(receiverIdInt).pipe(
      switchMap((receiver: User) => {
        return this.hasRequestBeenSentOrReceived(creator, receiver).pipe(
          switchMap((hasRequestBeenSentOrReceived: boolean) => {
            if (hasRequestBeenSentOrReceived) {
              return of({ error: 'Request already sent or received' });
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
              return of({ status: 'NOT-SENT' as FriendRequest_Status });
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
      map(() => {
        return { status: statusResponse };
      }),
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Friend request response failed',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
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
}
