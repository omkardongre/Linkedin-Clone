import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { from, map, Observable, switchMap, catchError, throwError } from 'rxjs';
import { hash } from 'bcrypt';
import { User } from '../models/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  hashPassword(password: string): Observable<string> {
    return from(hash(password, 12)).pipe(
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: { message: 'Password hashing failed' },
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }

  registerAccount(user: User): Observable<User> {
    return this.hashPassword(user.password).pipe(
      switchMap((hashedPassword: string) => {
        return from(
          this.userRepository.save({
            ...user,
            password: hashedPassword,
          }),
        ).pipe(
          map((user: User) => {
            delete user.password;
            return user;
          }),
          catchError(() => {
            return throwError(
              () =>
                new HttpException(
                  {
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: 'Registration failed',
                  },
                  HttpStatus.BAD_REQUEST,
                ),
            );
          }),
        );
      }),
      catchError(() => {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Registration process failed',
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }

  validateUser(email: string, password: string): Observable<User> {
    return from(
      this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'password'],
      }),
    ).pipe(
      switchMap((user: User) => {
        if (!user) {
          return throwError(
            () =>
              new HttpException(
                {
                  statusCode: HttpStatus.NOT_FOUND,
                  error: 'Invalid Credential',
                },
                HttpStatus.NOT_FOUND,
              ),
          );
        }
        return from(bcrypt.compare(password, user.password)).pipe(
          map((isValid: boolean) => {
            if (isValid) {
              delete user.password;
              return user;
            } else {
              throw new HttpException(
                {
                  statusCode: HttpStatus.UNAUTHORIZED,
                  error: { message: 'Invalid password' },
                },
                HttpStatus.UNAUTHORIZED,
              );
            }
          }),
        );
      }),
    );
  }

  login(user: User): Observable<{ token: string }> {
    return this.validateUser(user.email, user.password).pipe(
      switchMap((user: User) => {
        return from(this.jwtService.signAsync({ user })).pipe(
          map((token: string) => {
            return { token };
          }),
        );
      }),
    );
  }
}
