"use client"

import { GenealogyTree } from "@/components/silsilah/genealogy-tree"
import type { TreePerson } from "@/lib/silsilah/types"

type FamilyTreeViewProps = {
  onPersonSelect: (personId: string) => void
  persons: TreePerson[]
  subjectPersonId?: string
  scrollToPersonId?: string | null
}

export function FamilyTreeView({
  onPersonSelect,
  persons,
  subjectPersonId,
  scrollToPersonId,
}: FamilyTreeViewProps) {
  return (
    <GenealogyTree
      onPersonSelect={onPersonSelect}
      persons={persons}
      scrollToPersonId={scrollToPersonId}
      subjectPersonId={subjectPersonId}
    />
  )
}
