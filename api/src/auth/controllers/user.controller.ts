import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
  Get,
  Param,
  Put,
  Body,
  HttpStatus,
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
import { join } from 'path';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user.interface';
import {
  FriendRequest,
  FriendRequestStatus,
} from '../models/friend-request.interface';
import { handleError } from 'src/core/error.utils';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', saveImageToStorage))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Observable<{ modifiedFileName: string }> {
    const filename = file?.filename;
    if (!filename) {
      return handleError(HttpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const imagesFolderPath = join(process.cwd(), 'images');
    const fullImagePath = join(imagesFolderPath, filename);

    return isFileExtensionValid(fullImagePath).pipe(
      switchMap((isValid: boolean) => {
        if (!isValid) {
          removeFile(fullImagePath);
          return handleError(
            HttpStatus.BAD_REQUEST,
            'File content does not match extension',
          );
        }
        return this.userService.updateUserByImage(req.user.id, filename);
      }),
    );
  }

  @UseGuards(JwtGuard)
  @Get('image-name')
  findUserImageName(@Request() req: any): Observable<{ imageName: string }> {
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
    @Request() req: any,
  ): Observable<FriendRequest> {
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
  getFriendRequestsFromRecipients(
    @Request() req: any,
  ): Observable<FriendRequest[]> {
    return this.userService.getFriendRequestsFromRecipients(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('friend-request/between/:friendId')
  getConnectionRequest(
    @Param('friendId') friendId: string,
    @Request() req: any,
  ): Observable<FriendRequest> {
    const friendIdInt = parseInt(friendId);
    return this.userService.findFriendRequest(req.user.id, friendIdInt);
  }
}
