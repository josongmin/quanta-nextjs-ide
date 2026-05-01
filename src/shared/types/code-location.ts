import { z } from 'zod';

export const codeLocationZ = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().nonnegative().optional(),
  endLine: z.number().int().positive().optional(),
  endColumn: z.number().int().nonnegative().optional(),
});
export type CodeLocation = z.infer<typeof codeLocationZ>;

export const codeRangeZ = z.object({
  file: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
});
export type CodeRange = z.infer<typeof codeRangeZ>;
