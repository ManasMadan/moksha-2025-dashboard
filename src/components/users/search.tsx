"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IUser } from "@/models/User";
import { useUsers } from "@/hooks/useUsers";
import { UserModal } from "./user.modal";
import { toast } from "sonner";

interface UserComboboxProps {
  onUserSelect: (user: IUser) => void;
  role?: string;
  allowCreate?: boolean;
  defaultValue: IUser | null;
}

export function UserCombobox({
  onUserSelect,
  role,
  allowCreate = false,
  defaultValue,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(defaultValue);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { usersQuery, addUserMutation } = useUsers();

  const filteredUsers =
    usersQuery.data?.filter((user: IUser) => !role || user.role === role) || [];

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
        setIsCreateModalOpen(false);
        toast.success("User added successfully");
      },
    });
  };

  return (
    <>
      {allowCreate && (
        <Button className="ml-4" onClick={() => setIsCreateModalOpen(true)}>
          Create User
        </Button>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUser ? selectedUser.email : "Select user..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user: IUser) => (
                  <CommandItem
                    key={user._id}
                    value={user.email}
                    onSelect={() => {
                      setSelectedUser(user);
                      onUserSelect(user);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUser?._id === user._id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {user.email}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowCreate && (
        <UserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleAddUser}
          initialData={null}
          isLoading={false}
          error={null}
        />
      )}
    </>
  );
}
