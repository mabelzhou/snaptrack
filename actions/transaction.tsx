"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Category } from "@/app/(main)/transaction/create/_components/transaction-form";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export async function scanReceipt(file: File) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    // get the response
    const response = await result.response;
    const text = await response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    console.log("response from Gemini:", cleanedText);

    // parse the JSON response
    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: data.amount.toString(),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }

  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function getTransaction(id: string) {
  try {
    // check user authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // get transaction
    const transaction = await db.transaction.findUnique({
      where: { id, userId: user.id },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return serializeAmount(transaction);

  } catch (error) {
    console.error("Error getting transaction:", error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function updateTransaction(id: string, data: any) {
  try {
    // check user authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // calculate balance change
    const oldBalanceChange = originalTransaction.type === "EXPENSE" 
      ? -originalTransaction.amount.toNumber()
      : originalTransaction.amount.toNumber();

    const newBalanceChange = data.type === "EXPENSE" 
      ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and balance in account
    const transaction = await db.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate: 
            data.isRecurring && data.recurringInterval 
              ? calculateNextRecurringDate(data.date, data.recurringInterval) 
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: Number(originalTransaction.account.balance) + netBalanceChange },
      });

      return updatedTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);
    
    return { success: true, data: serializeAmount(transaction) };

  } catch (error) {
    console.error("Error getting transaction:", error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}