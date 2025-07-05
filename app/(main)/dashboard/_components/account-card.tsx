"use client"

import React, { useEffect } from 'react'
import { Account, AccountType } from '@/lib/generated/prisma/client'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import useFetch from '@/hooks/use-fetch';
import { updateDefaultAccount } from '@/actions/accounts';
import { toast } from 'sonner';

type AccountCardProps = {
    name: string;
    type: AccountType;
    balance: number;
    isDefault: boolean;
    id: string;
};

const AccountCard: React.FC<AccountCardProps> = (account) => {

    type UpdateDefaultAccountResult =
  | { success: true; data: any }
  | { success: false; error: unknown };
    
    const {
        loading: updateDefaultLoading,
        fn: updateDefaultFn,
        data,
        error,
    } = useFetch(updateDefaultAccount);

    const updatedAccount = data as unknown as UpdateDefaultAccountResult | null;

    const handleDefaultChange = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (account.isDefault) {
            toast.warning("This is already your default account.");
            return;
        }

        await updateDefaultFn(account.id);
    }

    useEffect(() => {
        if (updatedAccount && updatedAccount.success) {
            toast.success("Default account updated successfully");
        }
    }, [updatedAccount]);

    useEffect(() => {
        if (error) {
            toast.error("Failed to update default account");
        }
    }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${account.id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {account.name}
          </CardTitle>
          
          <div className='flex items-center gap-2'>
            <span className="text-xs gap-1 text-gray-500">Default Account</span>
            <Switch
                checked={account.isDefault}
                onClick={handleDefaultChange}
                disabled={updateDefaultLoading} 
            />
            
          </div>
          
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${account.balance}
          </div>
          <p className="text-xs text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground mt-4">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  )
}

export default AccountCard