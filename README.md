# [Spreadable](https://github.com/ortexx/spreadable/) [alpha] [![npm version](https://badge.fury.io/js/spreadable.svg)](https://badge.fury.io/js/spreadable) [![Build status](https://github.com/ortexx/spreadable/workflows/build/badge.svg)](https://github.com/ortexx/spreadable/actions)

Spreadable is a decentralized network mechanism.

There is [an article here](https://ortex.medium.com/spreadable-a-decentralized-network-option-c415bdac7e2e) with an explanation. 

You can use it to combine servers in a public or private network for any purpose. The library consists of two parts:

```javascript
// Server
const Node = require('spreadable').Node;

(async () => {  
  try {
    const node = new Node({
      port: 4000,
      hostname: 'localhost',
      initialNetworkAddress: 'localhost:4000'  
    });
    await node.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
// Client
const Client = require('spreadable').Client;

(async () => {  
  try {
    const client = new Client({
      address: 'localhost:4000'
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

In the example above we run the node and connected to it via the client to do something in the future. Let's add another node to our local network.

```javascript  
// Another server
const Node = require('spreadable').Node;

(async () => {  
  try {
    const node = new Node({
      port: 4001,
      hostname: 'localhost',
      initialNetworkAddress: 'localhost:4000'
    });
    await node.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

In order to join to an already existing network you need to pass __initialNetworkAddress__ option containing the address of any of the network active node. If you are launching the very first server then simply indicate in the option a link to yourself as was done at the very beginning or just skip this option. Now you can add to the network the number of nodes you need. The client can use the address of any active network node to connect to the network itself.

```javascript
const Client = require('spreadable').Client;

(async () => {  
  try {
    const client = new Client({
      address: 'localhost:4000'
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

## How to use the client in a browser

### 1. Use the prepared file as an html script
You can download __spreadable/dist/client/spreadable.client.js__ and import it as a script.

```html
<script type="text/javascript" src="spreadable.client.js"></script>
<script type="text/javascript">
  (async () => {  
    try {
      const client = new ClientSpreadable({
        address: 'localhost:4000'
      });
      await client.init();
    }
    catch(err) {
      console.error(err.stack);
    }
  })();
</script>
```

### 2. Import the prepared file
You can import / require __spreadable/dist/client/spreadable.client.js__ if you use a building system.

```javascript
import Client from 'spreadable/dist/client/spreadable.client.js';

(async () => {
  try {
    const client = new Client({
      address: 'localhost:4001'
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
  }
})();
```

### 3. Build it by yourself
You can use webpack or something else to build the client for the browser with entry point __spreadable/src/browser/client/index.js__. Then you import / require it in your application and use as usually.

## How to use it via the command line
You need to install the library globally:

``` npm install -g spreadable --unsafe-perm=true --allow-root ```

Now you perform various actions running it from your project root folder:

``` spreadable -a status -c ./config.js ```

You can skip the config argument passing if you have file with the name **spreadable.config.js** in the root. To see all actions and commands just look at [spreadable/bin](https://github.com/ortexx/spreadable/tree/master/bin) folder.

## How the network works
For the network working all nodes must be able to interact with each other. Requests are made via the http(s) protocol. The network is p2p, but the nodes are conditionally divided into masters and slaves. From the point of view of rights, there is no difference between them. Masters only additionally maintain some lists for grouping servers and register new members. The network is designed in such a way that at any time a new member can join it or the old one will leave. After a while, another server will take over this role.

## How nodes distinguish each other
The node ID is called __address__ and written as __hostname:port__. Hostname might be a domain name or an ip address. For ipv6 it is __[ip]:port__. By default, the server tries to get its external ip. If the computer is not connected to the Internet then it will use the local ip address. Or you can always pass the __hostname__ as an option manually. If the node address changes then it is simply re-registering on the network.

## What are the limitations
To implement various features it is often required to go through the entire network to find the necessary information. The protocol allows to do this in a sequence of 3 http requests. The first query from the starting point goes from the client to the entry node, the next goes to all masters simultaneously each of which goes through nodes from its list in parallel as well. The number of simultaneous requests always strive to the square root of the network size. Therefore, with a larger network size each node must be configured to be able to work with a large number of tcp connections simultaneously. For example, take a network of 10,000 nodes. For maximum network performance each node must be able to make 100 simultaneous requests and handle 1 per client. Apart from various system requests that occur from time to time to normalize the network.

## What are the requirements
You must have [node-gyp](https://github.com/nodejs/node-gyp) to install dependencies.

If you run the node in a cointainer (virtual machine), then be sure that client ip addresses are forwarding to the node server.
Some virtualization tools don't do it, by default. You have to set it up if possible or just use a proxy server in front of this with filling **x-forwarded-for** header.
Let's say we use **2079** port for public access and **2078** to link it with the virtual machine. All the process would be like that:

`client -> proxy:2079 -> local machine:2078 -> virtual machine:2079`

If you don't pass the real client ip address to the virtual machine, the node will ban all external servers due to vulnerabilities control system working.

Currently, the proxy server must have the same ip address as the node has. If your node ip address is different from the proxy server address, then other nodes will ban you.

## How to control the time of requests
When making requests the client can always specify a timeout.

```javascript
const Client = require('storacle').Client;
const hash = 'someFileHash';

(async () => {
  try {
    const client = new Client({
      address: 'localhost:4000',
      request: {
        clientTimeout: '10s'
      }
    });
    await client.init();
    const link = await client.getFileLink(hash, { timeout: 2000 });
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

First, we set the default timeout, then for a specific request passed a unique one. 

## How exactly the library can be used
You can extend the library code and add various interesting features. A detailed description will be later. For example, [the storacle](https://github.com/ortexx/storacle/) organizes file storage using the protocol.

## How to use https

### 1. Run https server on the node using trusted ssl certificates
Suppose you have a trusted certificate for __example.com__.

```javascript
const Node = require('spreadable').Node;
const fs = require('fs');
const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');

(async () => {  
  try {
    for(let i = 0; i < 10; i++) {
      const node = new Node({
        port: 4000 + i,
        initialNetworkAddress: 'example.com:4000',
        hostname: 'example.com',
        server: {
          key,
          cert
        }
      });
      await node.init();
    }    
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
const Client = require('spreadable').Client;

(async () => {
  try {
    const client = new Client({
      address: 'example.com:4000',
      https: true
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

### 2. Run https server on the node using self-signed certificates
You can also create a self-signed certificate, and use an authentication certificate to make requests. To simplify the example, suppose that one certificate simultaneously contains the addresses of all network nodes.

```javascript
const Node = require('spreadable').Node;
const fs = require('fs');
const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');
const ca = fs.readFileSync('ca.pem');

(async () => {
  try {
    for(let i = 0; i < 10; i++) {
      const node = new Node({
        port: 4000 + i,
        hostname: 'localhost',
        initialNetworkAddress: 'localhost:4000',
        server: {
          https: {
            key, 
            cert,
            ca
          }
        }
      });
      await node.init();
    }    
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
const Client = require('spreadable').Client;
const fs = require('fs');
const ca = fs.readFileSync('ca.pem');

(async () => {  
  try {
    const client = new Client({
      address: 'localhost:4001',
      https: {
        ca
      }
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

Don't forget to pass the authentication certificate in this case.

### 3. Use ningx / apache / e.t.c over the node server
Suppose you have a certificate for all __example.com__ subdomains.

```javascript
const Node = require('spreadable').Node;

(async () => {  
  try {
    for(let i = 0; i < 10; i++) {
      const node = new Node({
        port: 4000 + i,
        publicPort: 443,
        initialNetworkAddress: 'sub1.example.com:443',
        hostname: `sub${i + 1}.example.com`,
        server: {
          https: true
        }
      });
      await node.init();
    }    
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
const Client = require('spreadable').Client;

(async () => {  
  try {
    const client = new Client({
      address: 'sub1.example.com:443',
      https: true
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

You need to make all the necessary settings and redirects on the receiving server.

## How to create a private network

### 1. Use the basic authentication
```javascript
const Node = require('spreadable').Node;
const auth = { username: 'user', password: 'pass' };

(async () => {  
  try {
    const node = new Node({
      port: 4000,
      hostname: 'localhost',
      initialNetworkAddress: 'localhost:4000',
      network: {
        auth
      }
    });
    await node.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
const Client = require('spreadable').Client;
const auth = { username: 'user', password: 'pass' };

(async () => {  
  try {
    const client = new Client({
      address: 'localhost:4000',
      auth
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

### 2. Use your own network access filter

```javascript
const Node = require('spreadable').Node;
const db = require('some-db');
const errors = require('spreadable/src/errors');

class MyNode extends Node {
  networkAccess(req) {
    super.networkAccess(req);

    // we can do any check we want here
    if(!await db.AllowedIpAddresses.count(req.clientIp)) {
      throw new errors.AccessError('You ip address is denied');
    }
  }
}

(async () => {  
  try {
    const node = new MyNode({
      port: 4000,
      hostname: 'localhost',
      initialNetworkAddress: 'localhost:4000'
    });
    await node.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
const Client = require('spreadable').Client;

(async () => {  
  try {
    const client = new Client({
      address: 'localhost:4000'
    });
    await client.init();
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

In both cases the network is closed, but not completely secure. If we use http protocol the data transferred is not encrypted. In some cases this is a suitable option, otherwise you need to use https.

## Versioning

In order for the nodes to interact with each other, they must have the same version. By default, the version consists of the node codename and the first two digits of the library version from package.json. It looks like __spreadable-1.12__, for example. Therefore, if minor and major changes have occurred in the library, then the nodes need to be updated.

## Node configuration

When you create an instance of the node you can pass options below:

* {integer} __port__ - port on which the server will be run.  

* {integer} __[publicPort]__ - port for external access. By default, the same as __port__.

* {string|string[]} __[initialNetworkAddress]__ - input node address to connect to the network. You can pass a list of addresses. By default, it is the node own address.

* {string} __[hostname]__ - node hostname. By default, the system tries to find the external ip address. If it can't, then it chooses the internal one. Therefore, if you want to test something locally it is better to pass "localhost" manually.

* {object} __[storage]__ - section that responds to storage settings. Storage is a place where all the necessary files are recorded: settings, logs, database, etc.

* {string} __[storage.path]__ - storage path. By default, it is ``` `${process.cwd()}/${node.constructor.codename}/storage-${node.port}` ```

* {object} __[request]__ - section that responds for http request settings.

* {integer} __[request.clientConcurrency=50]__ - client request queue size. This means the maximum number of simultaneous client requests per endpoint.

* {number|string} __[request.pingTimeout="1s"]__ - timeout for server health check requests.  

* {number|string} __[request.serverTimeout="2s"]__ - default timeout for a typical server request for any purpose.

* {object} __[network]__ - section that responds for the network settings.

* {boolean} __[network.autoSync=true]__ - automatic node synchronization with the network or not.

* {boolean} __[network.isTrusted=false]__ - can nodes trust each other on this network or not. If the value is false the system will perform additional checks to recognize and ban intruders. This can be resource intensive with a large number of nodes. Therefore, if your network is closed and you control all of your nodes yourself then enable this option.

* {number|string} __[network.syncInterval="16s"]__ - synchronization interval.

* {number|string} __[network.syncTimeCalculationPeriod="1d"]__ - synchronization statistics collection period.

* {object|null} __[network.auth=null]__ - basic authentication information. You can close the network from external access through the basic authentication mechanism using username and password.

* {string} __[network.auth.username]__ - basic authentication username.

* {string} __[network.auth.password]__ - basic authentication password.

* {number|string} __[network.authCookieMaxAge="7d"]__ - period of saving authorization data on the client.

* {integer} __[network.serverMaxFails=10]__ - number of failed requests to some node after which it will be removed from the lists.

* {string[]} __[network.blacklist=[]]__ - list of node addresses or IP addresses that can't work with the network.

* {string[]} __[network.whitelist=[]]__ - list of node addresses or IP addresses that can only work with the network. The whitelist has priority over the blacklist.

* {string[]} __[network.trustlist=[]]__ - list of node addresses or IP addresses that is trusted. The trustlist has priority over the whitelist.

* {object} __[server]__ - section that responds for the server settings.

* {boolean} __[server.https=false]__ - use https or not.

* {number|string} __[server.maxBodySize="500kb"]__ - maximum body size.

* {number} __[server.compressionLevel=6]__ - response compression level.

* {string} __[server.key]__ - ssl key.

* {string} __[server.cert]__ - ssl certificate.

* {string} __[server.ca]__ - ssl certificate authority.

* {object} __[behavior]__ - section that responds for the behavior settings. If the "network.isTrusted" is false then the behavior of the node is monitored to block nodes that disrupt the network.

* {boolean} __[behavior.banByAddress=false]__ - If true, then nodes will be banned by the full address, otherwise only by the ip address.

* {number} __[behavior.candidateSuspicionLevel=5]__ - suspicion level of the candidate node.

* {object|false} __[logger]__ - section that responds for the logger settings. Each logger has its own specific settings. Listed below are only common to all.

* {string|false} __[logger.level="info"]__ - logger level. There are three levels, by default: "info", "warn", "error". The order of listing matters. If the level is "info" this means that all calls will be logged. If you use "warn" level then only "warn" and "error" calls will be logged and so on. To disable the logger pass the level as false.

* {object|false} __[task]__ - section that responds for the task settings. It is necessary to perform some tasks in the background.

* {number|string} __[task.calculateCpuUsageInterval="1s"]__ - CPU load counting task interval. 

## Client configuration

When you create an instance of the client you can pass options below:

* {string|string[]} __[address]__ - input node address to connect to the network. It can be an array with addresses that will be tested in turn until a working one is found. You can skip this option on the browser version to automatically set the current URL address.

* __[auth]__ - look at _node.options.network.auth_.

* __[logger]__ - look at _node.options.logger_.

* __[request]__ - look at _node.options.request_.

* __[request.pingTimeout]__ - look at _node.options.request.pingTimeout_.

* {number|string} __[request.clientTimeout="10s"]__ - default timeout for a typical client request for any purpose.

* {number|string} __[request.approvalQuestionTimeout="20s"]__ - timeout for an approval question.

* {boolean|object} __[https=false]__ - use https or not.

* {string} __[https.ca]__ - ssl certificate authority.

* __[task]__ - look at _node.options.task_.

* {number|string} __[task.workerChangeInterval="30s"]__ - worker node changing interval. Client requests don't have to be made through the passed input address. The input node returns the most free one from the network which is called "worker" in this context. Requests occur through it. After a certain time the worker changes.

## Client interface

__Client.getAuthCookieValue()__ - get the basic auth info from cookies. This method is for the browser client only.

__Client.getPageAddress()__ - get the current page address. This method is for the browser client only.

__Client.getPageProtocol()__ - get the current page url protocol. This method is for the browser client only.

async __Client.prototype.request()__ - request to some client endpoint
  * {string} __endpoint__ - client endpoint to request
  * {object} __[options]__ - request options

## Contribution

If you face a bug or have an idea how to improve the library, create an issue on github. In order to fix something or add new code yourself fork the library, make changes and create a pull request to the master branch. Don't forget about tests in this case. Also you can join [the project on github](https://github.com/ortexx/spreadable/projects/1).
