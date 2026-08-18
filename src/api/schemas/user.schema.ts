import { z } from 'zod';

export const UserItemSchema = z.object({
  id: z.number().or(z.string()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  gender: z.string().optional(),
  image: z.string().optional(),
  age: z.number().optional(),
  role: z.string().optional(),
});

export const UserListResponseSchema = z.object({
  users: z.array(UserItemSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

export const SingleUserResponseSchema = z.object({
  id: z.number().or(z.string()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  role: z.string().optional(),
});

export const CreateUserResponseSchema = z.object({
  id: z.number().or(z.string()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  age: z.number().optional(),
});

export const UpdateUserResponseSchema = z.object({
  id: z.number().or(z.string()),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  age: z.number().optional(),
});

export type UserItem = z.infer<typeof UserItemSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type SingleUserResponse = z.infer<typeof SingleUserResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
