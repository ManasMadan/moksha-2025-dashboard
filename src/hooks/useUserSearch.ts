import { searchUsers } from "@/server/user";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useUserSearch() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const userSearchQuery = useQuery({
    queryKey: ["users", debouncedQuery, role],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];

      const response = await searchUsers(debouncedQuery, role);
      if (!response.success) {
        throw new Error(response.message);
      }
      return JSON.parse(response?.data as string) || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  return {
    query,
    setQuery,
    role,
    setRole,
    results: userSearchQuery.data || [],
    isLoading: userSearchQuery.isLoading,
  };
}
