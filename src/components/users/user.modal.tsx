"use client";

import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const USER_ROLES = ["SOCIETY", "EM", "TECH"] as const;

const userSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .union([
        z.string().min(6, "Password must be at least 6 characters"),
        z.literal(""),
      ])
      .optional(),
    role: z.enum(USER_ROLES),
  })
  .refine(
    (data) => {
      if (
        data.password &&
        data.password.length > 0 &&
        data.password.length < 6
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Password must be at least 6 characters",
      path: ["password"],
    }
  );

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: any;
  isLoading: boolean;
  error: Error | null;
  allowedRoles?: string[];
};

export function UserModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  error,
  allowedRoles = [...USER_ROLES],
}: UserModalProps) {
  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialData?.email || "",
      password: "",
      role: initialData?.role || "SOCIETY",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        email: initialData?.email || "",
        password: "",
        role: initialData?.role || "SOCIETY",
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: any) => {
    onSubmit({
      ...data,
      id: initialData?.id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit User" : "Add New User"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map(
                        (role) =>
                          allowedRoles.includes(role) && (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : initialData ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
