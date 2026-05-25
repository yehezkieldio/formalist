import {
    createAnswerVerification,
    listAnswerVerifications,
} from "#/server/db/queries/chat";

export const answerVerificationService = {
    create: createAnswerVerification,
    list: listAnswerVerifications,
};
