
import { response } from 'express';
import { writeLog } from '../Utils/writeLog.mjs'

const detectXSS = (value) =>{
  if (typeof value !== 'string') return false;

  const patterns = [
    /<.*?>/g, // etiquetas HTML
    /&[a-zA-Z0-9#]+;/g, // entidades HTML (como &lt;, &#x27;)
    /javascript:/gi, // javascript: URI
    /<script.*?>.*?<\/script>/gi, // script tags
    /<.*?on\w+=["']?.*?["']?>/gi, // atributos on* (como onclick)
    /<iframe.*?>.*?<\/iframe>/gi, // iframe
    /<object.*?>.*?<\/object>/gi, // object
    /<embed.*?>.*?<\/embed>/gi // embed
  ];
  return patterns.some((regex) => regex.test(value));
}

const isPrototypePollutionKey  = (value) => /^(__proto__|constructor|prototype)$/.test(value);
const isMongoOperator  = (value) => /^\$[a-zA-Z0-9]+$/.test(value);

const verify_key = (key) => {
  return isPrototypePollutionKey(key) || isMongoOperator(key);
};

const verify = (value, depth = 0, maxDepth = 10, visited = new Set()) =>{
  if (depth > maxDepth) {
    console.warn("Max depth reached");
    return true;
  }

  if (typeof value === 'string') {
    return isPrototypePollutionKey(value) || detectXSS(value) || isMongoOperator(value);
  }

  if (typeof value === 'object' && value !== null) {
    if (visited.has(value)) {
      console.warn("Circular reference detected");
      return true;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      return value.some(item => verify(item, depth + 1, maxDepth, visited));
    }


    for (let [key, val] of Object.entries(value)) {
      if (verify_key(key) || verify(val, depth + 1, maxDepth, visited)) return true;
    }

    
  }

  return false;
}



const sanitize = (req, res = response, next) => {
  const sources = [req.body, req.query, req.params]; 

  for (const source of sources) {

    for (let param in source) {

      if ( verify(source[param]) ) {
        const ip = req.ip || req.connection.remoteAddress;  
        writeLog(`Blocked due to malicious input from ${ip} address`)
        return res.status(403).json({
          ok: false,
          msg: "Blocked due to malicious input"
        });
      }
    }
  }

  next();
};

export default sanitize;

