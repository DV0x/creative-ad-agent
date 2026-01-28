import { X, FolderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { AssetDrawer } from './AssetDrawer'

interface MobileAssetsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileAssetsDrawer({ open, onOpenChange }: MobileAssetsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-raised border-border max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4 text-accent" />
              <DrawerTitle className="text-text-primary">Assets</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-xs">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Reuse AssetDrawer content */}
        <div className="min-h-[400px] max-h-[70vh] overflow-hidden">
          <AssetDrawer />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
