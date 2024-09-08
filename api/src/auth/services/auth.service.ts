import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { from, map, Observable, switchMap, catchError, of } from 'rxjs';
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
    return from(
      this.userRepository.findOne({ where: { email: user.email } }),
    ).pipe(
      switchMap((existingUser: User) => {
        if (existingUser) {
          return handleError(HttpStatus.CONFLICT, 'User already exists');
        }
        return this.hashPassword(user.password);
      }),
      switchMap((hashedPassword: string) => {
        const newUser = { ...user, password: hashedPassword };
        return from(this.userRepository.save(newUser));
      }),
      map((savedUser: User) => {
        delete savedUser.password;
        return savedUser;
      }),
      catchError((error) => {
        if (error instanceof HttpException) {
          return handleError(error.getStatus(), error.message);
        }
        return handleError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred',
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
          return handleError(HttpStatus.NOT_FOUND, 'Email not found');
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
