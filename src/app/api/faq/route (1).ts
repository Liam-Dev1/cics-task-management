import { NextResponse } from "next/server"

// Mock data - In a real app, this would be in a database
let faqs = [
  {
    id: 1,
    question: "Lorem ipsum dolor sit amet?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur mauris vel nulla volutpat, ac ullamcorper sapien ultricies.",
    category: "general",
  },
  {
    id: 2,
    question: "Sed ut perspiciatis unde omnis iste natus error?",
    answer:
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
    category: "account",
  },
  {
    id: 3,
    question: "Qui officia deserunt mollit anim id est laborum?",
    answer:
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
    category: "tasks",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (query) {
    return NextResponse.json(
      faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query.toLowerCase()) ||
          faq.answer.toLowerCase().includes(query.toLowerCase()),
      ),
    )
  }

  return NextResponse.json(faqs)
}

export async function POST(request: Request) {
  const newFaq = await request.json()
  const id = faqs.length + 1
  const faq = { ...newFaq, id }
  faqs.push(faq)
  return NextResponse.json(faq)
}

export async function PUT(request: Request) {
  const updatedFaq = await request.json()
  faqs = faqs.map((faq) => (faq.id === updatedFaq.id ? updatedFaq : faq))
  return NextResponse.json(updatedFaq)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  faqs = faqs.filter((faq) => faq.id !== Number(id))
  return NextResponse.json({ success: true })
}
