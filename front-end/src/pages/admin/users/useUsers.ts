import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import type { User } from "../admin.types";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  }

  return {
    users,
    loadUsers,
  };
}