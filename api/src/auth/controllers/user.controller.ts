import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
  Get,
  Response,
  Param,
  Put,
  Body,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../guards/jwt.guard';
import {
  isFileExtensionValid,
  removeFile,
  saveImageToStorage,
} from '../helpers/image-storage';
import { Observable, of } from 'rxjs';
import { UpdateResult } from 'typeorm';
import { join } from 'path';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user.interface';
import {
  FriendRequest,
  FriendRequestStatus,
} from '../models/friend-request.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', saveImageToStorage))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ): Observable<{ modifiedFileName: string } | { error: string }> {
    const filename = file?.filename;
    if (!filename) {
      return of({ error: 'No file uploaded' });
    }

    const imagesFolderPath = join(process.cwd(), 'images');
    const fullImagePath = join(imagesFolderPath, filename);

    return isFileExtensionValid(fullImagePath).pipe(
      switchMap((isValid) => {
        if (!isValid) {
          removeFile(fullImagePath);
          return of({ error: 'File content does not match extension' });
        }
        return this.userService.updateUserByImage(req.user.id, filename).pipe(
          switchMap((updateResult: UpdateResult) => {
            if (updateResult.affected === 1) {
              return of({ modifiedFileName: filename });
            }
            removeFile(fullImagePath);
            return of({ error: 'User image update failed' });
          }),
        );
      }),
    );
  }

  @UseGuards(JwtGuard)
  @Get('image')
  findImage(@Request() req, @Response() res) {
    return this.userService.findImageNameByUserId(req.user.id).pipe(
      switchMap((imageName: string) => {
        return of(res.sendFile(imageName, { root: 'images' }));
      }),
    );
  }

  @UseGuards(JwtGuard)
  @Get('image-name')
  findUserImageName(@Request() req): Observable<{ imageName: string }> {
    return this.userService.findImageNameByUserId(req.user.id).pipe(
      switchMap((imageName: string) => {
        return of({ imageName });
      }),
    );
  }

  @UseGuards(JwtGuard)
  @Get(':userId')
  getUserById(@Param('userId') userId: string): Observable<User> {
    const userIdInt = parseInt(userId);
    return this.userService.findUserById(userIdInt);
  }

  @UseGuards(JwtGuard)
  @Post('friend-request/send/:receiverId')
  sendConnectionRequest(
    @Param('receiverId') receiverId: string,
    @Request() req,
  ): Observable<FriendRequest | { error: string }> {
    const receiverIdInt = parseInt(receiverId);
    return this.userService.sendFriendRequest(receiverIdInt, req.user);
  }


  @UseGuards(JwtGuard)
  @Get('friend-request/status/:receiverId')
  getFriendRequestStatus(
    @Param('receiverId') receiverId: string,
    @Request() req,
  ): Observable<FriendRequestStatus> {
    const receiverIdInt = parseInt(receiverId);

    return this.userService.getFriendRequestStatus(receiverIdInt, req.user);
  }

  @UseGuards(JwtGuard)
  @Put('friend-request/response/:friendRequestId')
  respondToFriendRequest(
    @Param('friendRequestId') friendRequestId: string,
    @Body() statusResponse: FriendRequestStatus,
  ): Observable<FriendRequestStatus> {
    const friendRequestIdInt = parseInt(friendRequestId);
    return this.userService.respondToFriendRequest(
      friendRequestIdInt,
      statusResponse.status,
    );
  }

  @UseGuards(JwtGuard)
  @Get('friend-request/me/received-requests')
  getFriendRequestsFromRecipients(@Request() req): Observable<FriendRequest[]> {
    return this.userService.getFriendRequestsFromRecipients(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('friend-request/:user1Id/:user2Id')
  getConnectionRequest(
    @Param('user1Id') user1Id: string,
    @Param('user2Id') user2Id: string,
  ): Observable<FriendRequest> {
    const user1IdInt = parseInt(user1Id);
    const user2IdInt = parseInt(user2Id);
    return this.userService.findFriendRequest(user1IdInt, user2IdInt);
  }
}
