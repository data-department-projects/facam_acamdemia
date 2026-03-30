/**
 * Module des messages support.
 */

import { Module } from '@nestjs/common';
import { SupportFeedbackController } from './support-feedback.controller';
import { SupportFeedbackService } from './support-feedback.service';

@Module({
  controllers: [SupportFeedbackController],
  providers: [SupportFeedbackService],
  exports: [SupportFeedbackService],
})
export class SupportFeedbackModule {}
