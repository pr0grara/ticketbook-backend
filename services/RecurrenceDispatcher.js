const { isToday, addDays, addWeeks, addMonths, differenceInCalendarDays } = require('date-fns');

class RecurrenceDispatcher {
    constructor(dispatcherData) {
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
        if (!this.isActive()) return false;

        const today = new Date();

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
        if (!this.lastGeneratedDate) return isToday(this.startDate);
        return differenceInCalendarDays(today, this.lastGeneratedDate) >= 1;
    }

    _isNextWeekDue(today) {
        if (!this.lastGeneratedDate) return isToday(this.startDate);
        return differenceInCalendarDays(today, this.lastGeneratedDate) >= 7;
    }

    _isNextMonthDue(today) {
        if (!this.lastGeneratedDate) return isToday(this.startDate);
        const monthDiff = today.getMonth() - this.lastGeneratedDate.getMonth() +
            (12 * (today.getFullYear() - this.lastGeneratedDate.getFullYear()));
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