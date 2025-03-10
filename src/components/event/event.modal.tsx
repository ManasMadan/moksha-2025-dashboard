"use client";

import React, { useEffect, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IUser } from "@/models/User";
import { UserCombobox } from "../users/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const DAYS = [1, 2, 3];
const CATEGORIES = [
  "Creative Arts",
  "Music",
  "Dance",
  "Theatre",
  "Culture and Lifestyle",
];

const eventSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    owner: z.string().min(1, "Owner is required"),
    day: z.coerce.number().min(1, "Day must be a positive number"),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
    venue: z.string().min(1, "Venue is required"),
    category: z.string().min(1, "Category is required"),
  })
  .refine(
    (data) => {
      const [startHours, startMinutes] = data.startTime.split(":").map(Number);
      const [endHours, endMinutes] = data.endTime.split(":").map(Number);

      return (
        endHours > startHours ||
        (endHours === startHours && endMinutes > startMinutes)
      );
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

type EventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: any;
  isLoading: boolean;
  error: Error | null;
};

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  error,
}: EventModalProps) {
  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: initialData?.name || "",
      owner: initialData?.owner?._id || "",
      day: initialData?.day || 1,
      startTime: initialData?.startTime || "00:00",
      endTime: initialData?.endTime || "01:00",
      venue: initialData?.venue || "",
      category: initialData?.category || "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialData?.name || "",
        owner: initialData?.owner?._id || "",
        day: initialData?.day || 1,
        startTime: initialData?.startTime || "00:00",
        endTime: initialData?.endTime || "01:00",
        venue: initialData?.venue || "",
        category: initialData?.category || "",
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
            {initialData ? "Edit Event" : "Add New Event"}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="owner"
              render={() => (
                <FormItem>
                  <FormLabel>Event Owner</FormLabel>
                  <UserCombobox
                    allowedRoles={["SOCIETY"]}
                    allowCreate={true}
                    onUserSelect={(user: IUser) => {
                      form.setValue("owner", user._id);
                    }}
                    role="SOCIETY"
                    defaultValue={initialData?.owner || null}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="Enter start time"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="Enter end time"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter venue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
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
