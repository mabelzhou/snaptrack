"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { AccountType } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

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

interface CreateAccountProps {
    name: string;
    type: string;
    balance: number;
    isDefault: boolean;
}

export async function createAccount(data : CreateAccountProps) {
    try {
        // verify user authentication
        const {userId} = await auth();
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: {clerkUserId: userId},
        });

        if (!user) {
            throw new Error("User not found");
        }

        // check balance
        if (isNaN(data.balance)) {
            throw new Error("Invalid balance value");
        }

        // check for existing account
        const existingAccount = await db.account.findMany({
            where: {
                userId: user.id,
            },
        });

        // check if account should be default
        const shouldBeDefault = existingAccount.length === 0 || data.isDefault;

        // set all other accounts to not default if needed
        if (shouldBeDefault) {
            await db.account.updateMany({
                where: {
                    userId: user.id,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
        }
        
        // create the account
        const account = await db.account.create({
            data: {
                ...data,
                type: data.type as AccountType,
                isDefault: shouldBeDefault,
                userId: user.id,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, account };

    } catch (error) {
        throw new Error(`Failed to create account: ${error instanceof Error ? error.message : "Unknown error"}`);
        
    }
}

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const serializedAccounts = accounts.map(serializeNumbers);

    return serializedAccounts;

  } catch (error) {
    console.error("Error fetching user accounts:", error);
  }
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeNumbers);
}