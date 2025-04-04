const {
    modifyTicketProcessor,
    createTicketProcessor,
    createManyTicketsProcessor,
    createGoalProcessor,
    deleteGoalProcessor,
    requestInfoProcessor,
    provideAdviceProcessor,
    provideAnswerProcessor
} = require("../index");

const actionHandlers = {
    modify_ticket: (a, b, c) => modifyTicketProcessor(b, c),
    create_ticket: (a, b, c) => createTicketProcessor(a, b, c),
    create_many_tickets: (a, b, c) => createManyTicketsProcessor(a, b, c),
    create_goal: (a, b, c) => createGoalProcessor(a, b, { isGoal: true }, c),
    create_bucket: (a, b, c) => createGoalProcessor(a, b, { isBucket: true }, c),
    delete_ticket: (a, b, c) => deleteGoalProcessor(a),
    delete_goal: (a, b, c) => deleteGoalProcessor(a),
    request_info: (a, b, c) => requestInfoProcessor(a),
    provide_answer: (a, b, c) => provideAnswerProcessor(a, b, c),
    provide_advice: (a, b, c) => provideAdviceProcessor(a, b, c),
    clarification_needed: (a) => ({
        action_type: "error",
        status: "error",
        message: a.message,
        type: "PREPROCESSOR",
    }),
    error: (a) => ({
        action_type: "error",
        status: "error",
        message: a.message,
        type: "PREPROCESSOR",
    }),
    "fatal error": (a) => ({
        action_type: "error",
        status: "error",
        message: a.message,
        type: "PREPROCESSOR",
    }),
};

const handleAction = async (action, request, formattedContext) => {
    const handler = actionHandlers[action.action_type];

    if (!handler) {
        throw new Error(`Unknown action_type: ${action.action_type}`);
    }

    return await handler(action, request.body, formattedContext);
};

module.exports = { handleAction };