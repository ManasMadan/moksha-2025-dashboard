"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { PasswordModal } from "@/components/users/password.modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useUsers } from "@/hooks/useUsers";

export default function SettingsPage() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { updatePasswordMutation } = useUsers();

  const handlePasswordUpdate = (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const formData = new FormData();
    formData.append("currentPassword", passwordData.currentPassword);
    formData.append("newPassword", passwordData.newPassword);

    updatePasswordMutation.mutate(formData, {
      onSuccess: () => {
        setIsPasswordModalOpen(false);
        toast.success("Password updated successfully");
      },
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="max-w-sm">
        <CardHeader className="flex flex-row items-center space-x-4">
          <Lock className="w-6 h-6 text-red-500" />
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setIsPasswordModalOpen(true)}
            disabled={updatePasswordMutation.isPending}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordUpdate}
        isLoading={updatePasswordMutation.isPending}
        error={updatePasswordMutation.error as Error | null}
      />
    </div>
  );
}
