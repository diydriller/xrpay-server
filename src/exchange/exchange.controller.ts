import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExchangeService } from './exchange.service';
import { SwapAMMDto } from './dto/swap-amm.dto';
import { SwapInfoQueryDto } from './dto/swap-info.dto';
import { parseAmmInfo } from 'src/common/util/xrpl.util';

@Controller()
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Post('amm/swap')
  @UseGuards(AuthGuard('jwt'))
  async swapAmm(@Body() dto: SwapAMMDto, @Req() req) {
    return this.exchangeService.swapAmm(
      dto.payAssetCurrency,
      dto.payAssetMaxAmount,
      dto.getAssetCurrency,
      dto.getAssetMinAmount,
      req.user.userId,
    );
  }

  @Get('amm/swap/info')
  @UseGuards(AuthGuard('jwt'))
  async getSwapAmmInfo(@Query() query: SwapInfoQueryDto, @Req() req) {
    const result = await this.exchangeService.getSwapAmmInfo(
      query.asset1Currency,
      query.asset2Currency,
    );
    return parseAmmInfo(result);
  }

  @Get('amm/swap')
  @UseGuards(AuthGuard('jwt'))
  async getSwapAmm(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req,
  ) {
    return await this.exchangeService.getSwapAmm(page, limit, req.user.userId);
  }
}
