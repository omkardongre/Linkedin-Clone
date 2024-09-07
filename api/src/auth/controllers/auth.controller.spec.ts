import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.interface';
import { of } from 'rxjs';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'password',
  };

  const mockToken = { token: 'jwt-token' };

  const authMockService = {
    registerAccount: jest.fn().mockImplementation((user: User) => of(user)),
    login: jest.fn().mockImplementation(() => of(mockToken)),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authMockService,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authController = moduleRef.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should register a user', (done) => {
    authController.register(mockUser).subscribe((result) => {
      expect(result).toEqual(mockUser);
      done();
    });
  });

  it('should login a user', (done) => {
    authController.login(mockUser).subscribe((result) => {
      expect(result).toEqual(mockToken);
      done();
    });
  });
});
