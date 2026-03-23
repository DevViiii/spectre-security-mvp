import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spectre_api_key");

  // Authenticated users go straight to overview
  if (token) {
    redirect("/overview");
  }

  // Unauthenticated users see the landing page
  return <LandingPage />;
}
