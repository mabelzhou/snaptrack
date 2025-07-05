import { z } from "zod";

export const accountSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["CHEQUEING", "SAVINGS"]),
    balance: z.number().min(0, "Balance must be a positive number"),
    isDefault: z.boolean().optional(),
});