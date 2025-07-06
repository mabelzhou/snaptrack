"use client";

import { Account, Transaction } from '@/lib/generated/prisma';
import React, { useState } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type DashboardOverviewProps = {
    accounts: Account[];
    transactions: Transaction[];
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
];

const DashboardOverview = ({ accounts, transactions}: DashboardOverviewProps) => {
    const [selectedAccountId, setSelectedAccountId] = useState(
        accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
    );

    // Filter transactions for the selected account
    const accountTransactions = transactions.filter(
        (transaction) => transaction.accountId === selectedAccountId
    );

    // Get recent transactions (last 5)
    const recentTransactions = accountTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    // expense breakdown
    const currentDate = new Date();
    const currentMonthExpenses = accountTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
            transaction.type === "EXPENSE" &&
            transactionDate.getMonth() === currentDate.getMonth() &&
            transactionDate.getFullYear() === currentDate.getFullYear()
        );
    });

    // group by category
    const expenseByCategory = currentMonthExpenses.reduce((acc, transaction) => {
        const category = transaction.category || "Uncategorized";
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += Number(transaction.amount);
        return acc;
    }, {} as Record<string, number>);

    //format for pie chart
    const pieChartData = Object.entries(expenseByCategory).map(
        ([category, amount]) => ({
            name: category,
            value: amount,
        })
    );
  
    return (
        <div className='grid gap-4 md:grid-cols-2'>
            
            {/* Expenses Chart */}
            <Card className='mb-4'>
                <CardHeader>
                <CardTitle className="text-base font-normal">
                    Monthly Expense Breakdown
                </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-5">
                {pieChartData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                    No expenses this month
                    </p>
                ) : (
                    <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: $${(value ?? 0).toFixed(2)}`}
                        >
                            {pieChartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => `$${Number(value).toFixed(2)}`}
                            contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                )}
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className='mb-4'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-normal">
                        Recent Transactions
                    </CardTitle>
                    <Select
                        value={selectedAccountId}
                        onValueChange={setSelectedAccountId}
                    >
                        <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                        {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                            {account.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentTransactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            No recent transactions
                        </p>
                        ) : (
                        recentTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                    {transaction.description || "Untitled Transaction"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                    {format(new Date(transaction.date), "PP")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                    className={cn(
                                        "flex items-center",
                                        transaction.type === "EXPENSE"
                                        ? "text-red-500"
                                        : "text-green-500"
                                    )}
                                    >
                                    {transaction.type === "EXPENSE" ? (
                                        <ArrowDownRight className="mr-1 h-4 w-4" />
                                    ) : (
                                        <ArrowUpRight className="mr-1 h-4 w-4" />
                                    )}
                                    ${transaction.amount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                    </CardContent>
            </Card>
        </div>
  )
}

export default DashboardOverview