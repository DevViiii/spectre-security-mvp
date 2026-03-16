import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spectre_api_key");
  if (token) {
    redirect("/scanner");
  }
  redirect("/login");
}
