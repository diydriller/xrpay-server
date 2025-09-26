import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EscrowService } from './escrow.service';
import { RegisterIOUEscrowDto } from './dto/register-iou-escrow.dto';
import { SettleIOUEscrowDto } from './dto/settle-iou-escrow.dto';

@Controller('')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('iou/escrow')
  async registerIOUEscrow(@Body() dto: RegisterIOUEscrowDto, @Req() req) {
    return this.escrowService.registerIOUEscrow(
      dto.amount,
      dto.currency,
      dto.receiverAddress,
      req.user.userId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('iou/escrow/finish')
  async settleIOUEscrow(@Body() dto: SettleIOUEscrowDto, @Req() req) {
    return this.escrowService.settleIOUEscrow(dto.escrowId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('iou/escrow')
  async getIOUEscrow(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req,
  ) {
    return await this.escrowService.getIOUEscrow(page, limit, req.user.userId);
  }
}
