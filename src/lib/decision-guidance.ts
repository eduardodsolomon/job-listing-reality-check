import type {
  Signal,
} from "./analysis-types";

import {
  explainSignal,
  type NextStepGroup,
} from "./presentation";

function cleanText(
  value: string,
): string {
  return value
    .trim()
    .replace(/[.!?]+$/, "");
}

function lowerFirst(
  value: string,
): string {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toLowerCase() +
    value.slice(1)
  );
}

function semanticKey(
  value: string,
): string {
  const text =
    value.toLowerCase();

  if (
    /official careers|official company|official employer|official website/.test(
      text,
    )
  ) {
    return "official-source";
  }

  if (
    /public job url|official job url|check url/.test(
      text,
    )
  ) {
    return "url-check";
  }

  if (
    /salary|hourly range|pay range|compensation/.test(
      text,
    )
  ) {
    return "pay";
  }

  if (
    /job number|requisition|posting number|position number/.test(
      text,
    )
  ) {
    return "job-number";
  }

  if (
    /funded|funding|actively interviewing|active role|currently open/.test(
      text,
    )
  ) {
    return "active-funded";
  }

  if (
    /company box|company name|employer name|recruiting agenc/.test(
      text,
    )
  ) {
    return "company-name";
  }

  if (
    /recruiter message|hiring manager|ask the recruiter/.test(
      text,
    )
  ) {
    return "recruiter-details";
  }

  if (
    /check this job again|run the check again|update the scores/.test(
      text,
    )
  ) {
    return "rerun";
  }

  if (
    /personal information|social security|banking|identity information/.test(
      text,
    )
  ) {
    return "personal-information";
  }

  if (
    /send money|pay a fee|deposit a check|gift card|purchase equipment|transfer money/.test(
      text,
    )
  ) {
    return "money";
  }

  if (
    /interview/.test(text)
  ) {
    return "interview";
  }

  if (
    /pressure|urgent|immediately/.test(
      text,
    )
  ) {
    return "urgency";
  }

  if (
    /complete job description|limited information|missing detail/.test(
      text,
    )
  ) {
    return "description";
  }

  return text
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 100);
}

function uniqueByMeaning(
  values: string[],
): string[] {
  const seen =
    new Set<string>();

  return values.filter(
    (value) => {
      const key =
        semanticKey(value);

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    },
  );
}

function redFlagQuestion(
  value: string,
): string {
  const text =
    value.toLowerCase();

  if (
    /personal information|social security|banking|identity information/.test(
      text,
    )
  ) {
    return "Have I independently verified the employer and onboarding process before sharing sensitive personal information?";
  }

  if (
    /send money|pay a fee|deposit a check|gift card|purchase equipment|transfer money/.test(
      text,
    )
  ) {
    return "Am I being asked to send money, pay a fee, deposit a check, purchase equipment, or transfer funds?";
  }

  if (
    /cannot be verified|independently verify|official source/.test(
      text,
    )
  ) {
    return "Can I independently verify the employer, recruiter, and job through an official source?";
  }

  if (
    /active and funded|role is active|currently interviewing/.test(
      text,
    )
  ) {
    return "Has the employer confirmed that this exact role is active, funded, and currently interviewing?";
  }

  if (
    /without an interview|normal interview|real interview/.test(
      text,
    )
  ) {
    return "Has a real interview occurred with a verifiable manager or hiring team?";
  }

  if (
    /pressure|urgent|immediately/.test(
      text,
    )
  ) {
    return "Am I being pressured to act before I have enough time to verify the opportunity?";
  }

  return `Have I resolved this concern before continuing: ${lowerFirst(
    cleanText(value),
  )}?`;
}

function greenFlagQuestion(
  value: string,
): string {
  const text =
    value.toLowerCase();

  if (
    /active public job record|active posting/.test(
      text,
    )
  ) {
    return "Does the official URL show an active public job record that matches the submitted role?";
  }

  if (
    /role fits your goals|proceed with the application/.test(
      text,
    )
  ) {
    return "Does this role fit my goals, and have I answered the remaining questions before applying?";
  }

  if (
    /salary|pay information|compensation/.test(
      text,
    )
  ) {
    return "Is the compensation clearly stated and appropriate for the location, duties, and employment type?";
  }

  if (
    /job number|requisition/.test(
      text,
    )
  ) {
    return "Can I locate the same job or requisition number on the employer’s official careers website?";
  }

  return `Does this evidence meaningfully support that the opportunity is real: ${lowerFirst(
    cleanText(value),
  )}?`;
}

function warningQuestion(
  signal: Signal,
): string {
  const explanation =
    explainSignal(signal);

  const text = [
    signal.id,
    signal.title,
    signal.explanation,
    explanation.found,
  ]
    .join(" ")
    .toLowerCase();

  if (
    /salary|pay range|compensation/.test(
      text,
    )
  ) {
    return "What is the salary, hourly rate, stipend, or total compensation range?";
  }

  if (
    /requisition|job id|posting id|position number/.test(
      text,
    )
  ) {
    return "What is the official job, requisition, posting, or position number?";
  }

  if (
    /pipeline|contingent|funded|funding|award|evergreen/.test(
      text,
    )
  ) {
    return "Is this exact role active, funded, approved, and currently interviewing?";
  }

  if (
    /short|brief|limited detail|description/.test(
      text,
    )
  ) {
    return "Can I find a complete job description on the employer’s official careers website?";
  }

  if (
    /personal email|gmail|yahoo|hotmail|outlook/.test(
      text,
    )
  ) {
    return "Can I verify that the recruiter works for the employer or authorized recruiting agency?";
  }

  if (
    /no interview|without an interview|instant offer/.test(
      text,
    )
  ) {
    return "Why is the employer making an offer without a normal interview process?";
  }

  if (
    /urgent|pressure|immediately/.test(
      text,
    )
  ) {
    return "Why am I being pressured to act before independently verifying the opportunity?";
  }

  if (
    /money|fee|check|equipment|gift card|payment/.test(
      text,
    )
  ) {
    return "Why am I being asked to pay, deposit a check, or purchase something during the hiring process?";
  }

  if (
    /social security|bank|passport|government id|birthdate|sensitive/.test(
      text,
    )
  ) {
    return "Why is sensitive information needed at this stage, and is the submission process independently verified?";
  }

  return `What information would resolve this concern: ${lowerFirst(
    cleanText(
      explanation.found,
    ),
  )}?`;
}

export function prepareDecisionGroups(
  groups: NextStepGroup[],
): NextStepGroup[] {
  return groups.map(
    (group) => {
      if (
        group.id ===
        "gather-information"
      ) {
        return {
          ...group,
          items:
            uniqueByMeaning(
              group.items,
            ),
        };
      }

      if (
        group.id ===
        "red-flags"
      ) {
        return {
          ...group,
          summary:
            "Ask yourself these questions before applying, continuing, or sharing more information.",
          items:
            uniqueByMeaning(
              group.items.map(
                redFlagQuestion,
              ),
            ),
        };
      }

      return {
        ...group,
        summary:
          "Ask whether these positive signs are strong enough to support continuing.",
        items:
          uniqueByMeaning(
            group.items.map(
              greenFlagQuestion,
            ),
          ),
      };
    },
  );
}

export function buildThingsToCheckQuestions(
  signals: Signal[],
  existingItems: string[] = [],
): string[] {
  const existingKeys =
    new Set(
      existingItems.map(
        semanticKey,
      ),
    );

  return uniqueByMeaning(
    signals.map(
      warningQuestion,
    ),
  ).filter(
    (question) =>
      !existingKeys.has(
        semanticKey(question),
      ),
  );
}