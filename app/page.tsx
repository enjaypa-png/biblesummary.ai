import { redirect } from "next/navigation";

/**
 * Root page redirects to Bible reading view.
 * The app is a reading tool first - users should land on the Bible, not a marketing page.
 */
export default function Home() {
  redirect("/bible");
}
