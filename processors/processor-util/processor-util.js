const dateTimeNow = `Today is ${Date()}! When a user requests a deadline like 'tomorrow' or 'Friday', always return an explicit date in YYYY-MM-DD format. If time is not specified, default to 12:00PM.`

const summarizeChat = (conversation) => {
    const chatSummary = conversation.map((entry, idx) => {
            const prefix = entry.role === "user" ? "User" : "AI";
            return `${idx + 1}. ${prefix}: ${entry.content.trim()}`;
        })
        .join("\n");
    console.log(chatSummary);
    return chatSummary;
}

function formatTickets(tickets) {
    const formattedTickets = tickets.map((t, idx) => {
        const checklistDone = t.checklist?.filter(i => i.status === "checked").length || 0;
        const checklistTotal = t.checklist?.length || 0;
        const checklistSummary = checklistTotal > 0 ? `${checklistDone}/${checklistTotal} checklist items complete` : "No checklist";

        const flags = [
            t.doToday ? "Do Today" : null,
            t.doSoon ? "Do Soon" : null,
            t.isQuickWin ? "Quick Win" : null,
            t.isDeepFocus ? "Deep Focus" : null
        ].filter(Boolean).join(", ");

        return `
Ticket ${idx + 1}: ${t.task}
    **ticketId**: ${t.ticketId}
    Status: ${flags ? `(${flags})` : ""}
    Notes: ${t.notes?.join(" | ") || "None"}
    Checklist: ${checklistSummary}
    Deadline: ${t.deadline || "None"}
`.trim();
    }).join("\n\n");

    console.log(formattedTickets);
    return formattedTickets;
}

function formatGoals(goals) {
    let formattedGoals = goals.map((g, idx) => {
        return `
Goal ${idx + 1}: ${g.goal}
    **goalId**: ${g.goalId},
    Category: ${g.category || "General"}
    Description: ${g.description || "No description"}
    Deadline: ${g.deadline || "None"}
`.trim();
    }).join("\n\n");

    console.log(formattedGoals);
    return formattedGoals;
}

const generateUserMessage = ({formattedGoals, formattedOpenTickets, chatSummary, userInput}) => (
    `
GOALS CONTEXT:
    ${formattedGoals}
    
TICKET CONTEXT:
    ${formattedOpenTickets}
    
CHAT SUMMARY:
    ${chatSummary}
    
    ---
    
Now please respond to the user.
    
    User Input: ${userInput}
`.trim()
)

module.exports = { dateTimeNow, summarizeChat, formatTickets, formatGoals, generateUserMessage };