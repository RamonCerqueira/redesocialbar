import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comentário não pode ser vazio' })
  content!: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
