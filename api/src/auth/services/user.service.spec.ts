import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { UpdateResult } from 'typeorm';
import { FriendRequestEntity } from '../models/friend-request.entity';
import {
  FriendRequest,
  FriendRequest_Status,
} from '../models/friend-request.interface';
import { User } from '../models/user.interface';
import { UserEntity } from '../models/user.entity';
import { UserService } from './user.service';
import { Role } from '../models/role.enum';

describe('UserService', () => {
  let userService: UserService;
  let userRepositoryMock: any;
  let friendRequestRepositoryMock: any;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'password',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.USER,
  };

  beforeEach(async () => {
    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    friendRequestRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(FriendRequestEntity),
          useValue: friendRequestRepositoryMock,
        },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
  });

  describe('findFriendRequest', () => {
    it('should find a friend request', (done) => {
      const user1IdInt = 1;
      const user2IdInt = 2;
      const friendRequest: FriendRequest = {
        id: 1,
        creator: mockUser,
        receiver: mockUser,
        status: 'PENDING',
      };

      jest
        .spyOn(friendRequestRepositoryMock, 'findOne')
        .mockReturnValue(of(friendRequest));

      userService.findFriendRequest(user1IdInt, user2IdInt).subscribe({
        next: (result) => {
          expect(result).toEqual(friendRequest);
          done();
        },
      });
    });

    it('should handle friend request not found', (done) => {
      const user1IdInt = 1;
      const user2IdInt = 2;

      jest
        .spyOn(friendRequestRepositoryMock, 'findOne')
        .mockReturnValue(of(null));

      userService.findFriendRequest(user1IdInt, user2IdInt).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.NOT_FOUND);
          expect(error.message).toBe('Friend request not found');
          done();
        },
      });
    });
  });

  describe('findUserById', () => {
    it('should find a user by id', (done) => {
      const id = 1;

      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(mockUser));

      userService.findUserById(id).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUser);
          done();
        },
      });
    });

    it('should handle user not found', (done) => {
      const id = 1;

      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(null));

      userService.findUserById(id).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.NOT_FOUND);
          expect(error.message).toBe('User not found');
          done();
        },
      });
    });
  });

  describe('updateUserByImage', () => {
    it('should update user image', (done) => {
      const id = 1;
      const imagePath = 'image.jpg';
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      jest
        .spyOn(userRepositoryMock, 'update')
        .mockReturnValue(of(updateResult));

      userService.updateUserByImage(id, imagePath).subscribe({
        next: (result) => {
          expect(result).toEqual({ modifiedFileName: imagePath });
          done();
        },
      });
    });

    it('should handle failed user image update', (done) => {
      const id = 1;
      const imagePath = 'image.jpg';
      const updateResult: UpdateResult = {
        affected: 0,
        raw: {},
        generatedMaps: [],
      };

      jest
        .spyOn(userRepositoryMock, 'update')
        .mockReturnValue(of(updateResult));

      userService.updateUserByImage(id, imagePath).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          expect(error.message).toBe('Failed to update user image');
          done();
        },
      });
    });
  });

  describe('findImageNameByUserId', () => {
    it('should find image name by user id', (done) => {
      const id = 1;
      const response = {
        imagePath: 'image.jpg',
      };

      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(response));

      userService.findImageNameByUserId(id).subscribe({
        next: (result) => {
          expect(result).toBe(response.imagePath);
          done();
        },
      });
    });

    it('should return default image name if user not found', (done) => {
      const id = 1;

      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(null));

      userService.findImageNameByUserId(id).subscribe({
        next: (result) => {
          expect(result).toBe('blank-profile-picture.png');
          done();
        },
      });
    });
  });

  describe('hasRequestBeenSentOrReceived', () => {
    it('should check if request has been sent or received', (done) => {
      const creator: User = {
        id: 1,
        email: 'creator@example.com',
        password: 'password',
        firstName: 'Creator',
        lastName: 'User',
        role: Role.USER,
      };
      const receiver: User = {
        id: 2,
        email: 'receiver@example.com',
        password: 'password',
        firstName: 'Receiver',
        lastName: 'User',
        role: Role.USER,
      };
      const friendRequest: FriendRequest = {
        id: 1,
        creator,
        receiver,
        status: 'PENDING',
      };

      jest
        .spyOn(friendRequestRepositoryMock, 'findOne')
        .mockReturnValue(of(friendRequest));

      userService.hasRequestBeenSentOrReceived(creator, receiver).subscribe({
        next: (result) => {
          expect(result).toBe(true);
          done();
        },
      });
    });

    it('should check if request has not been sent or received', (done) => {
      const creator: User = {
        id: 1,
        email: 'creator@example.com',
        password: 'password',
        firstName: 'Creator',
        lastName: 'User',
        role: Role.USER,
      };
      const receiver: User = {
        id: 2,
        email: 'receiver@example.com',
        password: 'password',
        firstName: 'Receiver',
        lastName: 'User',
        role: Role.USER,
      };

      jest
        .spyOn(friendRequestRepositoryMock, 'findOne')
        .mockReturnValue(of(null));

      userService.hasRequestBeenSentOrReceived(creator, receiver).subscribe({
        next: (result) => {
          expect(result).toBe(false);
          done();
        },
      });
    });
  });

  describe('sendFriendRequest', () => {
    it('should send a friend request', (done) => {
      const receiverIdInt = 2;
      const creator: User = {
        id: 1,
        email: 'creator@example.com',
        password: 'password',
        firstName: 'Creator',
        lastName: 'User',
        role: Role.USER,
      };
      const receiver: User = {
        id: receiverIdInt,
        email: 'receiver@example.com',
        password: 'password',
        firstName: 'Receiver',
        lastName: 'User',
        role: Role.USER,
      };
      const friendRequest: FriendRequest = {
        id: 1,
        creator,
        receiver,
        status: 'PENDING',
      };

      jest.spyOn(userService, 'findUserById').mockReturnValue(of(receiver));
      jest
        .spyOn(userService, 'hasRequestBeenSentOrReceived')
        .mockReturnValue(of(false));
      jest
        .spyOn(friendRequestRepositoryMock, 'save')
        .mockReturnValue(of(friendRequest));

      userService.sendFriendRequest(receiverIdInt, creator).subscribe({
        next: (result) => {
          expect(result).toEqual(friendRequest);
          done();
        },
      });
    });

    it('should handle sending friend request to self', (done) => {
      const receiverIdInt = 1;
      const creator: User = {
        id: receiverIdInt,
        email: 'creator@example.com',
        password: 'password',
        firstName: 'Creator',
        lastName: 'User',
        role: Role.USER,
      };

      userService.sendFriendRequest(receiverIdInt, creator).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.BAD_REQUEST);
          expect(error.message).toBe('Cannot send request to self');
          done();
        },
      });
    });

    it('should handle already sent or received friend request', (done) => {
      const receiverIdInt = 2;
      const creator: User = {
        id: 1,
        email: 'creator@example.com',
        password: 'password',
        firstName: 'Creator',
        lastName: 'User',
        role: Role.USER,
      };
      const receiver: User = {
        id: receiverIdInt,
        email: 'receiver@example.com',
        password: 'password',
        firstName: 'Receiver',
        lastName: 'User',
        role: Role.USER,
      };

      jest.spyOn(userService, 'findUserById').mockReturnValue(of(receiver));
      jest
        .spyOn(userService, 'hasRequestBeenSentOrReceived')
        .mockReturnValue(of(true));

      userService.sendFriendRequest(receiverIdInt, creator).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.BAD_REQUEST);
          expect(error.message).toBe('Friend request already sent or received');
          done();
        },
      });
    });
  });

  describe('getFriendRequestStatus', () => {
    it('should get friend request status', (done) => {
      const receiverId = 2;
      const user: User = {
        id: 1,
        email: 'user@example.com',
        password: 'password',
        firstName: 'User',
        lastName: 'User',
        role: Role.USER,
      };
      const receiver: User = {
        id: receiverId,
        email: 'receiver@example.com',
        password: 'password',
        firstName: 'Receiver',
        lastName: 'User',
        role: Role.USER,
      };
      const friendRequest: FriendRequest = {
        id: 1,
        creator: user,
        receiver,
        status: 'PENDING',
      };

      jest.spyOn(userService, 'findUserById').mockReturnValue(of(receiver));
      jest
        .spyOn(friendRequestRepositoryMock, 'findOne')
        .mockReturnValue(of(friendRequest));

      userService.getFriendRequestStatus(receiverId, user).subscribe({
        next: (result) => {
          expect(result).toEqual({ status: 'PENDING' });
          done();
        },
      });
    });

    it('should handle friend request not found', (done) => {
      const receiverId = 2;
      const user: User = {
        id: 1,
        email: 'user@example.com',
        password: 'password',
        firstName: 'User',
        lastName: 'User',
        role: Role.USER,
      };
      const receiver: User = {
        id: receiverId,
        email: 'receiver@example.com',
        password: 'password',
        firstName: 'Receiver',
        lastName: 'User',
        role: Role.USER,
      };

      jest.spyOn(userService, 'findUserById').mockReturnValue(of(receiver));
      jest
        .spyOn(friendRequestRepositoryMock, 'findOne')
        .mockReturnValue(of(null));

      userService.getFriendRequestStatus(receiverId, user).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.NOT_FOUND);
          expect(error.message).toBe('Friend request not found');
          done();
        },
      });
    });
  });

  describe('respondToFriendRequest', () => {
    it('should respond to friend request', (done) => {
      const friendRequestId = 1;
      const statusResponse: FriendRequest_Status = 'ACCEPTED';
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      jest
        .spyOn(friendRequestRepositoryMock, 'update')
        .mockReturnValue(of(updateResult));

      userService
        .respondToFriendRequest(friendRequestId, statusResponse)
        .subscribe({
          next: (result) => {
            expect(result).toEqual({ status: statusResponse });
            done();
          },
        });
    });

    it('should handle friend request not found', (done) => {
      const friendRequestId = 1;
      const statusResponse: FriendRequest_Status = 'ACCEPTED';
      const updateResult: UpdateResult = {
        affected: 0,
        raw: {},
        generatedMaps: [],
      };

      jest
        .spyOn(friendRequestRepositoryMock, 'update')
        .mockReturnValue(of(updateResult));

      userService
        .respondToFriendRequest(friendRequestId, statusResponse)
        .subscribe({
          next: () => {},
          error: (error) => {
            expect(error.status).toBe(HttpStatus.NOT_FOUND);
            expect(error.message).toBe('Friend request not found');
            done();
          },
        });
    });
  });

  describe('getFriendRequestsFromRecipients', () => {
    it('should get friend requests from recipients', (done) => {
      const user: User = {
        id: 1,
        email: 'user@example.com',
        password: 'password',
        firstName: 'User',
        lastName: 'User',
        role: Role.USER,
      };
      const friendRequests: FriendRequest[] = [
        {
          id: 1,
          creator: mockUser,
          receiver: user,
          status: 'PENDING',
        },
        {
          id: 2,
          creator: user,
          receiver: mockUser,
          status: 'ACCEPTED',
        },
      ];

      const friendRequestReceived = friendRequests.filter(
        (request) => request.receiver.id === user.id,
      );

      jest
        .spyOn(friendRequestRepositoryMock, 'find')
        .mockReturnValue(of(friendRequestReceived));

      userService.getFriendRequestsFromRecipients(user).subscribe({
        next: (result) => {
          expect(result).toEqual(friendRequestReceived);
          done();
        },
      });
    });
  });
});
