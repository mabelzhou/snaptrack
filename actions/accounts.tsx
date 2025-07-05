"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { tr } from "date-fns/locale";
import { revalidatePath } from "next/cache";

type UpdateDefaultAccountResult =
  | { success: true; data: any }
  | { success: false; error: unknown };

// necessary to serialize numbers from Prisma Decimal type
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

    //  unset any existing default account
    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    //  set the new default account
    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");

    // return the updated account with serialized numbers
    return { success: true, data: serializeNumbers(account) };
  } catch (error) {
    return { success: false, error: error };
  }
}

export async function getAccountWithTransactions(accountId: string) {
  try {
    // Ensure the user is authenticated
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch the account with its transactions
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

    // Serialize numbers in the account and its transactions
    return {
      ...serializeNumbers(account),
      transactions: account.transactions.map(serializeNumbers),
    }
  } catch (error) {
    throw error;
  }
}

export async function bulkDeleteTransactions(transactionIds: string[]) {
  try {
    // Ensure the user is authenticated
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // delete the transactions
    const deletedTransactions = await db.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        account: { userId: user.id },
      },
    });

    // get transactions remaining
    const transactions = await db.transaction.findMany({
      where: { account: { userId: user.id } },
    });

    // recalculate account balances based on remaining transactions
    const accountBalanceChanges = transactions.reduce<Record<string, number>>((acc, transaction) => {
      const change = 
        transaction.type === 'EXPENSE' ? -Number(transaction.amount) : Number(transaction.amount);
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});

    // update each account's balance
    for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
      await db.account.update({
        where: { id: accountId },
        data: {
          balance: balanceChange
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");
    return { success: true, count: deletedTransactions.count };
  } catch (error) {
    return { success: false, error: error };
  }
}