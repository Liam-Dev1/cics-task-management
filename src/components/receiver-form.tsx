import { User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ReceiverFormProps {
  onCancel: () => void
  initialData?: {
    name: string
    role: string
    email: string
  }
  onSave?: (data: { name: string; role: string; email: string }) => void
  isEdit?: boolean
}

export function ReceiverForm({ onCancel, initialData, onSave, isEdit = false }: ReceiverFormProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg mb-4 ${isEdit ? "bg-red-800/80" : "bg-zinc-600"}`}>
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-zinc-400 flex items-center justify-center">
          <User2 className="h-6 w-6 text-zinc-600" />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-[1fr_1fr_2fr] gap-4">
        <Input placeholder="Name" defaultValue={initialData?.name} className="bg-white" />
        <Input placeholder="Role" defaultValue={initialData?.role} className="bg-white" />
        <Input placeholder="Email" defaultValue={initialData?.email} className="bg-white" />
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() =>
            onSave?.({
              name: "",
              role: "",
              email: "",
            })
          }
        >
          Save
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

