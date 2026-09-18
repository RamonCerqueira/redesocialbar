import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getUserConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/:id/messages')
  async getConversationMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getConversationMessages(id, userId);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, userId, dto);
  }
}
