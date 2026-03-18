/**
 * Module grades — conservé pour compatibilité (route GET /grades/test).
 * La correction manuelle du quiz final a été supprimée ; le certificat est créé
 * automatiquement à la réussite du QCM final (seuil défini par le responsable).
 */

import { Module } from '@nestjs/common';
import { GradesController } from './grades.controller';

@Module({
  controllers: [GradesController],
})
export class GradesModule {}
