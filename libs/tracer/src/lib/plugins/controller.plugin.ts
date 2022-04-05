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
      (typeof obj[item.toString()] === 'function' || typeof obj[item.toString()] === 'object') &&
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
        'process',
        '__proto__',
        'transformProducts',
        'checkSourceRequest',
        'resetToken',
        'getToken',
        'send',
        'subscribe'
      ].includes(item.toString()),
  );
};

export const Wrapper = (Tracer, options, obj) => {
  const methods = getMethods(obj.prototype);

  methods.forEach((method) => {
    return wrap(method)
  });

  function wrap(method) {
    shimmer.wrap(obj.prototype, method, function wrapOrigin(original) {
      const AsyncFunction = (async () => { }).constructor;
      let isAsyncOrPromiseFn = false;
      if (original instanceof AsyncFunction || original instanceof Promise) {
        isAsyncOrPromiseFn = true;
      }
      if (isAsyncOrPromiseFn) {
        return async function wrappedFunction(...args) {
          if (!args.length || args[args.length -1] == null || !args[args.length - 1].traceContext) {
            let result;
            let error;
            try {
              result = await original.apply(this, [...args]);
            } catch (e) {
              error = e;
            }

            if (error) throw error;
            return result;
          }
          else {
            const metadata = (args.pop());
            const traceCxtArr = metadata.traceContext.split(',');
            const requestId = traceCxtArr.shift();
            const parentSpan = traceCxtArr.pop();
            const rootSpan = traceCxtArr.shift();

            const tracer = new Tracer({ ...options, requestId });

            tracer.SpanStart(`[CONTROLLER] - ${method}`, parentSpan);
            tracer.LogInput(...args);

            const currSpan = tracer.ExportTraceContext();

            metadata.traceContext = `${requestId},${rootSpan || currSpan},${tracer.ExportTraceContext()}`;

            let result;
            let error;
            try {
              if (isAsyncOrPromiseFn) {
                result = await original.apply(this, [...args, metadata]);
              } else {
                result = original.apply(this, [...args, metadata]);
              }
            } catch (e) {
              error = e;
            }

            if (error) {
              tracer.LogError(error);
              tracer.SpanFinish();
            }
            if (!!result) {
              tracer.LogOutput(result)
              tracer.SpanFinish();
            };

            if (error) throw error;
            return result;
          };
        }
      } else {
        return function wrappedFunction(...args) {
          if (!args.length || args[args.length -1] == null || !args[args.length - 1].traceContext) {
            let result;
            let error;
            try {
              result = original.apply(this, [...args]);
            } catch (e) {
              error = e;
            }

            if (error) throw error;
            return result;
          }
          else {
            const metadata = (args.pop());
            const traceCxtArr = metadata.traceContext.split(',');
            const requestId = traceCxtArr.shift();
            const parentSpan = traceCxtArr.pop();
            const rootSpan = traceCxtArr.shift();

            const tracer = new Tracer({ ...options, requestId });

            tracer.SpanStart(`[CONTROLLER] - ${method}`, parentSpan);
            tracer.LogInput(...args);

            const currSpan = tracer.ExportTraceContext();

            metadata.traceContext = `${requestId},${rootSpan || currSpan},${tracer.ExportTraceContext()}`;

            let result;
            let error;
            try {
              result = original.apply(this, [...args, metadata]);
            } catch (e) {
              error = e;
            }
            if (error) {
              tracer.LogError(error);
              tracer.SpanFinish();
            }
            if (!!result) {
              tracer.LogOutput(result)
              tracer.SpanFinish();
            };

            if (error) throw error;
            return result;
          };
        }
      }
    });
  }

};
