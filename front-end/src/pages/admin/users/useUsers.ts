import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { User } from "../admin.types";

export function useUsers() {
  // console.log("[useUsers] hook initialized");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // console.log("[useUsers] useEffect triggered");
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/admin/users");
      const data = res.data;
      setUsers(Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : []);
    } catch {
      setUsers([]);
    }
  }

  return {
    users,
    loadUsers,
  };
}