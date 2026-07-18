import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const CONTACT_SUBJECTS = [
  'General question',
  'Billing & plans',
  'Agency & teams',
  'Partnership',
  'Press',
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export class SubmitContactDto {
  @ApiPropertyOptional({ example: 'Maya' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Reyes' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiProperty({ example: 'you@company.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ enum: CONTACT_SUBJECTS, example: 'General question' })
  @IsIn(CONTACT_SUBJECTS)
  subject!: ContactSubject;

  @ApiProperty({ example: 'Tell us a bit about what you need…' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}

export class SubmitContactResponseDto {
  @ApiProperty({ example: true })
  sent!: boolean;
}
