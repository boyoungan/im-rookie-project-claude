import { create } from 'zustand'

const useStore = create((set, get) => ({
  department: null,
  departmentLocked: false,  // 최초 선택 후 true → 재선택 불가
  xp: 0,
  level: 1,

  setDepartment: (dept) => set({ department: dept, departmentLocked: true }),

  addXP: (amount) => {
    const { xp, level } = get()
    const newXP = xp + amount
    if (newXP >= 100) {
      set({ xp: newXP - 100, level: level + 1 })
    } else {
      set({ xp: newXP })
    }
  },
}))

export default useStore
