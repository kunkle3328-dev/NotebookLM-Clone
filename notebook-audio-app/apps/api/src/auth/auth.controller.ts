import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

class CreateTokenDto {
  deviceId?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('token')
  @ApiOperation({ summary: 'Create device token' })
  async createToken(@Body() dto: CreateTokenDto, @Headers('x-device-id') headerDeviceId: string) {
    const result = await this.authService.createDeviceToken(dto.deviceId || headerDeviceId);
    return {
      success: true,
      data: result,
    };
  }
}
