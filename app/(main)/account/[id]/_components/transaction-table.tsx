"use client";

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from '@/components/ui/checkbox';
import { categoryColors } from '@/data/categories';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Clock, MoreHorizontal, RefreshCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: keyof typeof categoryColors;
  amount: string | number;
  recurring: boolean;
  type: 'EXPENSE' | 'INCOME';
  isRecurring: boolean;
  recurringInterval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextRecurringDate: string;
};

const RECURRING_INTERVALS = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

type TransactionTableProps = {
  transactions: Transaction[];
}

const TransactionTable = ({transactions}: TransactionTableProps) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  const filteredAndSortedTransactions = transactions; 

  const handleSort = (field: string) => {
    setSortConfig((current) => {
      const direction =
        current?.field === field && current?.direction === 'asc' ? 'desc' : 'asc';
      return { field, direction };
    });
  };

  const handleSelect= (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((selectedId) => selectedId !== id);
      } else {
        return [...current, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedTransactions.map((t) => t.id));
    }
  };

  console.log('Selected IDs:', selectedIds);

  return (
    <div className='space-y-8'>
      {/* Filters */}

      {/* Transactions */}
      <div className='rounded-md border'> 
        <Table>

          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedIds.length === filteredAndSortedTransactions.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead 
                className='cursor-pointer'
                onClick={() => handleSort('date')}
              >
                <div className='flex items-center'>
                  Date {sortConfig?.field ==='date' && 
                    (sortConfig.direction === 'asc' ? '↑' : '↓')
                  }
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead 
                className='cursor-pointer'
                onClick={() => handleSort('category')}
              >
                <div className='flex items-center'>
                  Category{' '} 
                  {sortConfig?.field ==='category' && 
                    (sortConfig.direction === 'asc' ? '↑' : '↓')
                  }
                </div>
              </TableHead>
              <TableHead 
                className='cursor-pointer'
                onClick={() => handleSort('amount')}
              >
                <div className='flex items-center'>
                  Amount {sortConfig?.field ==='amount' && 
                    (sortConfig.direction === 'asc' ? '↑' : '↓')
                  }
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className='w-[50px]'/>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
                </TableRow>
              ) : (
              filteredAndSortedTransactions.map((transaction: Transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="w-[50px]">
                    <Checkbox 
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right',
                      transaction.type === 'EXPENSE'
                        ? 'text-red-500'
                        : 'text-green-500'
                    )}
                  >
                    {transaction.type === 'EXPENSE'? '-' : '+'}
                    ${parseFloat(transaction.amount as string).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              {RECURRING_INTERVALS[transaction.recurringInterval]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date:</div>
                              <div>
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  "PPP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>

                  {/* Options dropdown */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontal className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => 
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )   
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className='text-destructive' 
                          onClick={() => {
                            console.log(`Delete transaction with id: ${transaction.id}`);
                          }}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}

            <TableRow>
              
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default TransactionTable