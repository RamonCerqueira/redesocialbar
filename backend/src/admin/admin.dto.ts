import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateIf, ArrayMaxSize } from 'class-validator';
import { AdType } from '@prisma/client';

const urlOptions = { require_tld: false, protocols: ['http', 'https'], require_protocol: true };
export class AdminPostDto {
  @IsString() @IsNotEmpty() @MaxLength(5000) content!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsUrl(urlOptions, { each: true }) mediaUrls?: string[];
  @IsOptional() @IsBoolean() isPinned?: boolean;
  @IsOptional() @IsString() @MaxLength(40) buttonText?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(urlOptions) buttonUrl?: string;
}
export class PromotionDto {
  @IsString() @IsNotEmpty() @MaxLength(140) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) discountText!: string;
  @IsString() @IsNotEmpty() @MaxLength(3000) description!: string;
  @IsDateString() validUntil!: string;
  @IsInt() @Min(1) @Max(100000) totalCoupons!: number;
  @IsOptional() @IsString() @MaxLength(3000) terms?: string;
  @IsOptional() @IsString() @MaxLength(40) badge?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(urlOptions) imageUrl?: string;
  @IsOptional() @IsString() @MaxLength(40) buttonText?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class AdvertisementDto {
  @IsString() @IsNotEmpty() @MaxLength(140) title!: string;
  @IsOptional() @IsString() @MaxLength(3000) description?: string;
  @IsUrl(urlOptions) imageUrl!: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(urlOptions) targetUrl?: string;
  @IsString() @IsNotEmpty() @MaxLength(40) buttonText!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) sponsorName!: string;
  @IsEnum(AdType) type!: AdType;
  @IsBoolean() isActive!: boolean;
}
export class EventDto {
  @IsString() @IsNotEmpty() @MaxLength(140) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) category!: string;
  @IsString() @IsNotEmpty() @MaxLength(3000) description!: string;
  @IsDateString() date!: string;
  @IsString() @MaxLength(5) startTime!: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(urlOptions) coverImageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class RestaurantSettingsDto {
  @IsString() @IsNotEmpty() @MaxLength(140) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(300) address!: string;
  @IsOptional() @IsString() @MaxLength(180) tagline?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(80) neighborhood?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(2) state?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(120) instagram?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(urlOptions) logoUrl?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(urlOptions) coverUrl?: string;
  @IsOptional() @IsObject() openingHours?: Record<string, string>;
}
export class ValidateCouponDto {
  @IsString() @IsNotEmpty() @MaxLength(80) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) restaurantSlug!: string;
}
