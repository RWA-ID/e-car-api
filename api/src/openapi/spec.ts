export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'e-car.eth Protocol API',
    description: 'REST + GraphQL + WebSocket API for the e-car.eth decentralized EV protocol. Integrate vehicle identity, battery passports, payments, and voice commands into your OEM stack.',
    version: '0.1.0',
    contact: { email: 'api@e-car.eth' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local development' },
    { url: 'https://api.e-car.eth', description: 'Production' },
  ],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Get your API key at POST /auth/keys',
      },
    },
    schemas: {
      Vehicle: {
        type: 'object',
        properties: {
          tokenId: { type: 'string', example: '1' },
          manufacturer: { type: 'string', example: 'Tesla' },
          model: { type: 'string', example: 'Model 3' },
          year: { type: 'integer', example: 2024 },
          batteryCapacityKwh: { type: 'string', example: '82000' },
          registrationDate: { type: 'string', example: '1711000000' },
          locked: { type: 'boolean', example: true },
          owner: { type: 'string', example: '0xabc...' },
        },
      },
      Brand: {
        type: 'object',
        properties: {
          brand: { type: 'string', example: 'tesla' },
          ensName: { type: 'string', example: 'tesla.e-car.eth' },
          reserved: { type: 'boolean' },
          claimed: { type: 'boolean' },
          registry: { type: 'string', nullable: true },
          resolver: { type: 'string', nullable: true },
          multiSig: { type: 'string', nullable: true },
        },
      },
      BatteryPassport: {
        type: 'object',
        properties: {
          vehicleId: { type: 'string' },
          stateOfHealth: { type: 'integer', example: 87 },
          cycleCount: { type: 'integer', example: 342 },
          merkleRoot: { type: 'string' },
          timestamp: { type: 'integer' },
        },
      },
      ChargingSession: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          escrowId: { type: 'string' },
          stationNodeId: { type: 'string' },
          vehicleId: { type: 'string' },
          estimatedKwh: { type: 'number' },
          estimatedCost: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] },
          txHash: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/keys': {
      post: {
        summary: 'Generate API key',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['label'],
                properties: {
                  label: { type: 'string', example: 'Tesla OEM Integration' },
                  tier: { type: 'string', enum: ['free', 'oem', 'enterprise'], default: 'free' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'API key created' } },
      },
    },
    '/auth/tiers': {
      get: { summary: 'List API tiers and pricing', tags: ['Auth'], security: [], responses: { '200': { description: 'OK' } } },
    },
    '/api/v1/vehicles/{tokenId}': {
      get: {
        summary: 'Get vehicle by token ID',
        tags: ['Vehicles'],
        parameters: [{ name: 'tokenId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Vehicle data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } } },
      },
    },
    '/api/v1/vehicles': {
      post: {
        summary: 'Register a new vehicle',
        tags: ['Vehicles'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vin', 'manufacturer', 'model', 'year'],
                properties: {
                  vin: { type: 'string', example: '5YJSA1H21FFP12345' },
                  manufacturer: { type: 'string', example: 'Tesla' },
                  model: { type: 'string', example: 'Model 3' },
                  year: { type: 'integer', example: 2024 },
                  batteryCapacityKwh: { type: 'integer', example: 82000 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Vehicle registered' } },
      },
    },
    '/api/v1/brands/{brand}': {
      get: {
        summary: 'Get brand namespace info',
        tags: ['Brands'],
        parameters: [{ name: 'brand', in: 'path', required: true, schema: { type: 'string' }, example: 'tesla' }],
        responses: { '200': { description: 'Brand info', content: { 'application/json': { schema: { $ref: '#/components/schemas/Brand' } } } } },
      },
    },
    '/api/v1/charging/stations': {
      get: { summary: 'List charging stations', tags: ['Charging'], responses: { '200': { description: 'Stations list' } } },
      post: { summary: 'Register charging station', tags: ['Charging'], responses: { '201': { description: 'Station registered' } } },
    },
    '/api/v1/charging/sessions': {
      post: { summary: 'Initiate charging session', tags: ['Charging'], responses: { '201': { description: 'Session started' } } },
    },
    '/api/v1/battery/{vehicleId}': {
      get: { summary: 'Get latest battery passport', tags: ['Battery'], responses: { '200': { description: 'Battery data', content: { 'application/json': { schema: { $ref: '#/components/schemas/BatteryPassport' } } } } } },
    },
    '/api/v1/carbon/{vehicleId}': {
      get: { summary: 'Get carbon credit balance', tags: ['Carbon'], responses: { '200': { description: 'Carbon data' } } },
    },
    '/api/v1/voice/intent': {
      post: { summary: 'Process voice intent', tags: ['Voice'], responses: { '200': { description: 'Intent result' } } },
    },
    '/graphql': {
      get: { summary: 'GraphQL endpoint', tags: ['GraphQL'], security: [], responses: { '200': { description: 'GraphQL schema' } } },
    },
  },
  tags: [
    { name: 'System', description: 'Health and status' },
    { name: 'Auth', description: 'API key management' },
    { name: 'Vehicles', description: 'Vehicle identity (ERC-721 + ERC-5192)' },
    { name: 'Brands', description: 'OEM brand namespaces under e-car.eth' },
    { name: 'Battery', description: 'Battery passport and health data' },
    { name: 'Charging', description: 'Charging station registry and payment routing' },
    { name: 'Carbon', description: 'Carbon credit minting and retirement' },
    { name: 'Fleet', description: 'Commercial fleet management' },
    { name: 'Voice', description: 'Voice command processing' },
    { name: 'GraphQL', description: 'GraphQL query interface' },
  ],
}
