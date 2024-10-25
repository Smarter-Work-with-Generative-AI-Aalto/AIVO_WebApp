"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxLengthPolicies = exports.eventTypes = exports.passwordPolicies = exports.defaultHeaders = exports.copyToClipboard = exports.isValidDomain = void 0;
var domainRegex = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;
var isValidDomain = function (domain) {
    return domainRegex.test(domain);
};
exports.isValidDomain = isValidDomain;
var copyToClipboard = function (text) {
    navigator.clipboard.writeText(text);
};
exports.copyToClipboard = copyToClipboard;
exports.defaultHeaders = {
    'Content-Type': 'application/json',
};
exports.passwordPolicies = {
    minLength: 8,
};
// List of events used to create webhook endpoint
exports.eventTypes = [
    'member.created',
    'member.removed',
    'invitation.created',
    'invitation.removed',
];
exports.maxLengthPolicies = {
    name: 104,
    nameShortDisplay: 20,
    email: 254,
    password: 128,
    team: 50,
    slug: 50,
    domain: 253,
    domains: 1024,
    apiKeyName: 64,
    webhookDescription: 100,
    webhookEndpoint: 2083,
    memberId: 64,
    eventType: 50,
    eventTypes: exports.eventTypes.length,
    endpointId: 64,
    inviteToken: 64,
    expiredToken: 64,
    invitationId: 64,
    sendViaEmail: 10,
};
