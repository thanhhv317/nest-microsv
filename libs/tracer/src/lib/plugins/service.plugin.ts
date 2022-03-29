import { clone } from 'lodash';
import * as shimmer from 'shimmer';
// export const Pattern = /\/dist\/.*?\/.*?.service/;
export const Pattern = /\/dist\/apps\/gateway\/main.js/;

const getMethods = (obj: any) => {
  const properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).map((item) => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));
  return [...properties.keys()].filter(
    (item) =>
      typeof obj[item.toString()] === 'function' &&
      ![
        'constructor',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        'hasOwnProperty',
        'hasOwnProperty',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toString',
        'valueOf',
        'toLocaleString',
        'CounterHttpRequest',
        'GetMetrics',
        'SetMetric',
      ].includes(item.toString()),
  );
};

export const Wrapper = (exp, Tracer, options, key) => {
  const methods = getMethods(exp[key].prototype);
  methods.forEach((method) => wrap(method));
  console.log(methods);

  function wrap(method) {
    shimmer.wrap(exp[key].prototype, method, function wrapOrigin(original) {
      return async function wrappedFunction(...args) {
        if (!args.length || !args[args.length - 1].traceContext) {
          args.push({ traceContext: '' });
        }
        const metadata = clone(args.pop());
        const traceCxtArr = metadata.traceContext.split(',');
        const requestId = traceCxtArr.shift();
        const parentSpan = traceCxtArr.pop();
        const rootSpan = traceCxtArr.shift();

        const tracer = new Tracer({ ...options, requestId });

        tracer.SpanStart(`${key} - [SERVICES] ${method}`, parentSpan);
        tracer.LogInput(...args);

        const currSpan = tracer.ExportTraceContext();

        metadata.traceContext = `${requestId},${
          rootSpan || currSpan
        },${tracer.ExportTraceContext()}`;

        let result;
        let error;

        try {
          result = await original.apply(this, [...args, metadata]);
        } catch (e) {
          error = e;
        }

        if (error) tracer.LogError(error);
        if (result) tracer.LogOutput(result);
        tracer.SpanFinish();

        if (error) throw error;
        return result;
      };
    });
  }
};
