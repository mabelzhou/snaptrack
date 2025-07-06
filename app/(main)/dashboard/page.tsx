import { getDashboardData, getUserAccounts } from '@/actions/dashboard';
import CreateAccountDrawer from '@/components/create-account-drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import React, { Suspense } from 'react'
import AccountCard from './_components/account-card';
import { getCurrentBudget } from '@/actions/budget';
import BudgetProgress from './_components/budget-progress';
import DashboardOverview from './_components/transaction-overview';

async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData()
  ]);

  const defaultAccount = accounts?.find(account => account.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className='px-5'>
      {/* Budget Progress */}
      {defaultAccount && (
        <div className='pb-4'>
          <BudgetProgress
            initialBudget={
              budgetData?.budget
                ? {
                    ...budgetData.budget,
                    amount: Number(budgetData.budget.amount),
                  }
                : null
            }
            currentExpenses={budgetData?.currentExpenses || 0}
          />
        </div>
      )}

      {/* Overview */}
      <Suspense fallback={"Loading Overview..."}>
        <DashboardOverview 
          accounts={accounts ?? []}
          transactions={transactions || []}
        />
      </Suspense>

      {/* Accounts */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <CreateAccountDrawer>
          <Card className='hover:shadow-md transition-shadow duration-200 ease-in-out cursor-pointer'>
            <CardContent className='flex flex-col items-center justify-center h-full text-center'>
              <Plus className='h-10 w-10 mb-2' />
              <p className='text-sm font-medium'>Add Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts?.map((account) => (
          <AccountCard
            key={account.id}
            account={{
              id: account.id,
              name: account.name,
              balance: Number(account.balance),
              isDefault: account.isDefault,
              type: account.type,
              userId: account.userId,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default DashboardPage;