import jwt from 'jsonwebtoken';

export interface SignableUser {
  id: string;
  name: string;
  email: string;
}

export function signUserToken(user: SignableUser, secret: string): string {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
    },
    secret,
    { expiresIn: '14d' },
  );
}
