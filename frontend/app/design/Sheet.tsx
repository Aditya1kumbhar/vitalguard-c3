'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { palette, radius, shadow, space, zIndex } from './motion.tokens';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: (number | string)[];
  dismissible?: boolean;
  children: React.ReactNode;
  title?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  snapPoints,
  dismissible = true,
  children,
  title,
}) => {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissible={dismissible}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: palette.light.sheetOverlay,
            zIndex: zIndex.sheet,
          }}
        />
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '94vh',
            backgroundColor: palette.light.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            boxShadow: shadow.sheet,
            zIndex: zIndex.sheet,
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
            paddingBottom: space.safe,
          }}
        >
          {/* Handle bar */}
          <div
            aria-hidden="true"
            style={{
              width: 36,
              height: 5,
              borderRadius: radius.full,
              backgroundColor: palette.light.border,
              margin: `${space.sm}px auto ${space.sm}px auto`,
              flexShrink: 0,
            }}
          />

          {title && (
            <Drawer.Title
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {title}
            </Drawer.Title>
          )}

          <div
            style={{
              padding: `0 ${space.lg}px ${space.md}px ${space.lg}px`,
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
