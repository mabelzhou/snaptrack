"use client";

import React, { useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Pencil, X } from 'lucide-react';
import useFetch from '@/hooks/use-fetch';
import { updateBudget } from '@/actions/budget';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress"

type BudgetProgressProps = {
  initialBudget: {
    amount: number;
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    lastAlertSent: Date | null;
  } | null;
  currentExpenses: number;
};

const BudgetProgress = ({ initialBudget, currentExpenses }: BudgetProgressProps) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [newBudget, setNewBudget] = React.useState<number>(Number(initialBudget?.amount));

    const {
        loading: isLoading,
        fn: updateBudgetFn,
        data: updatedBudget,
        error,
    } = useFetch(updateBudget);

    const percentageUsed =
        initialBudget !== null && currentExpenses !== null
            ? (currentExpenses / Number(initialBudget.amount)) * 100
            : 0;

    const handleUpdateBudget = async () => {
        const amount = parseFloat(newBudget.toString());

        if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
        }

        await updateBudgetFn(amount);
    };

    const handleCancel = () => {
        setNewBudget(Number(initialBudget?.amount || 0));
        setIsEditing(false);
    }

    useEffect(() => {
        if ((updatedBudget as any)?.success) {
            setIsEditing(false);
            toast.success("Budget updated successfully");
        }
    }, [updatedBudget]);

    useEffect(() => {
        if (error) {
        toast.error("Failed to update budget");
        }
    }, [error]);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">
            Monthly Budget (Default Account)
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                  className="w-32"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
                  {initialBudget
                    ? `$${currentExpenses.toFixed(
                        2
                      )} of $${initialBudget.amount.toFixed(2)} spent`
                    : "No budget set"}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
            <Progress
              value={percentageUsed}
              className={`${
                percentageUsed >= 90
                  ? "bg-red-500"
                  : percentageUsed >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            />
            <p className="text-xs text-muted-foreground text-right">
              {percentageUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BudgetProgress