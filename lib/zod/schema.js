"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModelSchema = exports.ssoVerifySchema = exports.deleteMemberSchema = exports.deleteWebhookSchema = exports.getWebhookSchema = exports.deleteInvitationSchema = exports.getInvitationsSchema = exports.updateWebhookEndpointSchema = exports.webhookEndpointSchema = exports.getInvitationSchema = exports.acceptInvitationSchema = exports.updateMemberSchema = exports.checkoutSessionSchema = exports.resendEmailToken = exports.forgotPasswordSchema = exports.deleteSessionSchema = exports.resendLinkRequestSchema = exports.inviteViaEmailSchema = exports.resetPasswordSchema = exports.userJoinSchema = exports.updatePasswordSchema = exports.updateAccountSchema = exports.createTeamSchema = exports.updateTeamSchema = exports.teamSlugSchema = exports.deleteApiKeySchema = exports.createApiKeySchema = void 0;
var zod_1 = require("zod");
var server_common_1 = require("../server-common");
var primitives_1 = require("./primitives");
exports.createApiKeySchema = zod_1.z.object({
    name: (0, primitives_1.name)(50),
});
exports.deleteApiKeySchema = zod_1.z.object({
    apiKeyId: primitives_1.apiKeyId,
});
exports.teamSlugSchema = zod_1.z.object({
    slug: primitives_1.slug,
});
exports.updateTeamSchema = zod_1.z.object({
    name: primitives_1.teamName,
    slug: primitives_1.slug.transform(function (slug) { return (0, server_common_1.slugify)(slug); }),
    domain: primitives_1.domain,
});
exports.createTeamSchema = zod_1.z.object({
    name: primitives_1.teamName,
});
exports.updateAccountSchema = zod_1.z.union([
    zod_1.z.object({
        email: primitives_1.email,
    }),
    zod_1.z.object({
        name: (0, primitives_1.name)(),
    }),
    zod_1.z.object({
        image: primitives_1.image,
    }),
]);
exports.updatePasswordSchema = zod_1.z.object({
    currentPassword: primitives_1.password,
    newPassword: primitives_1.password,
});
exports.userJoinSchema = zod_1.z.union([
    zod_1.z.object({
        team: primitives_1.teamName,
        slug: primitives_1.slug,
    }),
    zod_1.z.object({
        name: (0, primitives_1.name)(),
        email: primitives_1.email,
        password: primitives_1.password,
    }),
]);
exports.resetPasswordSchema = zod_1.z.object({
    password: primitives_1.password,
    token: primitives_1.token,
});
exports.inviteViaEmailSchema = zod_1.z.union([
    zod_1.z.object({
        email: primitives_1.email,
        role: primitives_1.role,
        sentViaEmail: primitives_1.sentViaEmail,
    }),
    zod_1.z.object({
        role: primitives_1.role,
        sentViaEmail: primitives_1.sentViaEmail,
        domains: primitives_1.domains,
    }),
]);
exports.resendLinkRequestSchema = zod_1.z.object({
    email: primitives_1.email,
    expiredToken: primitives_1.expiredToken,
});
exports.deleteSessionSchema = zod_1.z.object({
    id: primitives_1.sessionId,
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: primitives_1.email,
    recaptchaToken: primitives_1.recaptchaToken.optional(),
});
exports.resendEmailToken = zod_1.z.object({
    email: primitives_1.email,
});
exports.checkoutSessionSchema = zod_1.z.object({
    price: primitives_1.priceId,
    quantity: primitives_1.quantity.optional(),
});
exports.updateMemberSchema = zod_1.z.object({
    role: primitives_1.role,
    memberId: primitives_1.memberId,
});
exports.acceptInvitationSchema = zod_1.z.object({
    inviteToken: primitives_1.inviteToken,
});
exports.getInvitationSchema = zod_1.z.object({
    token: primitives_1.inviteToken,
});
exports.webhookEndpointSchema = zod_1.z.object({
    name: (0, primitives_1.name)(),
    url: primitives_1.url,
    eventTypes: primitives_1.eventTypes,
});
exports.updateWebhookEndpointSchema = exports.webhookEndpointSchema.extend({
    endpointId: primitives_1.endpointId,
});
exports.getInvitationsSchema = zod_1.z.object({
    sentViaEmail: primitives_1.sentViaEmailString,
});
exports.deleteInvitationSchema = zod_1.z.object({
    id: primitives_1.invitationId,
});
exports.getWebhookSchema = zod_1.z.object({
    endpointId: primitives_1.endpointId,
});
exports.deleteWebhookSchema = zod_1.z.object({
    webhookId: primitives_1.endpointId,
});
exports.deleteMemberSchema = zod_1.z.object({
    memberId: primitives_1.memberId,
});
// email or slug
exports.ssoVerifySchema = zod_1.z
    .object({
    email: primitives_1.email.optional().or(zod_1.z.literal('')),
    slug: primitives_1.slug.optional().or(zod_1.z.literal('')),
})
    .refine(function (data) { return data.email || data.slug; }, {
    message: 'At least one of email or slug is required',
});
exports.AIModelSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    provider: zod_1.z.string(),
    azureOpenAIApiDeploymentName: zod_1.z.string().optional(),
    azureOpenAIApiVersion: zod_1.z.string().optional(),
    azureOpenAIBasePath: zod_1.z.string().optional(),
    azureOpenAIApiKey: zod_1.z.string().optional(),
    openAIApiKey: zod_1.z.string().optional(),
    googleAIApiKey: zod_1.z.string().optional(),
});
