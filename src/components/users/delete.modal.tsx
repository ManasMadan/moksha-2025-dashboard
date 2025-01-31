import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

type DeleteConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string | undefined
  isLoading: boolean
  error: Error | null
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName,
  isLoading,
  error
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <p>Are you sure you want to delete user <strong>{userName}</strong>?</p>
        
        <DialogFooter>
          <Button type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}