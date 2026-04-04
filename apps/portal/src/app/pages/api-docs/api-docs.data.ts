export interface RouteDoc {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: 'public' | 'JWT' | 'Admin';
  requestBody?: RequestField[];
  pathParams?: PathParam[];
  responses: {
    200?: ResponseSchema;
    400?: { description: string; example: object };
    401?: { description: string; example: object };
    403?: { description: string; example: object };
    404?: { description: string; example: object };
    409?: { description: string; example: object };
    422?: { description: string; example: object };
  };
  examples: {
    curl: string;
    js?: string;
    python?: string;
  };
}

export interface RequestField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface PathParam {
  name: string;
  type: string;
  description: string;
}

export interface ResponseSchema {
  description: string;
  example: object;
}

export interface SectionDoc {
  id: string;
  title: string;
  routes: RouteDoc[];
}

export const apiDocumentation: SectionDoc[] = [
  {
    id: 'registration',
    title: 'Registration',
    routes: [
      {
        id: 'post-register',
        method: 'POST',
        path: '/auth/register',
        description: 'Register a new user account with email and password.',
        auth: 'public',
        requestBody: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'Password (min 8 characters)' },
          { name: 'displayName', type: 'string', required: true, description: 'Display name' },
        ],
        responses: {
          200: {
            description: 'User created successfully with tokens',
            example: {
              user: { id: 'user123', email: 'test@example.com', displayName: 'Test User' },
              accessToken: 'eyJhbGc...',
              refreshToken: 'eyJhbGc...',
            },
          },
          400: { description: 'Invalid input', example: { statusCode: 400, message: ['email must be an email'] } },
          409: { description: 'Email already registered', example: { statusCode: 409, message: 'Email already registered' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'`,
          js: `const res = await fetch('http://localhost:8082/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password123', displayName: 'Test User' })
});
const data = await res.json();`,
        },
      },
      {
        id: 'post-verify-email',
        method: 'POST',
        path: '/auth/verify-email',
        description: 'Verify email address with token sent via email.',
        auth: 'public',
        requestBody: [
          { name: 'token', type: 'string', required: true, description: 'Verification token from email' },
        ],
        responses: {
          200: { description: 'Email verified', example: { success: true } },
          400: { description: 'Invalid or expired token', example: { statusCode: 400, message: 'Invalid token' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/verify-email \\
  -H "Content-Type: application/json" \\
  -d '{"token":"abc123..."}'`,
        },
      },
      {
        id: 'post-resend-verification',
        method: 'POST',
        path: '/auth/resend-verification',
        description: 'Resend verification email to specified address.',
        auth: 'public',
        requestBody: [
          { name: 'email', type: 'string', required: true, description: 'Email address to resend verification to' },
        ],
        responses: {
          200: { description: 'Verification email sent', example: { success: true } },
          400: { description: 'Invalid email', example: { statusCode: 400, message: ['email must be an email'] } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/resend-verification \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com"}'`,
        },
      },
    ],
  },
  {
    id: 'session',
    title: 'Session',
    routes: [
      {
        id: 'post-login',
        method: 'POST',
        path: '/auth/login',
        description: 'Authenticate user with email and password.',
        auth: 'public',
        requestBody: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password' },
        ],
        responses: {
          200: {
            description: 'Login successful',
            example: {
              user: { id: 'user123', email: 'test@example.com', displayName: 'Test User', role: 'user' },
              accessToken: 'eyJhbGc...',
              refreshToken: 'eyJhbGc...',
            },
          },
          401: { description: 'Invalid credentials', example: { statusCode: 401, message: 'Invalid credentials' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'`,
        },
      },
      {
        id: 'post-logout',
        method: 'POST',
        path: '/auth/logout',
        description: 'Logout user and invalidate session.',
        auth: 'JWT',
        requestBody: [
          { name: 'refreshToken', type: 'string', required: true, description: 'Refresh token to invalidate' },
        ],
        responses: {
          200: { description: 'Logout successful', example: {} },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/logout \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"refreshToken":"eyJhbGc..."}'`,
        },
      },
      {
        id: 'post-token-refresh',
        method: 'POST',
        path: '/auth/token/refresh',
        description: 'Refresh access token using refresh token.',
        auth: 'public',
        requestBody: [
          { name: 'refreshToken', type: 'string', required: true, description: 'Valid refresh token' },
        ],
        responses: {
          200: {
            description: 'Tokens refreshed',
            example: { accessToken: 'eyJhbGc...', refreshToken: 'eyJhbGc...' },
          },
          401: { description: 'Invalid refresh token', example: { statusCode: 401, message: 'Invalid refresh token' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/token/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"eyJhbGc..."}'`,
        },
      },
      {
        id: 'post-token-revoke',
        method: 'POST',
        path: '/auth/token/revoke',
        description: 'Revoke a specific refresh token.',
        auth: 'JWT',
        requestBody: [
          { name: 'refreshToken', type: 'string', required: true, description: 'Refresh token to revoke' },
        ],
        responses: {
          200: { description: 'Token revoked', example: { success: true } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/token/revoke \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"refreshToken":"eyJhbGc..."}'`,
        },
      },
    ],
  },
  {
    id: 'oauth',
    title: 'OAuth 2.0',
    routes: [
      {
        id: 'get-oauth-google',
        method: 'GET',
        path: '/auth/google',
        description: 'Initiate Google OAuth authentication flow. Redirects to Google.',
        auth: 'public',
        responses: {
          200: { description: 'Redirects to Google OAuth', example: {} },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/auth/google`,
        },
      },
      {
        id: 'get-oauth-google-callback',
        method: 'GET',
        path: '/auth/google/callback',
        description: 'Google OAuth callback endpoint. Returns tokens after successful authentication.',
        auth: 'public',
        responses: {
          200: {
            description: 'OAuth successful',
            example: {
              user: { id: 'user123', email: 'test@example.com', displayName: 'Test User' },
              accessToken: 'eyJhbGc...',
              refreshToken: 'eyJhbGc...',
            },
          },
          400: { description: 'OAuth error', example: { statusCode: 400, message: 'OAuth error' } },
        },
        examples: {
          curl: `curl -X GET "http://localhost:8082/auth/google/callback?code=abc123"`,
        },
      },
      {
        id: 'get-oauth-github',
        method: 'GET',
        path: '/auth/github',
        description: 'Initiate GitHub OAuth authentication flow. Redirects to GitHub.',
        auth: 'public',
        responses: {
          200: { description: 'Redirects to GitHub OAuth', example: {} },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/auth/github`,
        },
      },
      {
        id: 'get-oauth-github-callback',
        method: 'GET',
        path: '/auth/github/callback',
        description: 'GitHub OAuth callback endpoint. Returns tokens after successful authentication.',
        auth: 'public',
        responses: {
          200: {
            description: 'OAuth successful',
            example: {
              user: { id: 'user123', email: 'test@example.com', displayName: 'Test User' },
              accessToken: 'eyJhbGc...',
              refreshToken: 'eyJhbGc...',
            },
          },
          400: { description: 'OAuth error', example: { statusCode: 400, message: 'OAuth error' } },
        },
        examples: {
          curl: `curl -X GET "http://localhost:8082/auth/github/callback?code=abc123"`,
        },
      },
    ],
  },
  {
    id: 'password',
    title: 'Password Recovery',
    routes: [
      {
        id: 'post-forgot-password',
        method: 'POST',
        path: '/auth/forgot-password',
        description: 'Request password reset email.',
        auth: 'public',
        requestBody: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
        ],
        responses: {
          200: { description: 'Reset email sent', example: { message: 'Password reset email sent' } },
          404: { description: 'User not found', example: { statusCode: 404, message: 'User not found' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com"}'`,
        },
      },
      {
        id: 'post-reset-password',
        method: 'POST',
        path: '/auth/reset-password',
        description: 'Reset password using token from email.',
        auth: 'public',
        requestBody: [
          { name: 'token', type: 'string', required: true, description: 'Password reset token' },
          { name: 'newPassword', type: 'string', required: true, description: 'New password (min 8 characters)' },
        ],
        responses: {
          200: { description: 'Password reset successful', example: { message: 'Password reset successful' } },
          400: { description: 'Invalid or expired token', example: { statusCode: 400, message: 'Invalid token' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{"token":"abc123","newPassword":"newpassword123"}'`,
        },
      },
    ],
  },
  {
    id: 'mfa',
    title: 'Multi-Factor Authentication',
    routes: [
      {
        id: 'get-mfa-setup',
        method: 'GET',
        path: '/mfa/setup',
        description: 'Generate TOTP secret and QR code URL for MFA setup.',
        auth: 'JWT',
        responses: {
          200: {
            description: 'MFA secret generated',
            example: {
              secret: 'JBSWY3DPEHPK3PXP',
              qrCodeUrl: 'otpauth://totp/...',
              backupCodes: ['abc123', 'def456'],
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/mfa/setup \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'post-mfa-enable',
        method: 'POST',
        path: '/mfa/enable',
        description: 'Enable MFA with TOTP token verification.',
        auth: 'JWT',
        requestBody: [
          { name: 'token', type: 'string', required: true, description: 'TOTP token from authenticator app' },
        ],
        responses: {
          200: { description: 'MFA enabled', example: { success: true } },
          400: { description: 'Invalid token', example: { statusCode: 400, message: 'Invalid token' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/mfa/enable \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"token":"123456"}'`,
        },
      },
      {
        id: 'post-mfa-disable',
        method: 'POST',
        path: '/mfa/disable',
        description: 'Disable MFA with TOTP token verification.',
        auth: 'JWT',
        requestBody: [
          { name: 'token', type: 'string', required: true, description: 'TOTP token from authenticator app' },
        ],
        responses: {
          200: { description: 'MFA disabled', example: { success: true } },
          400: { description: 'Invalid token', example: { statusCode: 400, message: 'Invalid token' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/mfa/disable \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"token":"123456"}'`,
        },
      },
      {
        id: 'post-mfa-verify',
        method: 'POST',
        path: '/mfa/verify',
        description: 'Verify TOTP token.',
        auth: 'JWT',
        requestBody: [
          { name: 'token', type: 'string', required: true, description: 'TOTP token to verify' },
        ],
        responses: {
          200: { description: 'Verification result', example: { valid: true } },
          400: { description: 'Invalid token', example: { statusCode: 400, message: 'Invalid token' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/mfa/verify \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"token":"123456"}'`,
        },
      },
      {
        id: 'post-mfa-challenge',
        method: 'POST',
        path: '/mfa/challenge',
        description: 'Complete MFA challenge to get new access token.',
        auth: 'JWT',
        requestBody: [
          { name: 'token', type: 'string', required: true, description: 'TOTP token' },
        ],
        responses: {
          200: {
            description: 'Challenge completed',
            example: { success: true, accessToken: 'eyJhbGc...' },
          },
          400: { description: 'Invalid token', example: { statusCode: 400, message: 'Invalid MFA code' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/mfa/challenge \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"token":"123456"}'`,
        },
      },
      {
        id: 'get-mfa-status',
        method: 'GET',
        path: '/mfa/status',
        description: 'Get MFA enabled status for current user.',
        auth: 'JWT',
        responses: {
          200: { description: 'MFA status', example: { enabled: true } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/mfa/status \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    routes: [
      {
        id: 'get-me',
        method: 'GET',
        path: '/auth/me',
        description: 'Get current authenticated user profile.',
        auth: 'JWT',
        responses: {
          200: {
            description: 'User profile',
            example: {
              id: 'user123',
              email: 'test@example.com',
              displayName: 'Test User',
              avatarUrl: 'https://...',
              emailVerifiedAt: '2024-01-01T00:00:00Z',
              role: 'user',
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/auth/me \\
  -H "Authorization: Bearer eyJhbGc..."`,
          js: `const res = await fetch('http://localhost:8082/auth/me', {
  headers: { 'Authorization': 'Bearer ' + accessToken }
});
const user = await res.json();`,
        },
      },
      {
        id: 'patch-me',
        method: 'PATCH',
        path: '/auth/me',
        description: 'Update current user profile.',
        auth: 'JWT',
        requestBody: [
          { name: 'displayName', type: 'string', required: false, description: 'New display name' },
          { name: 'avatarUrl', type: 'string', required: false, description: 'New avatar URL' },
        ],
        responses: {
          200: {
            description: 'Profile updated',
            example: { id: 'user123', email: 'test@example.com', displayName: 'Updated Name' },
          },
          400: { description: 'Invalid input', example: { statusCode: 400, message: ['displayName must be a string'] } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X PATCH http://localhost:8082/auth/me \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"displayName":"Updated Name"}'`,
        },
      },
      {
        id: 'delete-me',
        method: 'DELETE',
        path: '/auth/me',
        description: 'Delete current user account permanently.',
        auth: 'JWT',
        responses: {
          200: { description: 'Account deleted', example: { success: true } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X DELETE http://localhost:8082/auth/me \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'post-change-password',
        method: 'POST',
        path: '/auth/change-password',
        description: 'Change current user password.',
        auth: 'JWT',
        requestBody: [
          { name: 'currentPassword', type: 'string', required: true, description: 'Current password' },
          { name: 'newPassword', type: 'string', required: true, description: 'New password (min 8 characters)' },
        ],
        responses: {
          200: { description: 'Password changed', example: {} },
          400: { description: 'Invalid current password', example: { statusCode: 400, message: 'Invalid password' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/auth/change-password \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"currentPassword":"oldpass123","newPassword":"newpass123"}'`,
        },
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    routes: [
      {
        id: 'get-admin-users',
        method: 'GET',
        path: '/admin/users',
        description: 'List all users (admin only).',
        auth: 'Admin',
        responses: {
          200: {
            description: 'List of users',
            example: {
              users: [
                { id: 'user1', email: 'test@example.com', displayName: 'Test User', role: 'user', isSuspended: false },
                { id: 'user2', email: 'admin@example.com', displayName: 'Admin', role: 'admin', isSuspended: false },
              ],
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          403: { description: 'Admin access required', example: { statusCode: 403, message: 'Admin access required' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/admin/users \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'patch-admin-suspend',
        method: 'PATCH',
        path: '/admin/users/:id/suspend',
        description: 'Suspend or unsuspend a user (admin only).',
        auth: 'Admin',
        pathParams: [
          { name: 'id', type: 'string', description: 'User ID' },
        ],
        requestBody: [
          { name: 'suspended', type: 'boolean', required: true, description: 'Suspend status' },
          { name: 'reason', type: 'string', required: false, description: 'Optional reason for suspension' },
        ],
        responses: {
          200: {
            description: 'User updated',
            example: { user: { id: 'user1', email: 'test@example.com', isSuspended: true } },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          403: { description: 'Admin access required', example: { statusCode: 403, message: 'Admin access required' } },
          404: { description: 'User not found', example: { statusCode: 404, message: 'User not found' } },
        },
        examples: {
          curl: `curl -X PATCH http://localhost:8082/admin/users/user123/suspend \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"suspended":true,"reason":"Violation of terms"}'`,
        },
      },
      {
        id: 'post-admin-impersonate',
        method: 'POST',
        path: '/admin/users/:id/impersonate',
        description: 'Impersonate a user (admin only). Returns new access token.',
        auth: 'Admin',
        pathParams: [
          { name: 'id', type: 'string', description: 'User ID to impersonate' },
        ],
        requestBody: [
          { name: 'expiresIn', type: 'number', required: false, description: 'Token expiry in seconds (default: 3600)' },
        ],
        responses: {
          200: {
            description: 'Impersonation successful',
            example: {
              accessToken: 'eyJhbGc...',
              user: { id: 'user123', email: 'test@example.com', displayName: 'Test User' },
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          403: { description: 'Admin access required', example: { statusCode: 403, message: 'Admin access required' } },
          404: { description: 'User not found', example: { statusCode: 404, message: 'User not found' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/admin/users/user123/impersonate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"expiresIn":3600}'`,
        },
      },
    ],
  },
  {
    id: 'players',
    title: 'Players',
    routes: [
      {
        id: 'post-players',
        method: 'POST',
        path: '/players',
        description: 'Create a new player profile.',
        auth: 'JWT',
        requestBody: [
          { name: 'firstName', type: 'string', required: true, description: 'Player first name' },
          { name: 'lastName', type: 'string', required: true, description: 'Player last name' },
          { name: 'email', type: 'string', required: false, description: 'Player email' },
          { name: 'fideId', type: 'string', required: false, description: 'FIDE ID' },
          { name: 'rating', type: 'number', required: false, description: 'Player rating' },
        ],
        responses: {
          200: {
            description: 'Player created',
            example: { id: 'player1', firstName: 'John', lastName: 'Doe', rating: 1500 },
          },
          400: { description: 'Invalid input', example: { statusCode: 400, message: ['firstName must be a string'] } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/players \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"firstName":"John","lastName":"Doe","rating":1500}'`,
        },
      },
      {
        id: 'get-players',
        method: 'GET',
        path: '/players',
        description: 'List all players for the authenticated user.',
        auth: 'JWT',
        responses: {
          200: {
            description: 'List of players',
            example: {
              players: [
                { id: 'player1', firstName: 'John', lastName: 'Doe', rating: 1500 },
                { id: 'player2', firstName: 'Jane', lastName: 'Smith', rating: 1800 },
              ],
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/players \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'get-player-by-id',
        method: 'GET',
        path: '/players/:id',
        description: 'Get a specific player by ID.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Player ID' },
        ],
        responses: {
          200: {
            description: 'Player details',
            example: { id: 'player1', firstName: 'John', lastName: 'Doe', rating: 1500, email: 'john@example.com' },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Player not found', example: { statusCode: 404, message: 'Player not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/players/player123 \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'patch-players',
        method: 'PATCH',
        path: '/players/:id',
        description: 'Update a player profile.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Player ID' },
        ],
        requestBody: [
          { name: 'firstName', type: 'string', required: false, description: 'Player first name' },
          { name: 'lastName', type: 'string', required: false, description: 'Player last name' },
          { name: 'email', type: 'string', required: false, description: 'Player email' },
          { name: 'rating', type: 'number', required: false, description: 'Player rating' },
        ],
        responses: {
          200: {
            description: 'Player updated',
            example: { id: 'player1', firstName: 'John', lastName: 'Doe', rating: 1600 },
          },
          400: { description: 'Invalid input', example: { statusCode: 400, message: ['rating must be a number'] } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Player not found', example: { statusCode: 404, message: 'Player not found' } },
        },
        examples: {
          curl: `curl -X PATCH http://localhost:8082/players/player123 \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"rating":1600}'`,
        },
      },
      {
        id: 'delete-players',
        method: 'DELETE',
        path: '/players/:id',
        description: 'Delete a player profile.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Player ID' },
        ],
        responses: {
          200: { description: 'Player deleted', example: { success: true } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Player not found', example: { statusCode: 404, message: 'Player not found' } },
        },
        examples: {
          curl: `curl -X DELETE http://localhost:8082/players/player123 \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'get-player-statistics',
        method: 'GET',
        path: '/players/:id/statistics',
        description: 'Get player tournament statistics.',
        auth: 'public',
        pathParams: [
          { name: 'id', type: 'string', description: 'Player ID' },
        ],
        responses: {
          200: {
            description: 'Player statistics',
            example: {
              playerId: 'player1',
              gamesPlayed: 25,
              wins: 15,
              losses: 7,
              draws: 3,
              winRate: 0.6,
              ratingChange: 150,
            },
          },
          404: { description: 'Player not found', example: { statusCode: 404, message: 'Player not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/players/player123/statistics`,
        },
      },
    ],
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    routes: [
      {
        id: 'post-tournaments',
        method: 'POST',
        path: '/tournaments',
        description: 'Create a new tournament.',
        auth: 'JWT',
        requestBody: [
          { name: 'name', type: 'string', required: true, description: 'Tournament name' },
          { name: 'description', type: 'string', required: false, description: 'Tournament description' },
          { name: 'startDate', type: 'string', required: true, description: 'Start date (ISO 8601)' },
          { name: 'endDate', type: 'string', required: false, description: 'End date (ISO 8601)' },
          { name: 'format', type: 'string', required: false, description: 'Format: swiss, roundrobin, elimination' },
          { name: 'maxRounds', type: 'number', required: false, description: 'Maximum rounds (for Swiss)' },
          { name: 'maxPlayers', type: 'number', required: false, description: 'Maximum players' },
          { name: 'registrationOpen', type: 'boolean', required: false, description: 'Is registration open' },
        ],
        responses: {
          200: {
            description: 'Tournament created',
            example: { id: 'trn1', name: 'Spring Championship', format: 'swiss', status: 'draft' },
          },
          400: { description: 'Invalid input', example: { statusCode: 400, message: ['name must be a string'] } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"name":"Spring Championship","startDate":"2024-05-01T10:00:00Z","format":"swiss","maxRounds":9}'`,
        },
      },
      {
        id: 'get-tournaments',
        method: 'GET',
        path: '/tournaments',
        description: 'List all tournaments.',
        auth: 'JWT',
        responses: {
          200: {
            description: 'List of tournaments',
            example: {
              tournaments: [
                { id: 'trn1', name: 'Spring Championship', format: 'swiss', status: 'active' },
                { id: 'trn2', name: 'Summer Open', format: 'roundrobin', status: 'registration' },
              ],
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'get-tournament-by-id',
        method: 'GET',
        path: '/tournaments/:id',
        description: 'Get a specific tournament by ID.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
        ],
        responses: {
          200: {
            description: 'Tournament details',
            example: {
              id: 'trn1',
              name: 'Spring Championship',
              format: 'swiss',
              status: 'active',
              startDate: '2024-05-01T10:00:00Z',
              maxRounds: 9,
            },
          },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments/trn123 \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'patch-tournaments',
        method: 'PATCH',
        path: '/tournaments/:id',
        description: 'Update a tournament.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
        ],
        requestBody: [
          { name: 'name', type: 'string', required: false, description: 'Tournament name' },
          { name: 'description', type: 'string', required: false, description: 'Tournament description' },
          { name: 'startDate', type: 'string', required: false, description: 'Start date' },
          { name: 'status', type: 'string', required: false, description: 'Status: draft, registration, active, completed' },
          { name: 'registrationOpen', type: 'boolean', required: false, description: 'Is registration open' },
        ],
        responses: {
          200: {
            description: 'Tournament updated',
            example: { id: 'trn1', name: 'Spring Championship', status: 'active' },
          },
          400: { description: 'Invalid input', example: { statusCode: 400, message: ['Invalid status'] } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X PATCH http://localhost:8082/tournaments/trn123 \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"status":"active","registrationOpen":false}'`,
        },
      },
      {
        id: 'delete-tournaments',
        method: 'DELETE',
        path: '/tournaments/:id',
        description: 'Delete a tournament.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
        ],
        responses: {
          200: { description: 'Tournament deleted', example: { success: true } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X DELETE http://localhost:8082/tournaments/trn123 \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'post-tournament-players',
        method: 'POST',
        path: '/tournaments/:id/players',
        description: 'Add a player to a tournament.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
        ],
        requestBody: [
          { name: 'playerId', type: 'string', required: true, description: 'Player ID to add' },
          { name: 'seed', type: 'number', required: false, description: 'Player seed' },
        ],
        responses: {
          200: {
            description: 'Player added',
            example: { id: 'tp1', playerId: 'player1', tournamentId: 'trn1', seed: 1 },
          },
          400: { description: 'Registration closed', example: { statusCode: 400, message: 'Registration is closed' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Tournament or player not found', example: { statusCode: 404, message: 'Not found' } },
          409: { description: 'Player already registered', example: { statusCode: 409, message: 'Player already registered' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments/trn123/players \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"playerId":"player1","seed":1}'`,
        },
      },
      {
        id: 'delete-tournament-players',
        method: 'DELETE',
        path: '/tournaments/:id/players/:playerId',
        description: 'Remove a player from a tournament.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
          { name: 'playerId', type: 'string', description: 'Player ID' },
        ],
        responses: {
          200: { description: 'Player removed', example: { success: true } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Not found', example: { statusCode: 404, message: 'Not found' } },
        },
        examples: {
          curl: `curl -X DELETE http://localhost:8082/tournaments/trn123/players/player1 \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'post-tournament-rounds',
        method: 'POST',
        path: '/tournaments/:id/rounds',
        description: 'Create a new round in the tournament.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
        ],
        requestBody: [
          { name: 'roundNumber', type: 'number', required: true, description: 'Round number' },
        ],
        responses: {
          200: {
            description: 'Round created',
            example: { id: 'round1', tournamentId: 'trn1', roundNumber: 1, status: 'pending' },
          },
          400: { description: 'Invalid round number', example: { statusCode: 400, message: 'Invalid round number' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments/trn123/rounds \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"roundNumber":1}'`,
        },
      },
      {
        id: 'post-tournament-results',
        method: 'POST',
        path: '/tournaments/:id/results',
        description: 'Submit a game result.',
        auth: 'JWT',
        pathParams: [
          { name: 'id', type: 'string', description: 'Tournament ID' },
        ],
        requestBody: [
          { name: 'pairingId', type: 'string', required: true, description: 'Pairing ID' },
          { name: 'result', type: 'string', required: true, description: 'Result: 1-0, 0-1, 1/2-1/2' },
        ],
        responses: {
          200: {
            description: 'Result submitted',
            example: { id: 'result1', pairingId: 'pair1', result: '1-0' },
          },
          400: { description: 'Invalid result', example: { statusCode: 400, message: 'Invalid result format' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Pairing not found', example: { statusCode: 404, message: 'Pairing not found' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments/trn123/results \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"pairingId":"pair1","result":"1-0"}'`,
        },
      },
    ],
  },
  {
    id: 'standings',
    title: 'Standings & Tiebreaks',
    routes: [
      {
        id: 'get-standings',
        method: 'GET',
        path: '/tournaments/:tournamentId/standings',
        description: 'Get tournament standings with tiebreak calculations.',
        auth: 'public',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
        ],
        responses: {
          200: {
            description: 'Tournament standings',
            example: {
              standings: [
                { rank: 1, playerId: 'player1', name: 'John Doe', score: 7.5, tiebreaks: { buchholz: 45.5, sonneborn: 28.5 } },
                { rank: 2, playerId: 'player2', name: 'Jane Smith', score: 6.5, tiebreaks: { buchholz: 43.0, sonneborn: 25.0 } },
              ],
            },
          },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments/trn123/standings`,
        },
      },
      {
        id: 'get-standings-details',
        method: 'GET',
        path: '/tournaments/:tournamentId/standings/:playerId/details',
        description: 'Get detailed tiebreak information for a specific player.',
        auth: 'public',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
          { name: 'playerId', type: 'string', description: 'Player ID' },
        ],
        responses: {
          200: {
            description: 'Player tiebreak details',
            example: {
              playerId: 'player1',
              name: 'John Doe',
              score: 7.5,
              tiebreaks: {
                buchholz: 45.5,
                sonnebornBerger: 28.5,
                directEncounter: 1,
                gamesWon: 6,
              },
              roundScores: [1, 1, 0.5, 1, 0, 1, 1],
            },
          },
          404: { description: 'Not found', example: { statusCode: 404, message: 'Not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments/trn123/standings/player1/details`,
        },
      },
      {
        id: 'get-standings-by-tiebreak',
        method: 'GET',
        path: '/tournaments/:tournamentId/standings/by/:tiebreak',
        description: 'Get standings sorted by a specific tiebreak method.',
        auth: 'public',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
          { name: 'tiebreak', type: 'string', description: 'Tiebreak type: buchholz, sonneborn, direct, gamesWon' },
        ],
        responses: {
          200: {
            description: 'Standings sorted by tiebreak',
            example: {
              tiebreak: 'buchholz',
              standings: [
                { rank: 1, playerId: 'player1', name: 'John Doe', score: 7.5, buchholz: 45.5 },
                { rank: 2, playerId: 'player2', name: 'Jane Smith', score: 7.5, buchholz: 43.0 },
              ],
            },
          },
          400: { description: 'Invalid tiebreak type', example: { statusCode: 400, message: 'Invalid tiebreak type' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments/trn123/standings/by/buchholz`,
        },
      },
    ],
  },
  {
    id: 'pairings',
    title: 'Pairings',
    routes: [
      {
        id: 'post-pairings-swiss',
        method: 'POST',
        path: '/tournaments/:tournamentId/pairings/generate/swiss',
        description: 'Generate Swiss system pairings for a round.',
        auth: 'JWT',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
        ],
        requestBody: [
          { name: 'roundNumber', type: 'number', required: true, description: 'Round number' },
        ],
        responses: {
          200: {
            description: 'Swiss pairings generated',
            example: {
              roundId: 'round1',
              pairings: [
                { id: 'pair1', whiteId: 'player1', blackId: 'player2', boardNumber: 1 },
                { id: 'pair2', whiteId: 'player3', blackId: 'player4', boardNumber: 2 },
              ],
            },
          },
          400: { description: 'Invalid format', example: { statusCode: 400, message: 'Tournament is not using Swiss format' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments/trn123/pairings/generate/swiss \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"roundNumber":1}'`,
        },
      },
      {
        id: 'post-pairings-roundrobin',
        method: 'POST',
        path: '/tournaments/:tournamentId/pairings/generate/roundrobin',
        description: 'Generate all Round-Robin pairings at once.',
        auth: 'JWT',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
        ],
        responses: {
          200: {
            description: 'Round-Robin pairings generated',
            example: {
              rounds: [
                { roundNumber: 1, pairings: [{ whiteId: 'player1', blackId: 'player2' }] },
                { roundNumber: 2, pairings: [{ whiteId: 'player2', blackId: 'player3' }] },
              ],
            },
          },
          400: { description: 'Invalid format', example: { statusCode: 400, message: 'Tournament is not using Round-Robin format' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments/trn123/pairings/generate/roundrobin \\
  -H "Authorization: Bearer eyJhbGc..."`,
        },
      },
      {
        id: 'post-pairings-elimination',
        method: 'POST',
        path: '/tournaments/:tournamentId/pairings/generate/elimination',
        description: 'Generate Elimination bracket pairings for a round.',
        auth: 'JWT',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
        ],
        requestBody: [
          { name: 'roundNumber', type: 'number', required: true, description: 'Round number' },
        ],
        responses: {
          200: {
            description: 'Elimination pairings generated',
            example: {
              roundId: 'round1',
              pairings: [
                { id: 'pair1', whiteId: 'player1', blackId: 'player8', boardNumber: 1 },
                { id: 'pair2', whiteId: 'player4', blackId: 'player5', boardNumber: 2 },
              ],
            },
          },
          400: { description: 'Invalid format', example: { statusCode: 400, message: 'Tournament is not using Elimination format' } },
          401: { description: 'Unauthorized', example: { statusCode: 401, message: 'Unauthorized' } },
        },
        examples: {
          curl: `curl -X POST http://localhost:8082/tournaments/trn123/pairings/generate/elimination \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGc..." \\
  -d '{"roundNumber":1}'`,
        },
      },
    ],
  },
  {
    id: 'export',
    title: 'Export',
    routes: [
      {
        id: 'get-export-pgn',
        method: 'GET',
        path: '/tournaments/:tournamentId/export/pgn',
        description: 'Export all tournament games as PGN.',
        auth: 'public',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
        ],
        responses: {
          200: { description: 'PGN file content', example: { pgn: '[Event "Tournament"]...' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments/trn123/export/pgn`,
        },
      },
      {
        id: 'get-export-csv',
        method: 'GET',
        path: '/tournaments/:tournamentId/export/csv',
        description: 'Export tournament results as CSV.',
        auth: 'public',
        pathParams: [
          { name: 'tournamentId', type: 'string', description: 'Tournament ID' },
        ],
        responses: {
          200: { description: 'CSV file content', example: { csv: 'Player,Score,Rating,...' } },
          404: { description: 'Tournament not found', example: { statusCode: 404, message: 'Tournament not found' } },
        },
        examples: {
          curl: `curl -X GET http://localhost:8082/tournaments/trn123/export/csv`,
        },
      },
    ],
  },
];
