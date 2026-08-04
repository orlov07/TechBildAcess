let selectedEvent: { id: string; title: string } | null = null

export function setFiscalEvent(event: { id: string; title: string }) {
  selectedEvent = event
}

export function getFiscalEvent() {
  return selectedEvent
}
