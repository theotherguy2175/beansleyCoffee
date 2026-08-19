import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUser, useResetPassword, useUsers } from "@/hooks/useUsers";
import { ApiError } from "@/lib/api";
import type { PublicUser } from "@/types/api";

function ResetPasswordDialog({ user }: { user: PublicUser }) {
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);
  const resetPassword = useResetPassword();

  async function handleSubmit() {
    try {
      await resetPassword.mutateAsync({ id: user.id, newPassword: password });
      toast.success(`Password reset for ${user.email}`);
      setOpen(false);
      setPassword("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't reset password");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <KeyRound className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {user.name}</DialogTitle>
          <DialogDescription>Set a new password for this account.</DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="New password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={password.length < 8} loading={resetPassword.isPending}>
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({ user, currentUserId }: { user: PublicUser; currentUserId: number | undefined }) {
  const deleteUser = useDeleteUser();

  async function handleDelete(id: number) {
    try {
      await deleteUser.mutateAsync(id);
      toast.success("User deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete user");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link to={`/admin/users/${user.id}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <ResetPasswordDialog user={user} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" disabled={user.id === currentUserId}>
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();

  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button asChild>
          <Link to="/admin/users/new">Add user</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}

      {!isLoading && users && (
        <>
          {/* Mobile: cards */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate text-sm">{user.email}</p>
                  </div>
                  <UserActions user={user} currentUserId={currentUser?.id} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Table className="mt-6 hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <UserActions user={user} currentUserId={currentUser?.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
