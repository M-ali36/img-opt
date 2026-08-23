import { db } from "@/firebase/config";
import { doc, increment, updateDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { userId, count } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      converted_images: increment(count || 1)
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
