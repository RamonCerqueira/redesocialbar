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
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { AdminModule } from './admin/admin.module';
import { AdsModule } from './ads/ads.module';
import { HealthController } from './health.controller';
import { LegalModule } from './legal/legal.module';

@Module({
  controllers: [HealthController],
  imports: [
    LegalModule,
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
    NotificationsModule,
    ModerationModule,
    AdminModule,
    AdsModule,
    MediaModule,
    StoriesModule,
  ],
})
export class AppModule {}
