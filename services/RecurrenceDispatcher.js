const { isToday, addDays, addWeeks, addMonths, differenceInCalendarDays } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const TIMEZONE = 'America/Los_Angeles'

class RecurrenceDispatcher {
    constructor(dispatcherData) {
        this._id = dispatcherData._id;
        this.ticketId = dispatcherData.ticketId;
        this.repeatInterval = dispatcherData.repeatInterval; // 'daily', 'weekly', 'monthly', 'custom'
        this.startDate = new Date(dispatcherData.startDate);
        this.endDate = dispatcherData.endDate ? new Date(dispatcherData.endDate) : null;
        this.occurrencePattern = dispatcherData.occurrencePattern || {}; // e.g., { daysOfWeek: [1, 3, 5] }
        this.onCompletionBehavior = dispatcherData.onCompletionBehavior || 'clone';
        this.lastGeneratedDate = dispatcherData.lastGeneratedDate ? new Date(dispatcherData.lastGeneratedDate) : null;
        this.status = dispatcherData.status || 'active';
    }

    isActive() {
        return this.status === 'active';
    }

    shouldTriggerToday() {
        // console.log("🧪 Checking recurrence:", {
        //     status: this.status,
        //     ticketId: this.ticketId,
        //     startDate: this.startDate,
        //     endDate: this.endDate,
        //     lastGeneratedDate: this.lastGeneratedDate,
        //     today: toZonedTime(new Date(), TIMEZONE),
        //     interval: this.repeatInterval
        // });

        if (!this.isActive()) {
            console.log("❌ Skipping: Not active");
            return false;
        }

        const today = toZonedTime(new Date(), TIMEZONE);

        if (this.endDate && today > this.endDate) {
            return false;
        }

        if (this.repeatInterval === 'daily') {
            return this._isNextDayDue(today);
        }

        if (this.repeatInterval === 'weekly') {
            return this._isNextWeekDue(today);
        }

        if (this.repeatInterval === 'monthly') {
            return this._isNextMonthDue(today);
        }

        if (this.repeatInterval === 'custom' && this.occurrencePattern.daysOfWeek) {
            const todayDayOfWeek = today.getDay();
            return this.occurrencePattern.daysOfWeek.includes(todayDayOfWeek);
        }

        return false;
    }

    _isNextDayDue(today) {
        const base = this.lastGeneratedDate || this.startDate;
        const referenceDate = toZonedTime(base, TIMEZONE);
        return differenceInCalendarDays(today, referenceDate) >= 1;
    }

    _isNextWeekDue(today) {
        const base = this.lastGeneratedDate || this.startDate;
        const referenceDate = toZonedTime(base, TIMEZONE);
        return differenceInCalendarDays(today, referenceDate) >= 7;
    }

    _isNextMonthDue(today) {
        const base = this.lastGeneratedDate || this.startDate;
        const referenceDate = toZonedTime(base, TIMEZONE);

        const monthDiff = today.getMonth() - referenceDate.getMonth() +
            (12 * (today.getFullYear() - referenceDate.getFullYear()));

        return monthDiff >= 1;
    }

    generateNextTicketData(originalTicket) {
        if (this.onCompletionBehavior === 'clone') {
            const newTicket = { ...originalTicket };
            delete newTicket._id;
            newTicket.status = 'pending';
            return newTicket;
        }

        if (this.onCompletionBehavior === 'reset') {
            const resetTicket = { ...originalTicket };
            resetTicket.status = 'pending';
            return resetTicket;
        }

        throw new Error('Unsupported onCompletionBehavior');
    }
}

module.exports = RecurrenceDispatcher;