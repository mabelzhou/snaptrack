import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import React from 'react'

export async function getCurrentBudget(accountId: string) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch the current budget for the authenticated user
    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Fetch month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    return {
        budget: budget ? {
            ...budget,
            amount: budget.amount.toNumber()
        } : null,
        currentExpenses: expenses._sum.amount ? expenses._sum.amount.toNumber() : 0,
    }

  } catch (error) {
    console.error("Error fetching current budget:", error);
  }
}

export async function updateBudget(amount: number) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update or create budget
    const updatedBudget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
      },
    });

    revalidatePath('/dashboard');
    return {
        success: true,
        data: { ...updateBudget, amount: updatedBudget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return {
        success: false,
        error: "Failed to update budget",
    };
  }
}