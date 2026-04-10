/**
 * DTO pour génération batch des certificats.
 */

import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BatchCertificatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  enrollmentIds: string[];
}
