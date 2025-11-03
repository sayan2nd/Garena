
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Notification } from '@/lib/definitions';
import Image from 'next/image';

interface PopupNotificationProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationMedia = ({ src }: { src: string }) => {
    const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
    if (isVideo) {
        return (
            <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className="rounded-lg w-full h-full object-cover"
            />
        );
    }
    return <Image src={src} alt="Notification Image" layout="fill" className="object-cover" />;
}

const ClickableMessage = ({ message }: { message: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);

  return (
    <p className="text-sm">
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};


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
            <ClickableMessage message={notification.message} />
            {notification.imageUrl && (
                <div className="relative aspect-video w-full rounded-md overflow-hidden">
                    <NotificationMedia src={notification.imageUrl} />
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
