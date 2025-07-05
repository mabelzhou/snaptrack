"use client"

import React from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { accountSchema } from '@/app/lib/schema'
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import useFetch from '@/hooks/use-fetch'
import { createAccount } from '@/actions/dashboard'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateAccountDrawerProps {
  children: React.ReactNode;
}

const CreateAccountDrawer = ({children}: CreateAccountDrawerProps) => {
    const [open, setOpen] = React.useState(false);

    const { 
        register, 
        handleSubmit, 
        formState: {errors}, 
        setValue,
        watch,
        reset
    } = useForm({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: "",
            type: "CHEQUEING",
            balance: 0,
            isDefault: false,
        }
    });

    const {
        loading: createAccountLoading,
        fn: createAccountFn,
        error,
        data: newAccount,
    } = useFetch(createAccount);

    React.useEffect(() => {
        if (newAccount) {
            toast.success("Account created successfully!");
            setOpen(false);
            reset();
        }
    }, [newAccount, reset]);

    React.useEffect(() => {
        if (error) {
            toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
        }
    }, [error]);

    const onSubmit = async (data: any) => {
        await createAccountFn(data);
    }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Create New Account</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
                <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}> 
                    <div className='space-y-2'>
                        <label htmlFor='name' className='text-sm font-medium'>Account Name</label>
                        <Input 
                            id='name' 
                            type='text' 
                            {...register("name")} 
                        />
                        {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
                    </div>

                    <div className='space-y-2'>
                        <label 
                            htmlFor='type' 
                            className='text-sm font-medium'
                        >
                            Account Name
                        </label>
                        <Select onValueChange={(value) => setValue("type", value as "CHEQUEING" | "SAVINGS")}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CHEQUEING">CHEQUEING</SelectItem>
                                <SelectItem value="SAVINGS">SAVINGS</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className='text-red-500 text-sm'>{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2">
                    <label
                        htmlFor="balance"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Initial Balance
                    </label>
                    <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("balance", {valueAsNumber: true})}
                    />
                    {errors.balance && (
                        <p className="text-sm text-red-500">{errors.balance.message}</p>
                    )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <label
                        htmlFor="isDefault"
                        className="text-base font-medium cursor-pointer"
                        >
                        Set as Default
                        </label>
                        <p className="text-sm text-muted-foreground">
                        This account will be selected by default for transactions
                        </p>
                    </div>
                    <Switch
                        id="isDefault"
                        checked={watch("isDefault")}
                        onCheckedChange={(checked) => setValue("isDefault", checked)}
                    />
                    </div>

                    <div className='flex gap-2 mt-2'>
                        <DrawerClose asChild>
                            <Button type="button" variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={createAccountLoading}
                        >
                            {createAccountLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </DrawerContent>
    </Drawer>
  )
}

export default CreateAccountDrawer