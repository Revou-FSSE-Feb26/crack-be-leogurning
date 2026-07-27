import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { UsersModule } from './modules/users/users.module';
import { SpecializationsModule } from './modules/specializations/specializations.module';
import { SessionTypesModule } from './modules/session-types/session-types.module';
import { CounselorsModule } from './modules/counselors/counselors.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      // {
      //   name: 'short',
      //   ttl: 1000, // 1 second
      //   limit: 3, // max 3 requests per second
      // },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        //limit: 100, // max 100 requests per minute
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    AppointmentsModule,
    UsersModule,
    SpecializationsModule,
    SessionTypesModule,
    CounselorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
