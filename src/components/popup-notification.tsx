'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Notification } from '@/lib/definitions';
import Image from 'next/image';

interface PopupNotificationProps {
  notification: Notification;
  onClose: () => void;
}

export default function PopupNotification({ notification, onClose }: PopupNotificationProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Welcome to Garena Store</DialogTitle>
          <DialogDescription>
            A message from the Garena team.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p className="text-sm">{notification.message}</p>
            {notification.imageUrl && (
                <div className="relative aspect-video w-full rounded-md overflow-hidden">
                    <Image src={notification.imageUrl} alt="Notification Image" layout="fill" className="object-cover" />
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
