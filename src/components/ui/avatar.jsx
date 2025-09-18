import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const isBlockedAvatarSrc = (src) => {
  if (typeof src !== 'string' || !src) return false;
  try {
    const u = new URL(src, window.location.origin);
    return u.hostname === 'i.pravatar.cc';
  } catch {
    return src.includes('i.pravatar.cc');
  }
};

const AvatarImage = React.forwardRef(({ className, onError, src, ...props }, ref) => {
  const finalSrc = isBlockedAvatarSrc(src) ? '/avatar-fallback.png' : src;
  return (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
      src={finalSrc}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (onError) onError(e);
        if (e.currentTarget?.src !== '/avatar-fallback.png') {
          e.currentTarget.src = '/avatar-fallback.png';
        }
      }}
    {...props}
  />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };