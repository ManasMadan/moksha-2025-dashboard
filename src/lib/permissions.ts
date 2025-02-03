import { User } from "next-auth";
import { getMyServerSession } from "./auth";
import { IUser } from "@/models/User";
import { IEvent } from "@/models/Event";

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean)
  | ((user: User, data: Permissions[Key]["dataType"]) => Promise<boolean>);

type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<{
      [Action in Permissions[Key]["action"]]: PermissionCheck<Key>;
    }>;
  }>;
};

type Permissions = {
  users: {
    dataType: IUser;
    action: "view" | "create" | "update" | "list" | "delete" | "updatePassword";
  };
  events: {
    dataType: IEvent;
    action: "create" | "update" | "list" | "delete";
  };
};

const ROLES = {
  SOCIETY: {
    users: {
      updatePassword: async (user) => {
        const session = await getMyServerSession();
        return session.user.id === user.id;
      },
    },
  },
  EM: {
    users: {
      create: (user, newUser) => newUser.role === "SOCIETY",
      updatePassword: async (user) => {
        const session = await getMyServerSession();
        return session.user.id === user.id;
      },
    },
    events: {
      list: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  TECH: {
    users: {
      list: true,
      view: true,
      create: true,
      update: true,
      delete: true,
      updatePassword: true,
    },
    events: {
      list: true,
      create: true,
      update: true,
      delete: true,
    },
  },
} as const satisfies RolesWithPermissions;

export function hasPermission<Resource extends keyof Permissions>(
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"]
) {
  const permission = (ROLES as RolesWithPermissions)[user.role][resource]?.[
    action
  ];
  if (permission == null) return false;

  if (typeof permission === "boolean") return permission;
  return data != null && permission(user, data);
}
