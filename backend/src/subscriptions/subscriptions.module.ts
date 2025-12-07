import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { ConflictDetector } from './utils/conflict-detector.util';
import { SubscriptionEventsListener } from './listeners/subscription-events.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    ConflictDetector,
    SubscriptionEventsListener,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
