import { NextResponse } from "next/server"

const categories = [
  { id: "general", name: "General" },
  { id: "account", name: "Account" },
  { id: "tasks", name: "Tasks" },
]

export async function GET() {
  return NextResponse.json(categories)
}

