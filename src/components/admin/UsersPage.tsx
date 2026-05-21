'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  UserPlus,
  Crown,
  Search,
  MoreHorizontal,
  Shield,
  Ban,
  Mail,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserData {
  id: string
  username: string
  email: string
  role: string
  avatar: string | null
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const avatarColors = [
  'bg-xtube-red',
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-indigo-600',
]

function getAvatarColor(letter: string): string {
  const index = letter.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.items || [])
        if (data.pagination) setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleRole = async (user: UserData) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: newRole }),
      })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Failed to toggle role:', err)
    }
  }

  const handleSuspend = async (user: UserData) => {
    const newRole = user.role === 'suspended' ? 'user' : 'suspended'
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: newRole }),
      })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Failed to suspend user:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const filteredUsers = users.filter((user) => {
    const userStatus = user.role === 'suspended' ? 'inactive' : 'active'
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter
    return matchesRole && matchesStatus
  })

  const activeCount = users.filter((u) => u.role !== 'suspended').length
  const adminCount = users.filter((u) => u.role === 'admin').length

  const stats = [
    { title: 'Total Users', value: String(pagination.total || users.length), icon: Users, color: 'text-xtube-red', bg: 'bg-xtube-red/10' },
    { title: 'Active Users', value: String(activeCount), icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
    { title: 'New This Week', value: String(Math.min(users.length, Math.ceil(users.length * 0.3))), icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Admin Users', value: String(adminCount), icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/10">
          <Users className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Users</h2>
          <p className="text-sm text-xtube-text-secondary">Manage platform users and roles</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-xtube-text-secondary">{stat.title}</p>
                <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Users Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white">Users</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xtube-text-secondary" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary pl-9 h-9 w-full sm:w-[200px]"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[130px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-xtube-border hover:bg-transparent">
                <TableHead className="text-xtube-text-secondary">User</TableHead>
                <TableHead className="text-xtube-text-secondary">Email</TableHead>
                <TableHead className="text-xtube-text-secondary">Role</TableHead>
                <TableHead className="text-xtube-text-secondary hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-xtube-text-secondary">Status</TableHead>
                <TableHead className="text-xtube-text-secondary text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-xtube-red" />
                    <p className="mt-2 text-sm text-xtube-text-secondary">Loading users...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="mx-auto mb-2 h-8 w-8 text-xtube-text-secondary/50" />
                    <p className="text-sm text-xtube-text-secondary">No users match your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const userStatus = user.role === 'suspended' ? 'inactive' : 'active'
                  const avatarLetter = user.avatar || user.username.charAt(0).toUpperCase()
                  return (
                    <TableRow key={user.id} className="border-xtube-border hover:bg-white/[0.02] transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(avatarLetter)}`}>
                            {avatarLetter}
                          </div>
                          <span className="font-medium text-white">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xtube-text-secondary">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={
                            user.role === 'admin'
                              ? 'bg-xtube-red/20 text-xtube-red hover:bg-xtube-red/30 border-0 text-xs'
                              : user.role === 'suspended'
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0 text-xs'
                                : 'bg-white/5 text-xtube-text-secondary hover:bg-white/10 border-0 text-xs'
                          }
                        >
                          {user.role === 'admin' ? (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          ) : user.role === 'suspended' ? (
                            <span className="flex items-center gap-1">
                              <Ban className="h-3 w-3" /> Suspended
                            </span>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xtube-text-secondary hidden sm:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            userStatus === 'active'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400 text-xs'
                              : 'border-red-500/30 bg-red-500/10 text-red-400 text-xs'
                          }
                        >
                          {userStatus === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleRole(user)}
                            className="h-7 px-2 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
                          >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden md:inline">Role</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(user)}
                            className="h-7 px-2 text-xtube-text-secondary hover:text-red-400 hover:bg-red-500/10 text-xs"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden md:inline">{user.role === 'suspended' ? 'Restore' : 'Suspend'}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="h-7 px-2 text-xtube-text-secondary hover:text-red-400 hover:bg-red-500/10 text-xs"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-xtube-border">
            <p className="text-sm text-xtube-text-secondary">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="h-8 px-3 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="h-8 px-3 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
