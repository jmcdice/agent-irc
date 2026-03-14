'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Activity,
  Zap,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  ArrowRight,
  Clock,
  UserPlus,
  Settings,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

// Mock data for the activity feed
const recentActivity = [
  { id: 1, action: 'User registered', user: 'alice@example.com', time: '2 minutes ago', type: 'success' },
  { id: 2, action: 'Login attempt', user: 'bob@example.com', time: '15 minutes ago', type: 'info' },
  { id: 3, action: 'Profile updated', user: 'carol@example.com', time: '1 hour ago', type: 'info' },
  { id: 4, action: 'Password changed', user: 'dave@example.com', time: '3 hours ago', type: 'warning' },
  { id: 5, action: 'New session started', user: 'eve@example.com', time: '5 hours ago', type: 'info' },
];

// Getting started checklist
const checklistItems = [
  { id: 1, label: 'Create your account', completed: true },
  { id: 2, label: 'Customize your profile', completed: false },
  { id: 3, label: 'Invite team members', completed: false },
  { id: 4, label: 'Configure integrations', completed: false },
  { id: 5, label: 'Deploy to production', completed: false },
];

const completedCount = checklistItems.filter(item => item.completed).length;
const progressPercent = (completedCount / checklistItems.length) * 100;

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your application
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">2,543</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="ml-1 text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">148</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <span className="text-muted-foreground">Live now</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Calls (24h)</p>
                <p className="text-2xl font-bold">12.4k</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">+8%</span>
              <span className="ml-1 text-muted-foreground">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">99.9%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                All systems operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed + Getting Started */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in your application</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                    item.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                    item.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Activity className={`h-4 w-4 ${
                      item.type === 'success' ? 'text-green-600 dark:text-green-400' :
                      item.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-slate-600 dark:text-slate-400'
                    }`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.user}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Checklist */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Complete these steps to set up your app</CardDescription>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {completedCount}/{checklistItems.length}
              </span>
            </div>
            <Progress value={progressPercent} className="mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                    item.completed
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={`flex-1 text-sm ${
                    item.completed ? 'text-muted-foreground line-through' : ''
                  }`}>
                    {item.label}
                  </span>
                  {!item.completed && (
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      Start
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/users" className="block">
          <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings" className="block">
          <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure your application</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="block">
          <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                  <BookOpen className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Documentation</h3>
                  <p className="text-sm text-muted-foreground">Learn how to use the template</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  );
}

