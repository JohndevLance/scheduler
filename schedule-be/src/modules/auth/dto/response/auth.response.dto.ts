import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../../users/dto/response/user.response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (valid 15 min)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (valid 7 days)' })
  refreshToken: string;

  @ApiProperty({
    example: 900,
    description: 'Access token lifetime in seconds',
  })
  expiresIn: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;
}
