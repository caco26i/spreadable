const validateIP = require('validate-ip-node');
const bytes = require('bytes');
const ms = require('ms');
const lookup = require('lookup-dns-cache').lookup;
const tcpPortUsed = require('tcp-port-used');
const ip6addr = require('ip6addr'); 

const utils = {
  hostValidationRegex: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
};

/**
 * Validate the schema
 * 
 * @param {object|array|string} schema
 * @param {*} data
 */
utils.validateSchema = function (schema, data) {
  if(Array.isArray(schema) || typeof schema != 'object') {
    schema = { type: schema };
  }

  const humanData = JSON.stringify(data, null, 2);
  const humanSchema = JSON.stringify(schema, null, 2);
  const schemaType = Array.isArray(schema.type)? schema.type: [schema.type];
  const dataType = Array.isArray(data)? 'array': typeof data;

  if(schemaType.indexOf(dataType) == -1) {
    throw new Error(`Wrong data type "${dataType}" instead of "${schemaType}" ${humanData} for ${humanSchema}`);
  }

  if(dataType == 'array') {
    if(schema.minLength && data.length < schema.minLength) {
      throw new Error(`Wrong array min length ${humanData} for ${humanSchema}`);
    }

    if(schema.maxLength && data.length > schema.maxLength) {
      throw new Error(`Wrong array max length ${humanData} for ${humanSchema}`);
    }

    if(schema.items) {
      data.forEach(item => this.validateSchema(schema.items, item));
    }
  }
  else if(dataType == 'object') {
    const props = schema.props || {};  
    const required = schema.required? (Array.isArray(schema.required)? schema.required: [schema.required]): null;
    
    if(schema.strict) {
      const schemaKeys =  Object.keys(props).sort();
      const dataKeys =  Object.keys(data).sort();

      if(schemaKeys.toString() != dataKeys.toString()) {
        throw new Error(`Wrong object structure ${humanData} for ${humanSchema}`);
      }     
    }

    for(let prop in props) {
      if(!data.hasOwnProperty(prop)) {
        if(required && required.indexOf(prop) != -1) {
          throw new Error(`Property "${prop}" is required ${humanData} for ${humanSchema}`);
        }

        continue;
      }

      this.validateSchema(props[prop], data[prop]);
    }
  }

  if(!schema.hasOwnProperty('value')) {
    return;
  }

  let valid;

  if(typeof schema.value == 'function') {
    valid = schema.value(data);
  }
  else if(schema.value instanceof RegExp) {
    valid = String(data).match(schema.value);
  }
  else {
    const value = Array.isArray(schema.value)? schema.value: [schema.value];
    valid = value.indexOf(data) != -1;
  }  

  if(!valid) {
    throw new Error(`Validation is failed for ${JSON.stringify(data)}`);
  }
}

/**
 * Check it is the browser environment here
 * 
 * @returns {boolean}
 */
utils.isBrowserEnv = function () {
  return typeof window == 'object';
}

/**
 * Get a random element from the array
 * 
 * @param {array} arr
 * @returns {*}
 */
