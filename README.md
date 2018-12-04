# Node API Gateway

This is a NodeJS Microservice API Gateway, built using [Traefik](https://traefik.io), [NATS](https://nats.io), [Hapi](https://hapijs.com), [Hemera](https://hemerajs.github.io/hemera) and [Docker](https://www.docker.com).

The structure of this project allows us to easily scale workers in seconds. NATS is used as the "nervous system" for the distributed system removing the need for service-discovery, and load-balancing of our hemera-services. Traefik performs load-balancing on the [API Gateway](#api-gateway) itself.

## Getting started

-   It is recommended that you download and install [VS Code](https://code.visualstudio.com/).
-   Clone the repository
-   Install Docker
-   Running the system:
-   -   Execute `docker-compose up` from the project root directory.
-   Stopping the system:
-   -   Execute `docker-compose stop` from the project root directory.
-   Destroying the system:
-   -   Execute `docker-compose down` from the project root directory.
-   -   This will remove the containers that were created
-   Use the Postman file in `./system/postman` to test API requests.

## Need a frontend

An integrated React frontend has been developed and can be found at [react.antd.fuse](https://github.com/nicolaspearson/react.antd.fuse)

### Captcha

Captcha codes have been integrated using reCaptcha. Register for v2 reCaptcha codes [here](https://www.google.com/recaptcha/intro/v3.html), then change the secrets in the environment variables accordingly.

```
"RECAPTCHA_SECRET": "<YOUR-SITE-KEY>"
"RECAPTCHA_INVISIBLE_SECRET": "<YOUR-SITE-INVISIBLE-KEY>"
```

## Development

To add a new microservice:

1. Use the [Template Service](#template-service) as a starting point.
2. Copy and paste the folder, and rename all of the `template` references.
3. Add your routes to the API Gateway.
4. Bring the system up by executing `docker-compose up`
5. You should now be able to use `npm start` from your microservices' directory.
6. Once you are done with development add an entry for the new microservice to the `docker-compose.yml` file.

## Scaling

To create additional containers to assist with handling high load you can execute `docker-compose scale auth-service=5 api-gateway=2`, after the system is up.

When scaling you must remove the container_name, e.g. (`container_name: lupinemoon-auth-service`), and debugging configuration from the docker configuration file, e.g. `docker-compose.yml`

**Note: In production we use an container orchestration tool like Kubernetes / Mesos**

## Project structure

The project is divided into various microservices. A microservice in this architecture is simply a service which is responsible for a single broadly-defined task, e.g. the `auth-service` performs the task of creating, and validating JWT tokens against a database of authorized users.

### Microservices

-   **API Gateway** - This is the central REST entrypoint into the application for external consumers.
-   **Auth Service** - The Auth Service is responsible for authorizing users and validating JWT tokens. All requests except `login` and `sign-up`, must be decorated with `config: { auth: 'jwt' }` when declaring the routes in the `api-gateway`.
-   **Lupine Moon DB** - This database is used by all of the other microservices that need to access the central database.
-   **Cache Service** - Is responsible for caching `GET` requests for all of the microservices.
-   **Registration Service** - The Registration Service is responsible for performing registration related, e.g. early access sign-up, contact us form submission, sign-up, etc. All new requests must be decorated with `config: { auth: 'jwt' }` when declaring the routes in the `api-gateway`.
-   **Redis** - Serves as the data store for cached results.
-   **NATS** - The central "nervous system" of the application.
-   **Jaeger** - Provides distributed tracing of requests.
-   **Traefik** - A reverse proxy and load balancer that wraps all of the microservices, to provide easy deployment (Docker / Kubernetes), security (SSL), auto discovery (Microservices), and tracing (Jaeger).

#### API Gateway

The API Gateway serves as the entrypoint for external consumers of the REST API. The Gateway itself is not responsible for performing logical work, but simply routes traffic to one of the pre-defined microservices to retrieve a result for a consumer.

Directory structure:

```
src
├── environments
│   ├── config.default.json
│   ├── config.development.json
│   ├── config.production.json
│   ├── config.staging.json
│   └── index.ts
├── index.ts
├── logger
│   └── app.logger.ts
├── routes
│   ├── auth.routes.ts
└── types
    └── ...
```

Overview:

-   **environments** - Configuration of static application variables. See [Configuration](#configuration) for more information and usage.
-   **index.ts** - Application entrypoint.
-   **logger** - Application logging.
-   **routes** - Hapi route definitions.
-   **types** - Additional typescript definitions.

#### Configuration

The configuration of static application variables is done using [nconf](https://github.com/indexzero/nconf). It allows us to set the hierarchy for different sources of configuration with no defaults. Thus providing an easy way to configure the applications for the various environments, i.e. `development`, `staging`, and `production`.

The configuration hierarchy being used:

1.  argv - Command line arguments will override environment variables, and configuration files.
2.  env - Environment variables will override configuration files.
3.  file - Files will be used as the baseline configuration if neither of the above is specified.

#### Auth Service

The Auth Service is responsible for authorizing users and validating JWT tokens. All requests except `login` and `sign-up`, must be decorated with `config: { auth: 'jwt' }` when declaring the route in the `api-gateway`.

Directory structure:

```
src
├── actions
│   ├── auth.actions.ts
│   └── index.ts
├── app
│   └── database.app.ts
├── environments
│   ├── config.default.json
│   ├── config.development.json
│   ├── config.production.json
│   ├── config.staging.json
│   └── index.ts
├── index.ts
├── logger
│   └── app.logger.ts
├── logic
│   └── shared.logic.ts
├── models
│   ├── internal
│   │   ├── search-term.internal.ts
│   │   └── token.internal.ts
│   ├── options
│   │   └── search-query-builder.options.ts
│   ├── role.model.ts
│   └── user.model.ts
├── repositories
│   ├── base.repository.ts
│   └── user.repository.ts
├── services
│   ├── base.service.ts
│   └── user.service.ts
├── types
│   ├── ...
└── utils
    ├── auth.utils.ts
    └── system.utils.ts
```

#### Lupine Moon DB

This PostgreSQL database is used by all of the microservices that require access to the central Lupine Moon database. Each microservice that needs to access this database should do so via a specific schema, e.g. the `registration-service` uses the `registration` schema

Directory structure:

```
lupinemoon-db
├── db-data
├── db-scripts
│   ├── create.sql
│   └── seed.sql
└── docker-compose.yml
```

#### Cache Service

Is responsible for caching `GET` requests for all of the microservices in Redis. It registers via Hemera and is therefore open to communicate with all of the other microservices.

Directory structure:

```
src
├── index.ts
└── types
    └── ...
```

#### Registration Service

This microservice is used all registration events that occur on the front-end, e.g. early access sign-up, user contact form, registration, etc.

Directory structure:

```
src
├── actions
│   ├── early-access.actions.ts
│   ├── index.ts
│   └── metrics.actions.ts
├── app
│   └── database.app.ts
├── environments
│   ├── config.default.json
│   ├── config.development.json
│   ├── config.production.json
│   ├── config.staging.json
│   └── index.ts
├── index.ts
├── logger
│   └── app.logger.ts
├── logic
│   └── shared.logic.ts
├── models
│   ├── early-access.model.ts
│   ├── internal
│   │   └── search-term.internal.ts
│   └── options
│       └── search-query-builder.options.ts
├── repositories
│   ├── base.repository.ts
│   └── early-access.repository.ts
├── services
│   ├── base.service.ts
│   └── early-access.service.ts
└── types
   └── ...
```

#### Redis

Redis serves primarily as the data store for caching `GET` request results of all of the microservices (individual configuration is required).

Overview:

Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache and message broker. It supports data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs and geospatial indexes with radius queries. Redis has built-in replication, Lua scripting, LRU eviction, transactions and different levels of on-disk persistence, and provides high availability via Redis Sentinel and automatic partitioning with Redis Cluster

#### NATS

The central "nervous system" of the application.

Directory structure:

```
nats
├── Dockerfile
├── entrypoint.sh
└── gnatsd.conf
```

Overview:

NATS is a family of open source products that are tightly integrated but can be deployed independently. NATS is being deployed globally by thousands of companies, spanning innovative use-cases including: Mobile apps, Microservices and Cloud Native, and IoT. NATS is also available as a hosted solution, NATS Cloud

The core NATS Server acts as a central nervous system for building distributed applications.

#### Template Service

This should be used as a quick start when creating a new microservice.

Directory structure:

```
src
├── actions
│   ├── index.ts
│   └── template.actions.ts
├── environments
│   ├── config.default.json
│   ├── config.development.json
│   ├── config.production.json
│   ├── config.staging.json
│   └── index.ts
├── index.ts
├── logger
│   └── app.logger.ts
├── logic
│   └── shared.logic.ts
└── types
   └── ...
```

#### Jaeger

Provides distributed tracing of requests.

Overview:

Jaeger, inspired by Dapper and OpenZipkin, is a distributed tracing system released as open source by Uber Technologies. It is used for monitoring and troubleshooting microservices-based distributed systems, including:

-   Distributed context propagation
-   Distributed transaction monitoring
-   Root cause analysis
-   Service dependency analysis
-   Performance / latency optimization

#### Traefik

A reverse proxy and load balancer that wraps all of the microservices, to provide easy deployment (Docker / Kubernetes), security (SSL), auto discovery (Microservices), and tracing (Jaeger).

Directory structure:

```
traefik
└── traefik.toml
```

Overview:

Traefik is a modern HTTP reverse proxy and load balancer that makes deploying microservices easy. Traefik integrates with your existing infrastructure components (Docker, Swarm mode, Kubernetes, Marathon, Consul, Etcd, Rancher, Amazon ECS, ...) and configures itself automatically and dynamically. Pointing Traefik at your orchestrator should be the only configuration step you need.

Imagine that you have deployed a bunch of microservices with the help of an orchestrator (like Swarm or Kubernetes) or a service registry (like etcd or consul). Now you want users to access these microservices, and you need a reverse proxy.

Traditional reverse-proxies require that you configure each route that will connect paths and subdomains to each microservice. In an environment where you add, remove, kill, upgrade, or scale your services many times a day, the task of keeping the routes up to date becomes tedious.

This is when Traefik can help you!

Traefik listens to your service registry/orchestrator API and instantly generates the routes so your microservices are connected to the outside world -- without further intervention from your part.

Run Traefik and let it do the work for you! (But if you'd rather configure some of your routes manually, Traefik supports that too!)

Features:

-   Continuously updates its configuration (No restarts!)
-   Supports multiple load balancing algorithms
-   Provides HTTPS to your microservices by leveraging Let's Encrypt (wildcard certificates support)
-   Circuit breakers, retry
-   High Availability with cluster mode (beta)
-   See the magic through its clean web UI
-   Websocket, HTTP/2, GRPC ready
-   Provides metrics (Rest, Prometheus, Datadog, Statsd, InfluxDB)
-   Keeps access logs (JSON, CLF)
-   Fast
-   Exposes a Rest API
-   Packaged as a single binary file, and available as a tiny official docker image

Supported Providers:

-   Docker / Swarm mode
-   Kubernetes
-   Mesos / Marathon
-   Rancher (API, Metadata)
-   Azure Service Fabric
-   Consul Catalog
-   Consul / Etcd / Zookeeper / BoltDB
-   Eureka
-   Amazon ECS
-   Amazon DynamoDB
-   File
-   Rest

#### System (Directory)

The system directory contains postman files, and load testing scripts.

Directory structure:

```
system
├── load-test
│   └── load-test.yml
└── postman
    └── node.api.gateway.postman_collection.json
```

## Major Technologies used

-   [Node.js](https://nodejs.org/en/)
-   [Typescript](https://www.typescriptlang.org/)
-   [Traefik](https://traefik.io)
-   [NATS](https://nats.io)
-   [Hapi](https://hapijs.com)
-   [Hemera](https://hemerajs.github.io/hemera)
-   [Docker](https://www.docker.com)
-   [Jaeger](https://www.jaegertracing.io/)
-   [Redis](https://redis.io)

## Debugging with VS Code and Docker

It is possible to debug code that is running in a docker container by following the steps below:

1.  Add a new debug configuration to VS Code by opening `./.vscode/launch.json`, e.g.

```
		{
			"name": "Attach to Docker - Auth Service",
			"type": "node",
			"protocol": "inspector",
			"request": "attach",
			"restart": true,
			"address": "localhost",
			"sourceMaps": true,
			"skipFiles": ["node_modules"],
			"port": 9229,
			"localRoot": "${workspaceRoot}/auth-service/",
			"remoteRoot": "/home/app/node"
		}
```

2.  Edit the docker configuration file in order to enable debugging on the running Node.js process, e.g.
    Add the following the service definition:

```
    ports:
      - 9229:9229
    command: node --inspect=0.0.0.0:9229 /home/app/node/dist/index.js
```

Full example:

```
  auth-service:
    build:
      context: "../../auth-service"
    links:
      - nats
      - postgres-lupinemoon
    depends_on:
      - nats
      - redis
      - jaeger
    restart: always
    container_name: lupinemoon-auth-service
    ports:
      - 9229:9229
    command: node --inspect=0.0.0.0:9229 /home/app/node/dist/index.js
    environment:
      NODE_ENV: staging
      NATS_URL: nats://nats:4222
      NATS_USER: ruser
      NATS_PW: T0pS3cr3t
      JAEGER_URL: jaeger
      DB_HOST: postgres-lupinemoon
      HEMERA_LOG_LEVEL: debug
    networks:
      - node-ms-net
```

3.  Add a breakpoint at the required place on a file in the `dist` directory.

## Dashboards

-   Traefik [http://localhost:8183/](http://localhost:8183/)
-   NATS [http://localhost:8222/](http://localhost:8222/)
-   Jaeger [http://localhost:16686/](http://localhost:16686/)

## Load Testing

[Artillery](https://artillery.io/) is a modern, powerful & easy-to-use load testing toolkit. Use it to ship scalable applications that stay performant & resilient under high load.

```bash
npm install -g artillery
cd system/load-test
artillery run -o artillery_report_load_test_1.json load-test.yml
artillery report artillery_report_load_test_1.json
```
