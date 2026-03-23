/**
 * DTO pour créer ou mettre à jour le quiz final d'un module (responsable).
 */

import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FinalQuizQuestionDto {
  @IsString()
  questionText: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(10)
  correctIndex: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(10, { each: true })
  correctIndexes?: number[];
}

export class UpsertFinalQuizDto {
  @IsString()
  moduleId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minScoreToPass?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinalQuizQuestionDto)
  questions: FinalQuizQuestionDto[];
}
