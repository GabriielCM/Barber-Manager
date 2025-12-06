import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseOptionalBoolPipe implements PipeTransform<string, boolean | undefined> {
  transform(value: string, metadata: ArgumentMetadata): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  }
}
