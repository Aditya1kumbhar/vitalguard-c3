'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { colors, dimensions, layout } from './motion.tokens';

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
            backgroundColor: colors.sheetOverlay,
            zIndex: 50,
          }}
        />
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '94vh',
            maxWidth: 430,
            margin: '0 auto',
            backgroundColor: colors.card,
            borderTopLeftRadius: dimensions.cardRadius,
            borderTopRightRadius: dimensions.cardRadius,
            borderTop: `1px solid ${colors.cardBorder}`,
            borderLeft: `1px solid ${colors.cardBorder}`,
            borderRight: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.85)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
            paddingBottom: layout.pagePadding,
          }}
        >
          {/* Handle bar */}
          <div
            aria-hidden="true"
            style={{
              width: 36,
              height: 5,
              borderRadius: dimensions.pillRadius,
              backgroundColor: 'rgba(255, 255, 255, 0.20)',
              margin: `${layout.gridUnit}px auto ${layout.gridUnit}px auto`,
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
              padding: `0 ${layout.pagePadding}px ${layout.sectionGap}px ${layout.pagePadding}px`,
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
