import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class ParseOptionalBoolPipe implements PipeTransform<string, boolean | undefined> {
    transform(value: string, metadata: ArgumentMetadata): boolean | undefined;
}
