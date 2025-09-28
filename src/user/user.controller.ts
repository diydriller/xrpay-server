import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTrustLineDto } from './dto/create-trustline.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('trustline')
  async createTrustLine(@Body() dto: CreateTrustLineDto, @Req() req) {
    return this.userService.createTrustLine(dto.currency, req.user.userId);
  }
}
