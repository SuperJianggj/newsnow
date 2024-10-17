import type { PropsWithChildren } from "react"
import { useCallback, useState } from "react"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { AnimateLayoutChanges } from "@dnd-kit/sortable"
import { SortableContext, arrayMove, defaultAnimateLayoutChanges, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { useAtom } from "jotai"
import type { SourceID } from "@shared/types"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import type { ItemsProps } from "./card"
import { CardOverlay, CardWrapper } from "./card"
import { currentSourcesAtom } from "~/atoms"

export function Dnd() {
  const [items, setItems] = useAtom(currentSourcesAtom)
  return (
    <DndWrapper items={items} setItems={setItems}>
      <motion.ol
        className="grid w-full gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        }}
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              delayChildren: 0.3,
              staggerChildren: 0.2,
            },
          },
        }}
      >
        {items.map(id => (
          <motion.li
            key={id}
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: {
                y: 0,
                opacity: 1,
              },
            }}
          >
            <SortableCardWrapper id={id} />
          </motion.li>
        ))}
      </motion.ol>
    </DndWrapper>
  )
}

interface DndProps {
  items: SourceID[]
  setItems: (update: SourceID[]) => void
}

const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
}

export function DndWrapper({ items, setItems, children }: PropsWithChildren<DndProps>) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.indexOf(active.id as any)
      const newIndex = items.indexOf(over!.id as any)
      setItems(arrayMove(items, oldIndex, newIndex))
    }

    setActiveId(null)
  }, [setItems, items])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      measuring={measuringConfig}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay
        adjustScale
        dropAnimation={{
          duration: 300,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        {/* {!!activeId && <CardOverlay id={activeId as SourceID} />} */}
        <CardOverlay id={activeId as SourceID} />
      </DragOverlay>
    </DndContext>
  )
}

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args)
  }
  return true
}

function SortableCardWrapper({ id, ...props }: ItemsProps) {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges,
    transition: {
      duration: 300,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <CardWrapper
      ref={setNodeRef}
      id={id}
      style={style}
      isDragged={isDragging}
      handleListeners={listeners}
      {...attributes}
      {...props}
    />
  )
}