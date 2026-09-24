import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `Invalid id: '${value}' must be a positive integer`,
      );
    }
    return parsed;
  }
}
