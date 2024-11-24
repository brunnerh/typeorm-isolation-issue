# Transaction independence issue reproduction

Includes test showing that separate transactions appear to be rolled back when
one of them fails.

Last working version: `0.3.18-dev.3cda7ec`\
Broken since version: `0.3.18-dev.0f11739`

## Installation & running

```shell
deno install --allow-scripts # required for sqlite3, used for running in-memory
deno test -A # flag gives all permissions
```

## Switching version to last working

```shell
deno add npm:typeorm@0.3.18-dev.3cda7ec
```
