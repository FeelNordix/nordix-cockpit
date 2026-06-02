import type { Customer } from "../types/customer";

export type DashboardAction = {
  id: string;
  text: string;
  href: string;
  dueDate?: string;
};

export type DashboardActionGroups = {
  today: DashboardAction[];
  nextSevenDays: DashboardAction[];
  newRequests: DashboardAction[];
};

export function getDashboardActionGroups(
  customers: Customer[],
  today = getTodayDate()
): DashboardActionGroups {
  const todayActions: DashboardAction[] = [];
  const nextSevenDays: DashboardAction[] = [];
  const newRequests: DashboardAction[] = [];

  customers.forEach((customer) => {
    const name = `${customer.firstName} ${customer.lastName}`;
    const href = `/customers/${customer.id}`;

    if (customer.status === "Nieuwe aanvraag") {
      newRequests.push({
        id: `${customer.id}-new-request`,
        text: getActionText(customer, `Nieuwe aanvraag — ${name}`),
        href
      });
    }

    if (
      customer.quoteSentDate &&
      customer.quoteFollowUpDate &&
      customer.quoteConfirmed !== true &&
      isTodayOrEarlier(customer.quoteFollowUpDate, today)
    ) {
      todayActions.push({
        id: `${customer.id}-quote-follow-up`,
        text: getActionText(customer, `Offerte opvolgen — ${name}`),
        href,
        dueDate: customer.quoteFollowUpDate
      });
    }

    if (customer.quoteConfirmed !== true) {
      return;
    }

    addDatedAction({
      action: {
        id: `${customer.id}-prepare-documents`,
        text: getActionText(customer, `Reisdocumenten voorbereiden — ${name}, versturen gepland op ${formatDate(customer.travelDocumentsPlannedSendDate)}`),
        href,
        dueDate: customer.travelDocumentsPrepareFromDate
      },
      today,
      todayActions,
      nextSevenDays,
      condition:
        Boolean(customer.travelDocumentsPrepareFromDate) &&
        customer.travelDocumentsPrepared !== true
    });

    addDatedAction({
      action: {
        id: `${customer.id}-send-documents`,
        text: getActionText(customer, `Reisdocumenten versturen — ${name}`),
        href,
        dueDate: customer.travelDocumentsPlannedSendDate
      },
      today,
      todayActions,
      nextSevenDays,
      condition:
        Boolean(customer.travelDocumentsPlannedSendDate) &&
        customer.travelDocumentsSent !== true
    });

    if (customer.paymentType === "full") {
      addDatedAction({
        action: {
          id: `${customer.id}-full-payment`,
          text: getActionText(customer, `Volledige betaling controleren — ${name}`),
          href,
          dueDate: customer.fullPaymentDueDate
        },
        today,
        todayActions,
        nextSevenDays,
        condition:
          Boolean(customer.fullPaymentDueDate) &&
          customer.fullPaymentReceived !== true
      });
    } else {
      addDatedAction({
        action: {
          id: `${customer.id}-deposit-payment`,
          text: getActionText(customer, `Aanbetaling controleren — ${name}`),
          href,
          dueDate: customer.depositDueDate
        },
        today,
        todayActions,
        nextSevenDays,
        condition:
          Boolean(customer.depositDueDate) &&
          customer.depositReceived !== true
      });

      addDatedAction({
        action: {
          id: `${customer.id}-final-payment`,
          text: getActionText(customer, `Restantbetaling controleren — ${name}`),
          href,
          dueDate: customer.finalPaymentDueDate
        },
        today,
        todayActions,
        nextSevenDays,
        condition:
          Boolean(customer.finalPaymentDueDate) &&
          customer.finalPaymentReceived !== true
      });
    }

    addDatedAction({
      action: {
        id: `${customer.id}-post-trip-contact`,
        text: getActionText(customer, `Contact opnemen na reis — ${name}`),
        href,
        dueDate: customer.returnDate ? shiftDate(customer.returnDate, 2) : ""
      },
      today,
      todayActions,
      nextSevenDays,
      condition: Boolean(customer.returnDate) && customer.postTripContacted !== true
    });

    if (customer.postTripContacted === true && customer.googleReviewLinkSent !== true) {
      todayActions.push({
        id: `${customer.id}-review-link`,
        text: getActionText(customer, `Google Review-link sturen — ${name}`),
        href
      });
    }
  });

  return {
    today: sortByDueDate(todayActions),
    nextSevenDays: sortByDueDate(nextSevenDays),
    newRequests: newRequests.sort((a, b) => a.text.localeCompare(b.text))
  };
}

function getActionText(customer: Customer, text: string) {
  return customer.brand === "Feel Dutch" ? `Feel Dutch — ${text}` : text;
}

function addDatedAction({
  action,
  today,
  todayActions,
  nextSevenDays,
  condition
}: {
  action: DashboardAction;
  today: string;
  todayActions: DashboardAction[];
  nextSevenDays: DashboardAction[];
  condition: boolean;
}) {
  if (!condition || !action.dueDate) {
    return;
  }

  if (isTodayOrEarlier(action.dueDate, today)) {
    todayActions.push(action);
    return;
  }

  if (isWithinNextSevenDays(action.dueDate, today)) {
    nextSevenDays.push(action);
  }
}

function isTodayOrEarlier(dateValue: string, today: string) {
  return dateValue <= today;
}

function isWithinNextSevenDays(dateValue: string, today: string) {
  return dateValue > today && dateValue <= shiftDate(today, 7);
}

function sortByDueDate(actions: DashboardAction[]) {
  return [...actions].sort((a, b) => {
    return (a.dueDate || "").localeCompare(b.dueDate || "");
  });
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDate(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateValue: string) {
  if (!dateValue) {
    return "nog te bepalen";
  }

  const [year, month, day] = dateValue.split("-");
  return `${day}-${month}-${year}`;
}
