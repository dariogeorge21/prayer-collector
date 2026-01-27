'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/database.types'

interface NewUserModalProps {
  onUserCreated: (user: User) => void
}

export function NewUserModal({ onUserCreated }: NewUserModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          email: email.trim() || null,
        })
        .select()
        .single()

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('A user with this name already exists')
        } else {
          setError(supabaseError.message)
        }
        return
      }

      if (data) {
        onUserCreated(data)
        setOpen(false)
        setName('')
        setEmail('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Soul
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Welcome, New Soul</DialogTitle>
            <DialogDescription>
              Enter your name to start tracking your spiritual journey.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Begin Journey'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
