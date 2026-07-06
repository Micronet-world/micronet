export interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    color: string;
    notes?: string;
}
export declare function useCalendarStore(): {
    events: import("vue").Ref<{
        id: string;
        title: string;
        date: string;
        startTime?: string | undefined;
        endTime?: string | undefined;
        color: string;
        notes?: string | undefined;
    }[], CalendarEvent[] | {
        id: string;
        title: string;
        date: string;
        startTime?: string | undefined;
        endTime?: string | undefined;
        color: string;
        notes?: string | undefined;
    }[]>;
    addEvent: (event: Omit<CalendarEvent, "id">) => string;
    updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, "id">>) => void;
    deleteEvent: (id: string) => void;
    getEventsForDate: (date: string) => CalendarEvent[];
    getEventsForMonth: (year: number, month: number) => CalendarEvent[];
};
//# sourceMappingURL=useCalendarStore.d.ts.map