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
];
