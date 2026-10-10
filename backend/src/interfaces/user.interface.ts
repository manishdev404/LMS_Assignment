import type { ObjectId } from 'mongodb';
import type { Role } from '../constants/roles';

export interface UserDocument {
  _id: ObjectId;
  name: string;
  /** Always stored lower-cased; unique. */
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}
