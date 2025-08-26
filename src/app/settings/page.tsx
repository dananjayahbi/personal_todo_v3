"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { User, Mail, LogOut, Shield, Bell, Palette, Database, Download, Upload, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [settings, setSettings] = useState({
    taskDueReminders: true,
  })
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Initialize profile data when session is loaded
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
      })
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const handleSwitchChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleProfileUpdate = async () => {
    setProfileLoading(true)
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          currentEmail: session?.user?.email,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully. The page will refresh to show the changes.",
        })

        // Update the session with new data
        await update({
          name: profileData.name,
          email: profileData.email,
        })

        // If email was changed, sign out and redirect to login
        if (profileData.email !== session?.user?.email) {
          setTimeout(async () => {
            await signOut({ redirect: false })
            window.location.href = '/login'
          }, 2000)
        } else {
          // Just refresh the page to show the changes
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          email: session?.user?.email,
        }),
      })

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully. Please log in again with your new password.",
        })
        
        // Sign out after password change for security
        setTimeout(async () => {
          await signOut({ redirect: false })
          window.location.href = '/login'
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update password')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleBackupDatabase = async () => {
    try {
      const response = await fetch('/api/backup', {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `taskpro-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Backup created",
          description: "Database backup has been downloaded successfully.",
        })
      } else {
        throw new Error('Failed to create backup')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRestoreDatabase = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Database restored",
          description: "Database has been restored successfully. Page will reload.",
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        throw new Error('Failed to restore database')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore database. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportTasks = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Tasks imported",
          description: `Successfully imported ${result.count} tasks.`,
        })
      } else {
        throw new Error('Failed to import tasks')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import tasks. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!session) {
    return null
  }
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Profile & Settings</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg">
                      {session.user?.name?.split(' ').map(n => n[0]).join('') || 
                       session.user?.email?.split('@')[0].slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">
                      {session.user?.name || 'Personal User'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {session.user?.email}
                      </span>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <Shield className="h-3 w-3 mr-1" />
                      Personal Account
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Account Type</h4>
                    <p className="text-sm text-muted-foreground">
                      This is a personal TaskPro account for individual task management.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Your account is secured with authentication. Only you can access your tasks and data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Update Profile</CardTitle>
                <CardDescription>
                  Change your name and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing your email will require you to log in again
                  </p>
                </div>
                
                <Button onClick={handleProfileUpdate} disabled={profileLoading}>
                  {profileLoading ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button onClick={handlePasswordUpdate} disabled={passwordLoading}>
                  {passwordLoading ? "Updating..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Due Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks are due
                    </p>
                  </div>
                  <Switch
                    checked={settings.taskDueReminders}
                    onCheckedChange={(checked) => handleSwitchChange("taskDueReminders", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Database Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Backup, restore, and import your task data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Backup Database</h4>
                    <p className="text-sm text-muted-foreground">
                      Download a backup of all your tasks and data
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleBackupDatabase}>
                    <Download className="h-4 w-4 mr-2" />
                    Backup
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Restore Database</h4>
                    <p className="text-sm text-muted-foreground">
                      Replace all current data with a backup file
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleRestoreDatabase(file)
                          e.target.value = ''
                        }
                      }}
                      style={{ display: 'none' }}
                      id="restore-input"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('restore-input')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Import Tasks</h4>
                    <p className="text-sm text-muted-foreground">
                      Merge tasks from a backup file with current data
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImportTasks(file)
                          e.target.value = ''
                        }
                      }}
                      style={{ display: 'none' }}
                      id="import-input"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('import-input')?.click()}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your session and account access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Sign Out</h4>
                      <p className="text-sm text-muted-foreground">
                        End your current session and return to the login page
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="ml-4"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* App Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  About TaskPro
                </CardTitle>
                <CardDescription>
                  Application information and version
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Built with:</span>
                    <span>Next.js, TypeScript, Tailwind CSS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span>SQLite with Prisma</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}