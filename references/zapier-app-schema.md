# Zapier App Schema Reference

This document describes the structure of a Zapier app built with `zapier-platform-cli`. Read this before generating the Zapier app definition in Phase 4.

## Directory structure

```
zapier-app/
├── index.js              # Main app definition (entry point)
├── package.json          # Must include zapier-platform-core
├── authentication.js     # Auth configuration
├── triggers/
│   └── [trigger_key].js  # One file per trigger
├── creates/
│   └── [action_key].js   # One file per action (Zapier calls them "creates")
└── test/
    ├── triggers.test.js
    └── creates.test.js
```

## index.js structure

```javascript
const authentication = require('./authentication');
// Import each trigger and action
const newOrder = require('./triggers/new_order');
const createOrder = require('./creates/create_order');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: authentication,
  triggers: {
    [newOrder.key]: newOrder,
  },
  creates: {
    [createOrder.key]: createOrder,
  },
};
```

## authentication.js for OAuth2

```javascript
module.exports = {
  type: 'oauth2',
  oauth2Config: {
    authorizeUrl: {
      url: '{{process.env.AUTHORIZE_URL}}',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
        scope: 'openid email',
      },
    },
    getAccessToken: {
      url: '{{process.env.TOKEN_URL}}',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: {
        code: '{{bundle.inputData.code}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        grant_type: 'authorization_code',
      },
    },
    refreshAccessToken: {
      url: '{{process.env.TOKEN_URL}}',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: {
        refresh_token: '{{bundle.authData.refresh_token}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        grant_type: 'refresh_token',
      },
    },
    autoRefresh: true,
  },
  test: {
    url: '{{process.env.BASE_URL}}/api/auth/me',
    method: 'GET',
    headers: { Authorization: 'Bearer {{bundle.authData.access_token}}' },
  },
  connectionLabel: '{{bundle.inputData.email}}',
};
```

## authentication.js for API Key

```javascript
module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      type: 'string',
      required: true,
      helpText: 'Found in your account settings under API Keys.',
    },
  ],
  test: {
    url: '{{process.env.BASE_URL}}/api/auth/me',
    method: 'GET',
    headers: { Authorization: 'Bearer {{bundle.authData.api_key}}' },
  },
  connectionLabel: '{{bundle.inputData.email}}',
};
```

## Trigger file structure (webhook-based, recommended)

```javascript
// triggers/new_order.js

const subscribeHook = async (z, bundle) => {
  const response = await z.request({
    url: `${process.env.BASE_URL}/api/integrations/zapier/subscribe`,
    method: 'POST',
    headers: { Authorization: `Bearer ${bundle.authData.access_token}` },
    body: {
      trigger_key: 'new_order',
      webhook_url: bundle.targetUrl,
    },
  });
  return response.data;
};

const unsubscribeHook = async (z, bundle) => {
  const response = await z.request({
    url: `${process.env.BASE_URL}/api/integrations/zapier/subscribe/${bundle.subscribeData.id}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${bundle.authData.access_token}` },
  });
  return response.data;
};

// Zapier calls this during setup to show sample data
const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${process.env.BASE_URL}/api/integrations/zapier/triggers/new_order/sample`,
    method: 'GET',
    headers: { Authorization: `Bearer ${bundle.authData.access_token}` },
  });
  return response.data;
};

// Zapier calls this when a webhook fires
const perform = (z, bundle) => {
  return [bundle.cleanedRequest];
};

module.exports = {
  key: 'new_order',
  noun: 'Order',
  display: {
    label: 'New Order Created',
    description: 'Triggers when a new order is placed.',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: perform,
    performList: performList,
    sample: {
      id: '12345',
      customer_email: 'john@acme.com',
      total: 99.99,
      created_at: '2026-04-28T10:00:00Z',
    },
    outputFields: [
      { key: 'id', label: 'Order ID', type: 'string' },
      { key: 'customer_email', label: 'Customer Email', type: 'string' },
      { key: 'total', label: 'Total Amount', type: 'number' },
      { key: 'created_at', label: 'Created At', type: 'datetime' },
    ],
  },
};
```

## Action (Create) file structure

```javascript
// creates/create_order.js

const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${process.env.BASE_URL}/api/integrations/zapier/actions/create_order`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: {
      customer_email: bundle.inputData.customer_email,
      total: bundle.inputData.total,
    },
  });
  return response.data;
};

module.exports = {
  key: 'create_order',
  noun: 'Order',
  display: {
    label: 'Create Order',
    description: 'Creates a new order.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'customer_email',
        label: 'Customer Email',
        type: 'string',
        required: true,
      },
      {
        key: 'total',
        label: 'Total Amount',
        type: 'number',
        required: true,
      },
    ],
    sample: {
      id: '12345',
      customer_email: 'john@acme.com',
      total: 99.99,
      created_at: '2026-04-28T10:00:00Z',
    },
  },
};
```

## Environment variables

The Zapier app uses environment variables for configuration. Set these in the Zapier Developer Platform dashboard:

- `BASE_URL`: Your API base URL (e.g., https://api.yourapp.com)
- `CLIENT_ID`: OAuth2 client ID (if using OAuth2)
- `CLIENT_SECRET`: OAuth2 client secret (if using OAuth2)
- `AUTHORIZE_URL`: OAuth2 authorize URL (if using OAuth2)
- `TOKEN_URL`: OAuth2 token URL (if using OAuth2)

## Publishing checklist

Before submitting to Zapier for review:

1. All triggers have sample data and output field definitions
2. All actions have input field definitions with correct types
3. Auth test endpoint returns a 200 with valid credentials
4. Tests pass: `zapier test`
5. App validates: `zapier validate`
6. README exists with setup instructions
7. No hardcoded credentials anywhere in the code
8. All API endpoints use HTTPS
