import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
interface NewReceiverFormProps {
  onCancel: () => void
}

export function NewReceiverForm({ onCancel }: NewReceiverFormProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center p-4 bg-zinc-200 rounded-lg">
      <div className="w-10 h-10 bg-zinc-400 rounded-full" />

      <Input placeholder="Name" className="bg-white" />

      <Input placeholder="Role" className="bg-white" />

      <div className="flex items-center gap-2">
        <Input placeholder="Email" className="bg-white w-40" />
        <Button variant="secondary" size="sm">
          Save
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

