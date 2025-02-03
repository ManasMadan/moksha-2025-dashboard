import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  updateUser,
  deleteUser,
  addUser,
  updateUserPassword,
} from "@/server/user";

export function useUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await getUsers();
      if (!response.success) {
        throw new Error(response.message);
      }
      return JSON.parse(response?.data as string) || [];
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      const response = await addUser(userData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      const response = await updateUser(userData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return JSON.parse(response?.data as string) || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      const response = await deleteUser(userData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      const response = await updateUserPassword(userData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    usersQuery,
    addUserMutation,
    updateUserMutation,
    deleteUserMutation,
    updatePasswordMutation,
  };
}
