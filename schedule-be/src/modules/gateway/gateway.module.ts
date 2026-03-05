import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulingGateway } from './scheduling.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET') as string,
      }),
    }),
  ],
  providers: [SchedulingGateway],
  exports: [SchedulingGateway],
})
export class GatewayModule {}
