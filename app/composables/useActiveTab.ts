export const useActiveTab = () => {
  const activeTabLabel = useState<string | null>('activeTabLabel', () => null)

  const setActiveTab = (label: string | null) => {
    activeTabLabel.value = label
  }

  return {
    activeTabLabel,
    setActiveTab,
  }
}
