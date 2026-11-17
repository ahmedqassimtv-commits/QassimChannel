export const springs = {
  follow: { stiffness: 900, damping: 50 },
  settle: { stiffness: 280, damping: 22 },
  soft: { stiffness: 260, damping: 24 },
  lead: { stiffness: 620, damping: 36 },
  trail: { stiffness: 190, damping: 19 },
  pop: { stiffness: 520, damping: 16 },
  fade: { stiffness: 420, damping: 32 },
  lens: { stiffness: 180, damping: 17 },
  ticket: { stiffness: 170, damping: 15 },
} as const
