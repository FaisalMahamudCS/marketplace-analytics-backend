import { Injectable } from '@nestjs/common';
@Injectable()
export class ApiResponseService {
    ok<T>(data: T, extras?: Record<string, unknown>) {
        return {
            success: true,
            data,
            ...(extras ?? {}),
        };
    }
}
