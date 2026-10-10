import type { ObjectId } from 'mongodb';
import type { Portal } from '../constants/auth';
import type { Role } from '../constants/roles';
import type { UserDto } from './user.interface';

/** The authenticated user attached to `req.user` by the `authenticate` middleware. */
export interface AuthUser {
  id: ObjectId;
  name: string;
  email: string;
  role: Role;
}

export interface AccessTokenClaims {
  sub: string;
  role: Role;
  aud: Portal;
}

export interface AuthResult {
  user: UserDto;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
