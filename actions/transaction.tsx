"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serialize } from "v8";
import { Category } from "@/app/(main)/transaction/create/_components/transaction-form";

const serializeAmount = (obj: any) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data: { 
    accountId: any; 
    type: string; 
    amount: number; 
    isRecurring: any; 
    recurringInterval: any; 
    date: any; 
    category: string;
}) {
  try {
    // check user authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

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