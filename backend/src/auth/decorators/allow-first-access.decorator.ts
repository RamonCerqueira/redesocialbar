import { SetMetadata } from '@nestjs/common';

export const ALLOW_FIRST_ACCESS = 'allowFirstAccess';
export const AllowFirstAccess = () => SetMetadata(ALLOW_FIRST_ACCESS, true);
