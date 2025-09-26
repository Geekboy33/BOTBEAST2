// src/hooks/useDragAndDrop.ts
import { useState, useCallback } from 'react';

export interface DraggableItem {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export function useDragAndDrop() {
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const addItem = useCallback((item: Omit<DraggableItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setItems(prev => [...prev, { ...item, id }]);
    return id;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItemPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, position } : item
    ));
  }, []);

  const updateItemSize = useCallback((id: string, size: { width: number; height: number }) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, size } : item
    ));
  }, []);

  const startDrag = useCallback((id: string) => {
    setDraggedItem(id);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return {
    items,
    draggedItem,
    addItem,
    removeItem,
    updateItemPosition,
    updateItemSize,
    startDrag,
    endDrag
  };
}




