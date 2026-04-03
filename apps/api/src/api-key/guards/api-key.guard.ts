import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';
import { Reflector } from '@nestjs/core';

export const RequirePermissions = (...permissions: string[]) =>
  Reflect.metadata('permissions', permissions);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for API key in Authorization header (Bearer or direct key)
    const authHeader = request.headers.authorization;
    let apiKey: string | undefined;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        // Check if it looks like an API key (starts with sk_)
        const token = authHeader.substring(7);
        if (token.startsWith('sk_')) {
          apiKey = token;
        }
      } else if (authHeader.startsWith('sk_')) {
        // Direct API key without Bearer prefix
        apiKey = authHeader;
      }
    }

    // Also check x-api-key header
    if (!apiKey && request.headers['x-api-key']) {
      apiKey = request.headers['x-api-key'];
    }

    if (!apiKey) {
      return false; // Let JWT guard handle it
    }

    const validated = await this.apiKeyService.validateApiKey(apiKey);

    if (!validated) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach user info to request
    request.user = {
      userId: validated.userId,
      permissions: validated.permissions,
      authType: 'api-key',
      keyId: validated.keyId,
    };

    // Check required permissions
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some((perm) =>
        validated.permissions.includes(perm),
      );

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