utils.getRandomElement = function (arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Convert the string to milliseconds
 * 
 * @param {string|integer} val
 * @returns {integer}
 */
utils.getMs = function (val) {
  if(typeof val != 'string' || val == 'auto') {
    return val;
  }

  return ms(val);
};

/**
 * Convert the string to bytes
 * 
 * @param {string|integer} val
 * @returns {integer|string}
 */
utils.getBytes = function (val) {
  if(typeof val != 'string' || val.match('%') || val == 'auto') {
    return val;
  }

  return bytes(val);
};

/**
 * Get the cpu usage percent
 * 
 * @async
 * @param {object} options
 * @returns {float}
 */
utils.getCpuUsage = async function(options = {}) {
  return await new Promise((resolve, reject) => {
    const startUsage = process.cpuUsage();
    const startTime  = process.hrtime();

    setTimeout(() => {  
      try {
        const info = process.cpuUsage(startUsage);
        const elapTime = process.hrtime(startTime);
        const elapTimeUs = elapTime[0] * 1000000 + elapTime[1] / 1000;
        const cpuPercent = 100 * (info.user + info.system) / elapTimeUs;
        resolve(cpuPercent);
      }
      catch(err) {
        reject(err);
      }
    }, options.timeout || 1000);
  });
};

/**
 * Check the port is used
 * 
 * @async
 * @param {integer} port
 * @returns {boolean}
 */
utils.isPortUsed = async function (port) {
  return await tcpPortUsed.check(+port, 'localhost');
};

/**
 * Get an ip address of the hostname
 * 
 * @async
 * @param {string} hostname
 * @returns {string}
 */
utils.getHostIp = async function (hostname) {
  if(hostname == 'localhost') {
    return '127.0.0.1';
  }

  if(this.isValidIp(hostname)) {
    return hostname;
  }

  return await new Promise((resolve, reject) => {
    lookup(hostname, (err, ip) => {      
      if(err) {
        if(err.code == 'ENOTFOUND') {
          return resolve(null);
        }
        
        return reject(err);
      }

      return resolve(ip);
    });
  });
};

/**
 * Get the address ip
 * 
 * @see utils.getHostIp
 * @param {string} address
 */
utils.getAddressIp = async function (address) {
  return await this.getHostIp(this.splitAddress(address)[0]);
}

/**
 * Create a requests timer
 * 
 * @async
 * @param {number} timeout 
 * @param {function} fn 
 */
utils.getRequestTimer = function (timeout, options = {}) {
  let last = Date.now(); 

  return fixArr => {
    if(timeout === undefined) {
      return;
    }

    const now = Date.now();
    timeout -= now - last;
    last = now;

    if(fixArr && !Array.isArray(fixArr)) {
      fixArr = [fixArr];
    }

    if(fixArr) {      
      let dev = fixArr.reduce((a, b) => a + b) / timeout;  
      let res = dev > 1? (fixArr[0] / dev): fixArr[0];
      let min = options.min > timeout? timeout: options.min
      min && res < min && (res = min);
      return res > 0? res: 0;
    }

    return timeout;
  };
};

/**
 * Get the client remote ip address
 * 
 * @param {http.ClientRequest} req 
 * @returns {string}
 */
utils.getRemoteIp = function (req) {
  let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

  if(ip.match(':')) {
    ip = ip.replace(/^::1/, '127.0.0.1').replace(/^::ffff:/, '');
    this.isIpv6(ip) && (ip = this.getFullIpv6(ip));
  }

  return ip;
};

/**
 * Get the ip address (v6) in the full format
 * 
 * @param {string} ip
 * @returns {string}
 */
utils.getFullIpv6 = function (ip) {
  return ip6addr.parse(ip).toString({ format: 'v6', zeroElide: false, zeroPad: true });
};

/**
 * Check the ip address is v6
 * 
 * @param {string} ip
 * @returns {boolean}
 */
utils.isIpv6 = function (ip) {
  return !!(typeof ip == 'string' && ip.match(':') && validateIP(ip));
};

/**
 * Convert ipv4 to ipv6 format
 * 
 * @param {string} ip
 * @returns {string}
 */
utils.ipv4Tov6 = function (ip) {
  return this.getFullIpv6('::ffff:' + ip);
};

/**
 * Check the two ip addresses are equal
 * 
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
utils.isIpEqual = function (a, b) {
  return ip6addr.compare(ip6addr.parse(a), ip6addr.parse(b)) == 0;
};

/**
 * Create an address from the hostname and port
 * 
 * @param {string} hostname
 * @param {integer} port
 * @returns {string}
 */
utils.createAddress = function (hostname, port) {
  if(this.isIpv6(hostname)) {
    return `[${this.getFullIpv6(hostname)}]:${port}`;
  }

  return `${hostname}:${port}`;
};

/**
 * Check the port is valid
 * 
 * @param {string} port
 * @returns {boolean}
 */
utils.isValidPort = function (port) {
  return +port > 0 && +port <= 65535;
};

/**
 * Check the ip address is valid
 * 
 * @param {string} ip
 * @returns {boolean}
 */
utils.isValidIp = function (ip) {
  return validateIP(ip);
};

/**
 * Check the hostname is valid
 * 
 * @param {string} hostname
 * @returns {boolean}
 */
utils.isValidHostname = function (hostname) {
  if(typeof hostname != 'string') {
    return false;
  }
  
  return this.hostValidationRegex.test(hostname) || this.isValidIp(hostname);
};

/**
 * Check the address is valid
 * 
 * @param {string} address - address as "ip:port"
 * @returns {boolean}
 */
utils.isValidAddress = function (address) {
  if(!address || typeof address != 'string') {
    return false;
  }

  const parts = this.splitAddress(address);
  const host = parts[0];
  const port = parts[1];
  return this.isValidHostname(host) && this.isValidPort(port);
};

/**
 * Split the address to a hostname and port
 * 
 * @param {string} address
 * @returns {string[]}
 */
utils.splitAddress = function (address) {
  let sp;

  if(!address || typeof address != 'string') {
    return [];
  }

  if(address.match(']')) {
    sp = address.split(']:');
    return [this.getFullIpv6(sp[0].slice(1)), +sp[1]];
  }

  sp = address.split(':');
  return [sp[0], +sp[1]];
};

/**
 * Create a request timeout error
 * 
 * @returns {Error}
 */
utils.createRequestTimeoutError = function () {
  const err = new Error('Request timed out');
  err.code = 'ERR_SPREADABLE_REQUEST_TIMEDOUT';
  return err;
};

/**
 * Check the error is the request timeout error
 * 
 * @param {Error} err
 * @returns {boolean}
 */
utils.isRequestTimeoutError = function (err) {
  return (['ESOCKETTIMEDOUT', 'ETIMEDOUT'].indexOf(err.code) != -1) || err.type == 'request-timeout';
};

module.exports = utils;