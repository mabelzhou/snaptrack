"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Category } from "@/app/(main)/transaction/create/_components/transaction-form";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const serializeAmount = (obj: any) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data: { 
    accountId: string; 
    type: string; 
    amount: number; 
    isRecurring: boolean; 
    recurringInterval: any; 
    date: Date; 
    category: string;
}) {
  try {
    // check user authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // arcjet 
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Check account existence
    const account = await db.account.findUnique({
        where: { id: data.accountId, userId: user.id },
    });

    if (!account) throw new Error("Account not found");

    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = Number(account.balance) + balanceChange;

    const transaction = await db.$transaction(async(tx)=> {
        const newTransaction = await tx.transaction.create({
            data: {
                ...data,
                userId: user.id,
                nextRecurringDate: 
                    data.isRecurring && data.recurringInterval 
                        ? calculateNextRecurringDate(data.date, data.recurringInterval) : 
                        null,

            },
        });

        await tx.account.update({
            where: { id: data.accountId },
            data: { balance: newBalance },
        });

        return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate: Date, interval: string) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}