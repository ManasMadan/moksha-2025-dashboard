"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateEventSociety } from "@/server/event";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const customInputSchema = z.object({
  type: z.enum([
    "shortText",
    "select",
    "number",
    "email",
    "phone",
    "longText",
    "file",
    "date",
    "link",
    "time",
  ]),
  label: z.string().min(1, "Label is required"),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(), // for select type
  fileType: z.enum(["pdf", "image", "video"]).optional(), // for file type
  maxSize: z.number().optional(), // for file type
});

const eventSchema = z
  .object({
    acceptingRegistrations: z.boolean(),
    imageData: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    isTeamEvent: z.boolean(),
    minNumberOfTeamMembers: z
      .number()
      .min(1, "Minimum number of team members must be at least 1")
      .optional(),
    maxNumberOfTeamMembers: z
      .number()
      .min(1, "Maximum number of team members must be at least 1")
      .optional(),
    customInputs: z.array(customInputSchema).optional(),
  })
  .refine(
    (data) => {
      if (
        data.isTeamEvent &&
        data.minNumberOfTeamMembers &&
        data.maxNumberOfTeamMembers
      ) {
        return data.maxNumberOfTeamMembers >= data.minNumberOfTeamMembers;
      }

      if (!data.isTeamEvent) {
        data.minNumberOfTeamMembers = 1;
        data.maxNumberOfTeamMembers = 1;
        return true;
      }
      return true;
    },
    {
      message:
        "Maximum team members must be greater than or equal to minimum team members",
      path: ["maxNumberOfTeamMembers"],
    }
  );

type Props = {
  event: any;
};

export default function EditEventForm({ event }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Set image preview from either imageData or imageKey
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    if (event.imageData) return event.imageData;
    if (event.imageKey) return `/api/images/${event.imageKey}`;
    return null;
  });

  const [imageError, setImageError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      acceptingRegistrations: event.acceptingRegistrations,
      imageData: event.imageData || event.imageKey || "",
      description: event.description || "",
      isTeamEvent: event.isTeamEvent,
      minNumberOfTeamMembers: Number(event.minNumberOfTeamMembers) || undefined,
      maxNumberOfTeamMembers: Number(event.maxNumberOfTeamMembers) || undefined,
      customInputs: event.customInputs || [],
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setImageError("Image size must be less than 5MB");
      e.target.value = "";
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      form.setValue("imageData", base64String);
    };
    reader.readAsDataURL(file);
  };

  const addCustomInput = () => {
    form.setValue("customInputs", [
      ...form.getValues("customInputs"),
      { type: "shortText", label: "", required: false },
    ]);
  };

  const removeCustomInput = (index: number) => {
    const customInputs = form.getValues("customInputs");
    customInputs.splice(index, 1);
    form.setValue("customInputs", customInputs);
  };

  const handleCustomInputChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const customInputs = form.getValues("customInputs");
    customInputs[index] = { ...customInputs[index], [field]: value };
    form.setValue("customInputs", customInputs);
  };

  const addOption = (index: number) => {
    const customInputs = form.getValues("customInputs");
    customInputs[index].options = customInputs[index].options || [];
    customInputs[index].options.push("");
    form.setValue("customInputs", customInputs);
  };

  const removeOption = (index: number, optionIndex: number) => {
    const customInputs = form.getValues("customInputs");
    customInputs[index].options?.splice(optionIndex, 1);
    form.setValue("customInputs", customInputs);
  };

  const handleOptionChange = (
    index: number,
    optionIndex: number,
    value: string
  ) => {
    const customInputs = form.getValues("customInputs");
    if (customInputs[index].options) {
      customInputs[index].options[optionIndex] = value;
    }
    form.setValue("customInputs", customInputs);
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("eventId", event._id);
      formData.append(
        "acceptingRegistrations",
        data.acceptingRegistrations.toString()
      );

      // Include the existing imageKey if no new image has been uploaded
      // or the new imageData if a new image has been uploaded
      const imageValue = data.imageData.startsWith("data:")
        ? data.imageData // New image uploaded (base64)
        : event.imageKey || data.imageData; // Keep existing key

      formData.append("imageData", imageValue);
      formData.append("description", data.description);
      formData.append("isTeamEvent", data.isTeamEvent.toString());

      if (data.minNumberOfTeamMembers) {
        formData.append(
          "minNumberOfTeamMembers",
          data.minNumberOfTeamMembers.toString()
        );
      }

      if (data.maxNumberOfTeamMembers) {
        formData.append(
          "maxNumberOfTeamMembers",
          data.maxNumberOfTeamMembers.toString()
        );
      }

      formData.append("customInputs", JSON.stringify(data.customInputs));

      const response = await updateEventSociety(formData);
      if (!response.success) {
        throw new Error(response.message);
      }
      toast.success("Event updated successfully");
      router.push("/dashboard/my-events");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="acceptingRegistrations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accepting Registrations</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageData"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      {...fieldProps}
                    />
                    {imageError && (
                      <p className="text-sm text-red-500">{imageError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 5MB
                    </p>
                    {imagePreview && (
                      <div className="mt-2">
                        <p className="text-sm mb-1">Preview:</p>
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="max-w-xs max-h-48 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isTeamEvent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Is Team Event</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("isTeamEvent") && (
            <>
              <FormField
                control={form.control}
                name="minNumberOfTeamMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Number of Team Members</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter minimum number of team members"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxNumberOfTeamMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Number of Team Members</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter maximum number of team members"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <Button type="button" onClick={addCustomInput}>
            Add Custom Input
          </Button>
          {form.watch("customInputs").map((input: any, index: number) => (
            <div key={index} className="space-y-4">
              <FormField
                control={form.control}
                name={`customInputs.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) =>
                          handleCustomInputChange(index, "type", e.target.value)
                        }
                      >
                        <option value="shortText">Short Text</option>
                        <option value="select">Select</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="longText">Long Text</option>
                        <option value="file">File</option>
                        <option value="date">Date</option>
                        <option value="link">Link</option>
                        <option value="time">Time</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`customInputs.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter label"
                        value={field.value || ""}
                        onChange={(e) =>
                          handleCustomInputChange(
                            index,
                            "label",
                            e.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`customInputs.${index}.placeholder`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter placeholder"
                        value={field.value || ""}
                        onChange={(e) =>
                          handleCustomInputChange(
                            index,
                            "placeholder",
                            e.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`customInputs.${index}.required`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) =>
                          handleCustomInputChange(index, "required", value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {input.type === "select" && (
                <FormItem>
                  <FormLabel>Options</FormLabel>
                  {input.options?.map((option: string, optionIndex: number) => (
                    <div
                      key={optionIndex}
                      className="flex items-center space-x-2"
                    >
                      <Input
                        placeholder="Enter option"
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, optionIndex, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        onClick={() => removeOption(index, optionIndex)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" onClick={() => addOption(index)}>
                    Add Option
                  </Button>
                </FormItem>
              )}
              {input.type === "file" && (
                <>
                  <FormField
                    control={form.control}
                    name={`customInputs.${index}.fileType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Type</FormLabel>
                        <FormControl>
                          <select
                            value={field.value || ""}
                            onChange={(e) =>
                              handleCustomInputChange(
                                index,
                                "fileType",
                                e.target.value
                              )
                            }
                          >
                            <option value="pdf">PDF</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`customInputs.${index}.maxSize`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Size (in MB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter max file size"
                            value={field.value || ""}
                            onChange={(e) =>
                              handleCustomInputChange(
                                index,
                                "maxSize",
                                Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button type="button" onClick={() => removeCustomInput(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Update Event"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
