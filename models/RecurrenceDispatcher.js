const mongoose = require('mongoose');

const RecurrenceDispatcherSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tickets',
        required: true
    },
    repeatInterval: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null
    },
    occurrencePattern: {
        type: Object,
        default: {}
        // example: { daysOfWeek: [1, 3, 5] } for Mon/Wed/Fri
    },
    onCompletionBehavior: {
        type: String,
        enum: ['clone', 'reset'],
        default: 'clone'
    },
    lastGeneratedDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

const RecurrenceDispatcher = mongoose.model('recurrence_dispatchers', RecurrenceDispatcherSchema);

module.exports = RecurrenceDispatcher;