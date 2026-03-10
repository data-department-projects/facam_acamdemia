import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});
