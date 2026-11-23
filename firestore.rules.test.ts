/**
 * Firestore Security Rules Test Specification (Dirty Dozen + Role Isolation)
 * Can be run against Firebase Emulator Suite using @firebase/rules-unit-testing.
 */
import assert from 'node:assert';

export interface RuleScenario {
  name: string;
  actor: 'anonymous' | 'unverified' | 'nonAdminUser' | 'authorizedAdmin';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  expected: 'ALLOW' | 'DENY';
}

export const SECURITY_RULE_SCENARIOS: RuleScenario[] = [
  {
    name: 'Visitor cannot escalate themselves to /admins',
    actor: 'anonymous',
    operation: 'create',
    path: '/admins/fake-uid',
    expected: 'DENY'
  },
  {
    name: 'Unverified token cannot access /authorized_emails',
    actor: 'unverified',
    operation: 'get',
    path: '/authorized_emails/koneelise258@gmail.com',
    expected: 'DENY'
  },
  {
    name: 'Non-admin signed-in user cannot read secretGateSlug',
    actor: 'nonAdminUser',
    operation: 'get',
    path: '/security_config/gate',
    expected: 'DENY'
  },
  {
    name: 'Visitor cannot read draft culte',
    actor: 'anonymous',
    operation: 'get',
    path: '/cultes/draft-culte-1',
    expected: 'DENY'
  },
  {
    name: 'Visitor can read published culte',
    actor: 'anonymous',
    operation: 'get',
    path: '/cultes/pub-culte-1',
    expected: 'ALLOW'
  },
  {
    name: 'Visitor cannot overwrite event title during like update',
    actor: 'anonymous',
    operation: 'update',
    path: '/events/ev-1',
    expected: 'DENY'
  },
  {
    name: 'Visitor cannot read push_subscriptions list',
    actor: 'anonymous',
    operation: 'list',
    path: '/push_subscriptions',
    expected: 'DENY'
  },
  {
    name: 'Visitor can register validated push subscription by sha256 ID',
    actor: 'anonymous',
    operation: 'create',
    path: '/push_subscriptions/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    expected: 'ALLOW'
  },
  {
    name: 'Admin cannot delete immutable security logs',
    actor: 'authorizedAdmin',
    operation: 'delete',
    path: '/security_logs/log-1',
    expected: 'DENY'
  },
  {
    name: 'Admin can manage departments and drive accounts',
    actor: 'authorizedAdmin',
    operation: 'create',
    path: '/drive_accounts/koneelise258@gmail.com',
    expected: 'ALLOW'
  }
];

assert.strictEqual(SECURITY_RULE_SCENARIOS.length, 10);
