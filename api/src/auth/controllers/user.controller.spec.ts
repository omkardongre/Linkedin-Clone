import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { JwtGuard } from '../guards/jwt.guard';
import { of } from 'rxjs';
import { HttpStatus } from '@nestjs/common';
import { Readable } from 'stream';
import * as imageStorage from '../helpers/image-storage';
import {
  FriendRequest,
  FriendRequestStatus,
} from '../models/friend-request.interface';
import { User } from '../models/user.interface';

jest.mock('../helpers/image-storage');

const mockUser: User = { id: 1, firstName: 'Test User' };
const mockFriend: User = { id: 2, firstName: 'Friend User' };
const mockFriendRequest: FriendRequest = {
  id: 1,
  creator: mockUser,
  receiver: mockFriend,
  status: 'PENDING',
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  const mockUserService = {
    updateUserByImage: jest
      .fn()
      .mockImplementation((userId: number, filename: string) =>
        of({ modifiedFileName: filename }),
      ),
    findImageNameByUserId: jest.fn().mockImplementation(() => of('test.jpg')),
    findUserById: jest
      .fn()
      .mockImplementation((userId: number) =>
        of({ id: userId, name: 'Test User' }),
      ),
    sendFriendRequest: jest
      .fn()
      .mockImplementation(() => of(mockFriendRequest)),
    getFriendRequestStatus: jest
      .fn()
      .mockImplementation(() => of({ status: 'PENDING' })),
    respondToFriendRequest: jest
      .fn()
      .mockImplementation((_, status: string) => of({ status })),
    getFriendRequestsFromRecipients: jest
      .fn()
      .mockImplementation(() => of([mockFriendRequest])),
    findFriendRequest: jest
      .fn()
      .mockImplementation(() => of(mockFriendRequest)),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    userService = moduleRef.get<UserService>(UserService);
    userController = moduleRef.get<UserController>(UserController);
  });

  describe('uploadImage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './uploads',
      filename: 'test.jpg',
      size: 0,
      stream: new Readable(),
      path: '',
      buffer: undefined,
    };
    const mockRequest = { user: { id: 1 } };

    it('should upload an image and return the modified file name', (done) => {
      jest
        .spyOn(imageStorage, 'isFileExtensionValid')
        .mockReturnValue(of(true));

      userController.uploadImage(mockFile, mockRequest).subscribe((result) => {
        expect(result).toEqual({ modifiedFileName: 'test.jpg' });
        expect(userService.updateUserByImage).toHaveBeenCalledWith(
          1,
          'test.jpg',
        );
        done();
      });
    });

    it('should handle error when no file is uploaded', (done) => {
      userController.uploadImage(null, mockRequest).subscribe(
        () => {},
        (error) => {
          expect(error.status).toBe(HttpStatus.BAD_REQUEST);
          expect(error.message).toBe('No file uploaded');
          done();
        },
      );
    });

    it('should handle invalid file extension', (done) => {
      jest
        .spyOn(imageStorage, 'isFileExtensionValid')
        .mockReturnValue(of(false));

      userController.uploadImage(mockFile, mockRequest).subscribe(
        () => {},
        (error) => {
          expect(error.status).toBe(HttpStatus.BAD_REQUEST);
          expect(error.message).toBe('File content does not match extension');
          done();
        },
      );
    });
  });

  describe('findUserImageName', () => {
    it('should find the image name for the user', (done) => {
      const mockRequest = { user: { id: 1 } };

      userController.findUserImageName(mockRequest).subscribe((result) => {
        expect(result).toEqual({ imageName: 'test.jpg' });
        expect(userService.findImageNameByUserId).toHaveBeenCalledWith(1);
        done();
      });
    });
  });

  describe('getUserById', () => {
    it('should get a user by ID', (done) => {
      const mockUserId = '1';

      userController.getUserById(mockUserId).subscribe((result) => {
        expect(result).toEqual({ id: 1, name: 'Test User' });
        expect(userService.findUserById).toHaveBeenCalledWith(1);
        done();
      });
    });
  });

  describe('sendConnectionRequest', () => {
    it('should send a connection request', (done) => {
      const mockReceiverId = '2';
      const mockRequest = { user: { id: 1 } };

      userController
        .sendConnectionRequest(mockReceiverId, mockRequest)
        .subscribe((result) => {
          expect(result).toEqual(mockFriendRequest);
          expect(userService.sendFriendRequest).toHaveBeenCalledWith(2, {
            id: 1,
          });
          done();
        });
    });
  });

  describe('getFriendRequestStatus', () => {
    it('should get the friend request status', (done) => {
      const mockReceiverId = '2';
      const mockRequest = { user: { id: 1 } };

      userController
        .getFriendRequestStatus(mockReceiverId, mockRequest)
        .subscribe((result) => {
          expect(result).toEqual({ status: 'PENDING' });
          expect(userService.getFriendRequestStatus).toHaveBeenCalledWith(2, {
            id: 1,
          });
          done();
        });
    });
  });

  describe('respondToFriendRequest', () => {
    it('should respond to a friend request', (done) => {
      const mockFriendRequestId = '1';
      const mockStatusResponse: FriendRequestStatus = { status: 'ACCEPTED' };

      userController
        .respondToFriendRequest(mockFriendRequestId, mockStatusResponse)
        .subscribe((result) => {
          expect(result).toEqual({ status: 'ACCEPTED' });
          expect(userService.respondToFriendRequest).toHaveBeenCalledWith(
            1,
            'ACCEPTED',
          );
          done();
        });
    });
  });

  describe('getFriendRequestsFromRecipients', () => {
    it('should get friend requests from recipients', (done) => {
      const mockRequest = { user: { id: 1 } };

      userController
        .getFriendRequestsFromRecipients(mockRequest)
        .subscribe((result) => {
          expect(result).toEqual([mockFriendRequest]);
          expect(
            userService.getFriendRequestsFromRecipients,
          ).toHaveBeenCalledWith({ id: 1 });
          done();
        });
    });
  });

  describe('getConnectionRequest', () => {
    it('should get a connection request', (done) => {
      const mockFriendId = '2';
      const mockRequest = { user: { id: 1 } };

      userController
        .getConnectionRequest(mockFriendId, mockRequest)
        .subscribe((result) => {
          expect(result).toEqual(mockFriendRequest);
          expect(userService.findFriendRequest).toHaveBeenCalledWith(
            mockRequest.user.id,
            parseInt(mockFriendId),
          );
          done();
        });
    });
  });
});
