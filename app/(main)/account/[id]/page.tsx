import { getAccountWithTransactions } from '@/actions/accounts';
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react'
import { BarLoader } from 'react-spinners';
import TransactionTable from './_components/transaction-table';
import AccountChart from './_components/account-chart';

export default async function AccountsPage ({params}: { params: {id: string}}) {
    const accountId = params.id;
    const accountData = await getAccountWithTransactions(accountId);

    if (!accountData) {
        notFound();
    }

    const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-5">
        <div className="flex gap-4 items-end justify-between">
            <div>
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight capitalize">
                    {account.name}
                </h1>
                <p className="text-muted-foreground">
                    {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
                    Account
                </p>
            </div>

            <div className="text-right pb-2">
                <div className="text-xl sm:text-2xl font-bold">
                    ${Number(account.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </div>
                <p className="text-sm text-muted-foreground">
                    {account._count.transactions} Transactions
                </p>
            </div>
        </div>

        {/* Charts Section */}
        <Suspense
            fallback={<BarLoader className="mt-4" width={"100%"} color="green" />}
        >
            <AccountChart transactions={transactions}/>
        </Suspense>

        {/* Transactions Section */}
        <Suspense
            fallback={<BarLoader className="mt-4" width={"100%"} color="green" />}
        >
            <TransactionTable transactions={transactions}/>
        </Suspense>
    </div>

    
  )
}