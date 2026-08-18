import { z } from 'zod';

export const LoginSuccessResponseSchema = z.object({
  accessToken: z.string().optional(),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  id: z.number().or(z.string()).optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  image: z.string().optional(),
});

export const LoginErrorResponseSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

export const RegisterSuccessResponseSchema = z.object({
  id: z.number().or(z.string()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
});

export type LoginSuccessResponse = z.infer<typeof LoginSuccessResponseSchema>;
export type LoginErrorResponse = z.infer<typeof LoginErrorResponseSchema>;
export type RegisterSuccessResponse = z.infer<typeof RegisterSuccessResponseSchema>;
