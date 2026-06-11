# Security Specification - Voyanta Contact System

## 1. Data Invariants
- A contact message MUST have a valid name (string, 2-256 chars).
- A contact message MUST have a valid email (regex verified, 5-256 chars).
- A contact message MUST have a non-empty message (string, 10-5000 chars).
- `createdAt` MUST be the server-side timestamp.
- No one can read messages except for verified admins.

## 2. The "Dirty Dozen" Payloads (Red Team Audit)

1. **Identity Spoofing**: Attempt to write as another user (though this is a public form).
2. **Shadow Field Injection**: Attempt to add `isVerified: true` or `isAdmin: true` to a message.
3. **Ghost Read**: Attempt to read all messages as an unauthenticated user.
4. **ID Poisoning**: Attempt to use `../poison/path` or a 2MB string as an ID.
5. **Denial of Wallet**: Attempt to write a 1MB message (limited to 5000 chars).
6. **Time Travel**: Attempt to set `createdAt` to a date in 1999 or 2099.
7. **Type Mismatch**: Attempt to send `name: 123` (integer).
8. **Recursive Update**: Attempt to update a message after creation.
9. **Orphan Write**: Writing to a collection not defined in the blueprint.
10. **Email Spoofing**: Sending an email that doesn't match a valid format.
11. **PII Leak**: Reading individual messages by guessing IDs.
12. **Blanket List**: Querying the whole collection without filters.

## 3. Test Scenarios (Manual/Logic Verification)

- `create`: Succeeds if fields are valid and `createdAt == request.time`.
- `update`: ALWAYS fails (immutable).
- `delete`: ALWAYS fails (log only).
- `read`: Fails for non-admins.
- `list`: Fails for non-admins.
