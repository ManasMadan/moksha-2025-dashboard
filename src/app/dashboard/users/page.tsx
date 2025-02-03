"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { UserModal } from "@/components/users/user.modal";
import { DeleteConfirmModal } from "@/components/users/delete.modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useUsers } from "@/hooks/useUsers";

interface User {
  _id: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<User | null>(null);

  const {
    usersQuery: { data: usersData, isLoading, isError, error },
    addUserMutation,
    updateUserMutation,
    deleteUserMutation,
  } = useUsers();

  const handleAddUser = (newUserData: {
    email: string;
    role: string;
    password?: string;
  }) => {
    const formData = new FormData();
    formData.append("email", newUserData.email);
    formData.append("role", newUserData.role);
    if (newUserData.password) {
      formData.append("password", newUserData.password);
    }

    addUserMutation.mutate(formData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        toast.success("User added successfully");
      },
    });
  };

  const handleEditUser = (updatedUserData: {
    email: string;
    role: string;
    password?: string;
  }) => {
    const formData = new FormData();
    formData.append("userId", editingUser?._id || "");
    formData.append("email", updatedUserData.email);
    formData.append("role", updatedUserData.role);
    if (updatedUserData.password) {
      formData.append("password", updatedUserData.password);
    }

    updateUserMutation.mutate(formData, {
      onSuccess: () => {
        setEditingUser(null);
        toast.success("User updated successfully");
      },
    });
  };

  const handleDeleteUser = () => {
    if (!deleteUserData?._id) return;

    const formData = new FormData();
    formData.append("userId", deleteUserData._id);

    deleteUserMutation.mutate(formData, {
      onSuccess: () => {
        setDeleteUserData(null);
        toast.success("User deleted successfully");
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1>User Management</h1>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full mb-2" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading users: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersData?.map((user: User) => (
              <TableRow key={user._id}>
                <TableCell>{user.email}</TableCell>
                <TableCell className="font-semibold">{user.role}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeleteUserData(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
        initialData={null}
        isLoading={addUserMutation.isPending}
        error={addUserMutation.error as Error | null}
      />

      <UserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUser}
        initialData={editingUser}
        isLoading={updateUserMutation.isPending}
        error={updateUserMutation.error as Error | null}
      />

      <DeleteConfirmModal
        isOpen={!!deleteUserData}
        onClose={() => setDeleteUserData(null)}
        email={deleteUserData?.email || ""}
        onConfirm={handleDeleteUser}
        isLoading={deleteUserMutation.isPending}
        error={deleteUserMutation.error as Error | null}
      />
    </div>
  );
}
