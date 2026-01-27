'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { createUserSchema, type CreateUserInput } from '@/lib/validations'
import type { User } from '@/lib/database.types'

interface NewUserModalProps {
  onUserCreated: (user: User) => void
}

export function NewUserModal({ onUserCreated }: NewUserModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdUser, setCreatedUser] = useState<User | null>(null)

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true)

    try {
      const { data: userData, error: supabaseError } = await supabase
        .from('users')
        .insert({
          name: data.name.trim(),
          email: data.email?.trim() || null,
        })
        .select()
        .single()

      if (supabaseError) {
        // Handle duplicate name error
        if (supabaseError.code === '23505') {
          form.setError('name', {
            type: 'manual',
            message: 'A soul with this name already exists. Please choose a different name.',
          })
        } else {
          form.setError('root', {
            type: 'manual',
            message: supabaseError.message,
          })
        }
        return
      }

      if (userData) {
        setCreatedUser(userData)
        setShowSuccess(true)
        onUserCreated(userData)

        // Auto-navigate after showing success message
        setTimeout(() => {
          setOpen(false)
          setShowSuccess(false)
          form.reset()
          router.push(`/tracker/${userData.id}`)
        }, 1500)
      }
    } catch (err) {
      form.setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      form.reset()
      setShowSuccess(false)
      setCreatedUser(null)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Soul
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {showSuccess ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Welcome, {createdUser?.name}!
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Your spiritual journey begins now.
              <br />
              Redirecting to your tracker...
            </p>
          </div>
        ) : (
          // Form State
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Welcome, New Soul</DialogTitle>
                <DialogDescription>
                  Enter your name to start tracking your spiritual journey.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          autoFocus
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be displayed on the leaderboard.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        For account recovery and notifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Root/Server Error */}
                {form.formState.errors.root && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-600">
                      {form.formState.errors.root.message}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Begin Journey'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
