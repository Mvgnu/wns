"use strict";
/**
 * Schema.org utilities for generating structured data for SEO
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUGCSchema = createUGCSchema;
exports.createEventSchema = createEventSchema;
exports.createGroupSchema = createGroupSchema;
exports.createLocationSchema = createLocationSchema;
exports.createPostSchema = createPostSchema;
exports.combineSchemas = combineSchemas;
// UGC indicator for user-generated content
function createUGCSchema(props) {
    const { type, url, creator, dateCreated, dateModified } = props;
    return {
        '@context': 'https://schema.org',
        '@type': 'UserComments', // The main type for UGC content
        creator: creator
            ? Object.assign({ '@type': 'Person', name: creator.name }, (creator.url && { url: creator.url })) : undefined,
        discussionUrl: url,
        dateCreated: dateCreated === null || dateCreated === void 0 ? void 0 : dateCreated.toISOString(),
        dateModified: dateModified === null || dateModified === void 0 ? void 0 : dateModified.toISOString(),
        mainContentOfPage: {
            '@type': type,
            // We don't add more details here as they will be provided
            // in the main schema for the content
        }
    };
}
// Generic metadata for different content types
function createEventSchema(event, baseUrl) {
    const eventUrl = `${baseUrl}/events/${event.id}`;
    return Object.assign(Object.assign(Object.assign(Object.assign({ '@context': 'https://schema.org', '@type': 'Event', name: event.title, description: event.description || undefined, startDate: event.startTime.toISOString() }, (event.endTime && { endDate: event.endTime.toISOString() })), { image: event.image || undefined, url: eventUrl, organizer: event.organizer
            ? {
                '@type': 'Person',
                name: event.organizer.name,
                url: `${baseUrl}/profile/${event.organizer.id}`,
            }
            : undefined, location: event.location
            ? Object.assign({ '@type': 'Place', name: event.location.name, address: event.location.address || undefined }, (event.location.latitude && event.location.longitude
                ? {
                    geo: {
                        '@type': 'GeoCoordinates',
                        latitude: event.location.latitude,
                        longitude: event.location.longitude,
                    },
                }
                : {})) : undefined, eventAttendanceMode: 'OfflineEventAttendanceMode' }), (event.group
        ? {
            eventStatus: 'EventScheduled',
            organizer: {
                '@type': 'Organization',
                name: event.group.name,
                url: `${baseUrl}/groups/${event.group.id}`,
            },
        }
        : {})), (event._count
        ? {
            attendee: {
                '@type': 'audience',
                audienceType: 'Enthusiasts',
                audienceSize: event._count.attendees,
            },
        }
        : {}));
}
function createGroupSchema(group, baseUrl) {
    const groupUrl = `${baseUrl}/groups/${group.id}`;
    return Object.assign({ '@context': 'https://schema.org', '@type': 'Organization', name: group.name, description: group.description || undefined, image: group.image || undefined, url: groupUrl, founder: group.owner
            ? {
                '@type': 'Person',
                name: group.owner.name,
                url: `${baseUrl}/profile/${group.owner.id}`,
            }
            : undefined, member: group._count
            ? {
                '@type': 'OrganizationRole',
                memberOf: {
                    '@type': 'Organization',
                    name: group.name,
                },
                numberOfMembers: group._count.members,
            }
            : undefined }, (group.sport
        ? {
            knowsAbout: group.sport,
        }
        : {}));
}
function createLocationSchema(location, baseUrl) {
    var _a;
    const locationUrl = `${baseUrl}/locations/${location.id}`;
    return Object.assign(Object.assign(Object.assign(Object.assign({ '@context': 'https://schema.org', '@type': 'Place', name: location.name, description: location.description || undefined, image: ((_a = location.images) === null || _a === void 0 ? void 0 : _a[0]) || undefined, url: locationUrl }, (location.address
        ? {
            address: {
                '@type': 'PostalAddress',
                streetAddress: location.address,
            },
        }
        : {})), (location.latitude && location.longitude
        ? {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: location.latitude,
                longitude: location.longitude,
            },
        }
        : {})), (location.sport
        ? {
            amenityFeature: {
                '@type': 'LocationFeatureSpecification',
                name: location.sport,
                value: true,
            },
        }
        : {})), (location._count && location._count.reviews > 0
        ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: location.rating || 0,
                reviewCount: location._count.reviews,
            },
        }
        : {}));
}
function createPostSchema(post, baseUrl) {
    var _a;
    const postUrl = `${baseUrl}/posts/${post.id}`;
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        articleBody: post.content || undefined,
        image: ((_a = post.images) === null || _a === void 0 ? void 0 : _a[0]) || undefined,
        url: postUrl,
        datePublished: post.createdAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: post.author
            ? {
                '@type': 'Person',
                name: post.author.name,
                url: `${baseUrl}/profile/${post.author.id}`,
            }
            : undefined,
        publisher: post.group
            ? {
                '@type': 'Organization',
                name: post.group.name,
                url: `${baseUrl}/groups/${post.group.id}`,
            }
            : {
                '@type': 'Organization',
                name: 'WNS Community',
                url: baseUrl,
            },
    };
}
// Helper function to combine schema objects for a page
function combineSchemas(...schemas) {
    // Filter out undefined or null schemas
    const validSchemas = schemas.filter(schema => schema);
    if (validSchemas.length === 0) {
        return null;
    }
    if (validSchemas.length === 1) {
        return validSchemas[0];
    }
    return {
        '@context': 'https://schema.org',
        '@graph': validSchemas.map(schema => {
            // Remove @context from individual schemas when combining
            const { ['@context']: _ } = schema, rest = __rest(schema, ['@context']);
            return rest;
        }),
    };
}
