import { createAnswerVerification } from "#/server/db/queries/chat";

export const answerVerificationService = {
    create: createAnswerVerification,
};
