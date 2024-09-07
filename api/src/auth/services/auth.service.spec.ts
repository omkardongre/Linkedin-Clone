import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { JwtService } from '@nestjs/jwt';
import { of, throwError } from 'rxjs';
import { HttpStatus, HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepositoryMock: any;
  let jwtServiceMock: any;

  const mockUser: any = {
    id: 1,
    email: 'test@example.com',
    password: 'password',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
  };

  beforeEach(async () => {
    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('hashPassword', () => {
    it('should hash the password', (done) => {
      const password = 'password';
      const hashedPassword = 'hashedPassword';

      jest
        .spyOn(authService, 'hashPassword')
        .mockReturnValue(of(hashedPassword));

      authService.hashPassword(password).subscribe({
        next: (result) => {
          expect(result).toEqual(hashedPassword);
          done();
        },
      });
    });

    it('should handle password hashing failure', (done) => {
      const password = 'password';

      jest
        .spyOn(authService, 'hashPassword')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException(
                'Password hashing failed',
                HttpStatus.INTERNAL_SERVER_ERROR,
              ),
          ),
        );

      authService.hashPassword(password).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          expect(error.message).toBe('Password hashing failed');
          done();
        },
      });
    });
  });

  describe('registerAccount', () => {
    it('should register a new account', (done) => {
      const hashedPassword = 'hashedPassword';

      jest
        .spyOn(authService, 'hashPassword')
        .mockReturnValue(of(hashedPassword));
      jest.spyOn(userRepositoryMock, 'save').mockReturnValue(of(mockUser));

      authService.registerAccount(mockUser).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUser);
          expect(userRepositoryMock.save).toHaveBeenCalledWith({
            ...mockUser,
            password: hashedPassword,
          });
          done();
        },
      });
    });

    it('should handle registration failure', (done) => {
      const hashedPassword = 'hashedPassword';

      jest
        .spyOn(authService, 'hashPassword')
        .mockReturnValue(of(hashedPassword));
      jest
        .spyOn(userRepositoryMock, 'save')
        .mockReturnValue(
          throwError(
            () =>
              new HttpException('Registration failed', HttpStatus.BAD_REQUEST),
          ),
        );

      authService.registerAccount(mockUser).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.BAD_REQUEST);
          expect(error.message).toBe('Registration failed');
          done();
        },
      });
    });
  });

  describe('validateUser', () => {
    it('should validate a user', (done) => {
      const password = 'password';

      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(mockUser));
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      authService.validateUser(mockUser.email, password).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUser);
          done();
        },
      });
    });

    it('should handle invalid credential', (done) => {
      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(null));

      authService.validateUser(mockUser.email, mockUser.password).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.NOT_FOUND);
          expect(error.message).toBe('Invalid Credential');
          done();
        },
      });
    });

    it('should handle invalid password', (done) => {
      jest.spyOn(userRepositoryMock, 'findOne').mockReturnValue(of(mockUser));
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      authService.validateUser(mockUser.email, mockUser.password).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.status).toBe(HttpStatus.UNAUTHORIZED);
          expect(error.message).toBe('Invalid password');
          done();
        },
      });
    });
  });

  describe('login', () => {
    it('should login a user and return a token', (done) => {
      const token = 'token';

      jest.spyOn(authService, 'validateUser').mockReturnValue(of(mockUser));
      jest.spyOn(jwtServiceMock, 'signAsync').mockReturnValue(of(token));

      authService.login(mockUser).subscribe({
        next: (result) => {
          expect(result).toEqual({ token });
          done();
        },
      });
    });
  });
});
