import { MediaModule } from './media/media.module';
import { StoriesModule } from './stories/stories.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { PostsModule } from './posts/posts.module';
import { FlirtModule } from './flirt/flirt.module';
import { MeetupsModule } from './meetups/meetups.module';
import { EventsModule } from './events/events.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { AdminModule } from './admin/admin.module';
import { AdsModule } from './ads/ads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    CheckInsModule,
    PostsModule,
    FlirtModule,
    MeetupsModule,
    EventsModule,
    PromotionsModule,
    ChatModule,
    NotificationsModule,
    ModerationModule,
    AdminModule,
    AdsModule,
    MediaModule,
    StoriesModule,
  ],
})
export class AppModule {}
