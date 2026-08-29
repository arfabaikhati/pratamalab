import { redirect } from "next/navigation";

// Root redirect: goes to login. After login, goes to workspace.
export default function RootPage() {
  redirect("/login");
}
