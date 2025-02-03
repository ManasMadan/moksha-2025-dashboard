"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function SettingsPage() {
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
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
