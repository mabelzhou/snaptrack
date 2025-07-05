import { getUserAccounts } from '@/actions/dashboard';
import CreateAccountDrawer from '@/components/create-account-drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import React from 'react'
import AccountCard from './_components/account-card';
import { getCurrentBudget } from '@/actions/budget';
import BudgetProgress from './_components/budget-progress';

async function DashboardPage() {
  const [accounts] = await Promise.all([
    getUserAccounts(),
  ]);

  const defaultAccount = accounts?.find(account => account.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className='px-5'>
      {/* Overview */}

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

        {(accounts ?? []).length > 0 && (accounts ?? []).map((account) => {
          return <AccountCard key={account.id} account={account} />
        })}
      </div>
    </div>
  )
}

export default DashboardPage;