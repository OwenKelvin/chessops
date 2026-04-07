import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: any) => {
        // Try to get token from Authorization header first
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token) {
          return token;
        }
        // Fall back to cookies (for cookie-based auth)
        if (req.cookies?.accessToken) {
          return req.cookies.accessToken;
        }
        // Also check req.raw.cookies for Fastify compatibility
        if (req.raw?.cookies?.accessToken) {
          return req.raw.cookies.accessToken;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-me-in-production',
    });
  }

  async validate(payload: { sub: string }) {
    return { userId: payload.sub };
  }
}
