/**
 * Module racine de l'API FACAM ACADEMIA.
 * Importe les modules métier (auth, users, formations, quiz, etc.) et le core.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CoreModule } from './core/core.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FormationsModule } from './formations/formations.module';
import { CoursesModule } from './courses/courses.module';
import { ChapitresModule } from './chapitres/chapitres.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { QuizModule } from './quiz/quiz.module';
import { GradesModule } from './grades/grades.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DiscussionsModule } from './discussions/discussions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CoreModule,
    EmailModule,
    AuthModule,
    UsersModule,
    FormationsModule,
    CoursesModule,
    ChapitresModule,
    EnrollmentsModule,
    QuizModule,
    GradesModule,
    CertificatesModule,
    ReviewsModule,
    DiscussionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
