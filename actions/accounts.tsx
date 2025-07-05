"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type UpdateDefaultAccountResult =
  | { success: true; data: any }
  | { success: false; error: unknown };

const serializeNumbers = (obj: any) => {
    const serialized = { ...obj };
    if (obj.balance) {
        if (typeof obj.balance.toNumber === "function") {
            serialized.balance = obj.balance.toNumber();
        } else {
            serialized.balance = obj.balance;
        }
    }
    if (obj.amount) {
        if (typeof obj.amount.toNumber === "function") {
            serialized.amount = obj.amount.toNumber();
        } else {
            serialized.amount = obj.amount;
        }
    }
    return serialized;
};
export async function updateDefaultAccount(accountId: any): Promise<UpdateDefaultAccountResult> {

  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // First, unset any existing default account
    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Then set the new default account
    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return { success: true, data: serializeNumbers(account) };
  } catch (error) {
    return { success: false, error: error };
  }
}

export async function getAccountWithTransactions(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        transactions: {
          orderBy: { date: "desc" },
        },
        _count: {
          select: { transactions: true },
        }
      },
    });

    if (!account) {
      return null;
    }

    return {
      ...serializeNumbers(account),
      transactions: account.transactions.map(serializeNumbers),
    }
  } catch (error) {
    throw error;
  }
}