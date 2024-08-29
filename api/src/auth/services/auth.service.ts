import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  from,
  map,
  Observable,
  switchMap,
  catchError,
  throwError,
  of,
} from 'rxjs';
import { hash } from 'bcrypt';
import { User } from '../models/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { handleError } from 'src/core/error.utils';

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
        return handleError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Password hashing failed',
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
            return handleError(HttpStatus.BAD_REQUEST, 'Registration failed');
          }),
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
          return handleError(HttpStatus.NOT_FOUND, 'Invalid Credential');
        }
        return from(bcrypt.compare(password, user.password)).pipe(
          switchMap((isValid: boolean) => {
            if (isValid) {
              delete user.password;
              return of(user);
            } else {
              return handleError(HttpStatus.UNAUTHORIZED, 'Invalid password');
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
