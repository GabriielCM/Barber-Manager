import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class ParseOptionalIntPipe implements PipeTransform<string, number | undefined> {
    transform(value: string, metadata: ArgumentMetadata): number | undefined;
}
