/**
 * Module chapitres : CRUD chapitres et éléments (vidéo, document, quiz).
 */

import { Module } from '@nestjs/common';
import { ChapitresController } from './chapitres.controller';
import { ChapitresService } from './chapitres.service';

@Module({
  controllers: [ChapitresController],
  providers: [ChapitresService],
  exports: [ChapitresService],
})
export class ChapitresModule {}
