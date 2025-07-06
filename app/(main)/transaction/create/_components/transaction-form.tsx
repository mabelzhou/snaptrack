"use client"

import { createTransaction } from '@/actions/transaction'
import { transactionSchema } from '@/app/lib/schema'
import useFetch from '@/hooks/use-fetch'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Account } from '@/lib/generated/prisma'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export type Category = {
    id: string;
    name: string;
    type: string;
    color: string;
    icon: string;
    subcategories?: string[];
}

type AddTransactionFormProps = {
    accounts: Account[];
    categories: Category[];
    editMode?: boolean;
    initialData?: any;
}

const AddTransactionForm = ({
    accounts,
    categories,
    editMode = false,
    initialData = null,
} : AddTransactionFormProps) => {
    const router = useRouter();

    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors },
        watch,
        getValues,
        reset,
    } = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'EXPENSE',
            amount: '',
            description: '',
            date: new Date(),
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            category: initialData?.category,
            isRecurring: false,
            recurringInterval: undefined,
        },
    })

    type TransactionResult = {
        success: boolean;
        data?: { accountId: string };
        [key: string]: any;
    };

    const {
        loading: transactionLoading,
        fn: transactionFn,
        data: transactionResult,
    } = useFetch(createTransaction);

    useEffect(() => {
        if ((transactionResult as any)?.success && !transactionLoading) {
        toast.success(
            editMode
            ? "Transaction updated successfully"
            : "Transaction created successfully"
        );
        reset();
        if (transactionResult && (transactionResult as any).data) {
          router.push(`/account/${(transactionResult as any).data.accountId}`);
        }
        }
    }, [transactionResult, transactionLoading, editMode]);

    const type = watch('type');
    const isRecurring = watch('isRecurring');
    const date = watch('date');

    const filteredCategories = categories.filter(
        (category) => category.type === type
    );

    const onSubmit = (data: any) => {
        const formData = {
        ...data,
        amount: parseFloat(data.amount),
        };
        transactionFn(formData);
    };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
        {/* AI receipt scanner */}
        <div className='space-y-2'>
            <label className='text-sm font-md'>Type</label>
            <Select>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
            </Select>

            {errors.type && (
                <p className='text-red-500 text-sm'>{errors.type.message}</p>
            )}
        </div>

        {/* Amount and Account */}
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("amount")}
                />
                {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                <Select
                    onValueChange={(value) => setValue("accountId", value)}
                    defaultValue={getValues("accountId")}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                    {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            {`${account.name} $${Number(account.balance).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}`}
                        </SelectItem>
                    ))}
                    <CreateAccountDrawer>
                        <Button
                        variant="ghost"
                        className="w-full"
                        >
                        Create Account
                        </Button>
                    </CreateAccountDrawer>
                    </SelectContent>
                </Select>
                {errors.accountId && (
                    <p className="text-sm text-red-500">{errors.accountId.message}</p>
                )}
            </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
            onValueChange={(value) => setValue("category", value)}
            defaultValue={getValues("category")}
            >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
                {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                    {category.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
            {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
        </div>

        {/* Date */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    className={cn(
                        "w-full pl-3 text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => { if (date) setValue("date", date); }}
                        disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                        }
                    />
                </PopoverContent>
            </Popover>
            {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
        </div>

        {/* Description */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input placeholder="Enter description" {...register("description")} />
            {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
        </div>

         {/* Recurring Toggle */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
            <label className="text-base font-sm">Recurring Transaction</label>
            <div className="text-xs text-muted-foreground">
                Set up a recurring schedule for this transaction
            </div>
            </div>
            <Switch
            checked={isRecurring}
            onCheckedChange={(checked) => setValue("isRecurring", checked)}
            />
        </div>

        {/* Recurring Interval */}
        {isRecurring && (
            <div className="space-y-2">
            <label className="text-sm font-medium">Recurring Interval</label>
            <Select
                onValueChange={(value) => setValue("recurringInterval", value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")}
                defaultValue={getValues("recurringInterval")}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
            </Select>
            {errors.recurringInterval && (
                <p className="text-sm text-red-500">
                {errors.recurringInterval.message}
                </p>
            )}
            </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 w-full justify-end mt-4">
            <Button
            type="button"
            variant="outline"
            className='flex-1'
            onClick={() => router.back()}
            >
                Cancel
            </Button>
            <Button className='flex-1' type="submit" disabled={transactionLoading}>
            {transactionLoading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode ? "Updating..." : "Creating..."}
                </>
            ) : editMode ? (
                "Update Transaction"
            ) : (
                "Create Transaction"
            )}
            </Button>
        </div>

    </form>
  )
}

export default AddTransactionForm