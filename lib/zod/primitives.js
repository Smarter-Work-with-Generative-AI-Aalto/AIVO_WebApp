"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberId = exports.inviteToken = exports.url = exports.eventTypes = exports.endpointId = exports.invitationId = exports.sentViaEmailString = exports.recaptchaToken = exports.quantity = exports.priceId = exports.sessionId = exports.expiredToken = exports.domains = exports.sentViaEmail = exports.role = exports.token = exports.apiKeyId = exports.domain = exports.image = exports.slug = exports.name = exports.teamName = exports.email = exports.password = void 0;
var zod_1 = require("zod");
var common_1 = require("../common");
var client_1 = require("@prisma/client");
exports.password = zod_1.z
    .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
})
    .max(common_1.maxLengthPolicies.password, "Password should have at most ".concat(common_1.maxLengthPolicies.password, " characters"))
    .min(common_1.passwordPolicies.minLength, "Password must have at least ".concat(common_1.passwordPolicies.minLength, " characters"));
exports.email = zod_1.z
    .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
})
    .email('Enter a valid email address')
    .max(common_1.maxLengthPolicies.email, "Email should have at most ".concat(common_1.maxLengthPolicies.email, " characters"));
exports.teamName = zod_1.z
    .string({
    required_error: 'Team name is required',
    invalid_type_error: 'Team name must be a string',
})
    .min(1, 'Team Name is required')
    .max(common_1.maxLengthPolicies.team, "Team name should have at most ".concat(common_1.maxLengthPolicies.team, " characters"));
var name = function (length) {
    if (length === void 0) { length = common_1.maxLengthPolicies.name; }
    return zod_1.z
        .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string',
    })
        .min(1, 'Name is required')
        .max(length, "Name should have at most ".concat(length, " characters"));
};
exports.name = name;
exports.slug = zod_1.z
    .string({
    required_error: 'Slug is required',
    invalid_type_error: 'Slug must be a string',
})
    .min(3, 'Slug must be at least 3 characters')
    .max(common_1.maxLengthPolicies.slug, "Slug should have at most ".concat(common_1.maxLengthPolicies.slug, " characters"));
exports.image = zod_1.z
    .string({
    required_error: 'Avatar is required',
    invalid_type_error: 'Avatar must be a string',
})
    .url('Enter a valid URL')
    .refine(function (imageUri) { return imageUri.startsWith('data:image/'); }, 'Avatar must be an image')
    .refine(function (imageUri) {
    var _a = imageUri.split(','), base64 = _a[1];
    if (!base64) {
        return false;
    }
    var size = base64.length * (3 / 4) - 2;
    return size < 2000000;
}, 'Avatar must be less than 2MB');
exports.domain = zod_1.z
    .string({
    invalid_type_error: 'Domain must be a string',
})
    .max(common_1.maxLengthPolicies.domain, "Domain should have at most ".concat(common_1.maxLengthPolicies.domain, " characters"))
    .optional()
    .refine(function (domain) {
    if (!domain) {
        return true;
    }
    return (0, common_1.isValidDomain)(domain);
}, {
    message: 'Enter a domain name in the format example.com',
})
    .transform(function (domain) {
    if (!domain) {
        return null;
    }
    return domain.trim().toLowerCase();
});
exports.apiKeyId = zod_1.z
    .string({
    required_error: 'API key is required',
    invalid_type_error: 'API key must be a string',
})
    .min(1, 'API key is required');
exports.token = zod_1.z
    .string({
    required_error: 'Token is required',
    invalid_type_error: 'Token must be a string',
})
    .min(1, 'Token is required');
exports.role = zod_1.z.nativeEnum(client_1.Role, {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be a string',
});
exports.sentViaEmail = zod_1.z
    .boolean({
    invalid_type_error: 'Sent via email must be a boolean',
})
    .default(false);
exports.domains = zod_1.z
    .string({
    invalid_type_error: 'Domains must be a string',
})
    .optional()
    .refine(function (domains) { return (domains ? domains.split(',').every(common_1.isValidDomain) : true); }, 'Invalid domain in the list');
exports.expiredToken = zod_1.z
    .string({
    required_error: 'Expired token is required',
    invalid_type_error: 'Expired token must be a string',
})
    .min(1, 'Expired token is required')
    .max(common_1.maxLengthPolicies.expiredToken, "Expired token should have at most ".concat(common_1.maxLengthPolicies.expiredToken, " characters"));
exports.sessionId = zod_1.z
    .string({
    required_error: 'Session id is required',
    invalid_type_error: 'Session id must be a string',
})
    .min(1, 'Session id is required');
exports.priceId = zod_1.z
    .string({
    required_error: 'Price Id is required',
    invalid_type_error: 'Price Id must be a string',
})
    .min(1, 'PriceId is required');
exports.quantity = zod_1.z.number({
    invalid_type_error: 'Quantity must be a number',
});
exports.recaptchaToken = zod_1.z.string({
    invalid_type_error: 'Recaptcha token must be a string',
});
exports.sentViaEmailString = zod_1.z
    .string()
    .max(common_1.maxLengthPolicies.sendViaEmail, "Send via email should be at most ".concat(common_1.maxLengthPolicies.sendViaEmail, " characters"))
    .refine(function (value) { return value === 'true' || !value || value === 'false'; }, {
    message: 'sentViaEmail must be a string "true" or "false" or empty',
});
exports.invitationId = zod_1.z
    .string({
    required_error: 'Invitation id is required',
    invalid_type_error: 'Invitation id must be a string',
})
    .min(1, 'Invitation id is required')
    .max(common_1.maxLengthPolicies.invitationId, "Invitation id should be at most ".concat(common_1.maxLengthPolicies.invitationId, " characters"));
exports.endpointId = zod_1.z
    .string({
    required_error: 'Endpoint id is required',
    invalid_type_error: 'Endpoint id must be a string',
})
    .min(1, "Endpoint id is required")
    .max(common_1.maxLengthPolicies.endpointId, "Endpoint id should be at most ".concat(common_1.maxLengthPolicies.endpointId, " characters"));
exports.eventTypes = zod_1.z
    .array(zod_1.z
    .string({
    invalid_type_error: 'Event type must be a string',
    required_error: 'Event type is required',
})
    .min(1)
    .max(common_1.maxLengthPolicies.eventType, "Event type should be at most ".concat(common_1.maxLengthPolicies.eventType, " characters")))
    .min(1, 'At least one event type is required')
    .max(common_1.maxLengthPolicies.eventTypes, 'Too many event types');
exports.url = zod_1.z
    .string({
    invalid_type_error: 'URL must be a string',
})
    .url('Enter a valid URL')
    .min(1, 'URL is required')
    .max(common_1.maxLengthPolicies.domain, "URL should have at most ".concat(common_1.maxLengthPolicies.domain, " characters"))
    .refine(function (url) {
    if (url) {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            return true;
        }
    }
    return false;
});
exports.inviteToken = zod_1.z
    .string({
    required_error: 'Invite token is required',
    invalid_type_error: 'Invite token must be a string',
})
    .min(1, 'Invite token is required')
    .max(common_1.maxLengthPolicies.inviteToken, "Invite token should be at most ".concat(common_1.maxLengthPolicies.inviteToken, " characters"));
exports.memberId = zod_1.z
    .string({
    required_error: 'Member id is required',
    invalid_type_error: 'Member id must be a string',
})
    .min(1)
    .max(common_1.maxLengthPolicies.memberId, "Member id should be at most ".concat(common_1.maxLengthPolicies.memberId, " characters"));
