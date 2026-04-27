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
    // console.log("[useUsers] loadUsers CALLED");
    const res = await api.get("/admin/users");
    setUsers(res.data);
  }

  return {
    users,
    loadUsers,
  };
}