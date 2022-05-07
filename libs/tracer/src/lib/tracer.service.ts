import { Injectable } from '@nestjs/common';
import * as clone from 'clone';
import { ServerResponse } from 'http';
import { FORMAT_TEXT_MAP } from 'opentracing';
import * as shimmer from 'shimmer';
import { InitJaegerClient } from './providers/jaeger';

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
        'toLocaleString'
      ].includes(item.toString())
  );
};

let jaeger;

@Injectable()
export class TracerService {
  options: any;
  parentSpan: any;
  jaeger: any;
  span: any;
  requestId: any;
  constructor() {
    if (!jaeger) {
      jaeger = InitJaegerClient('loyalty-srv', {
        logger: console
      });
    }

    this.jaeger = jaeger;
    this.span = undefined;
    this.parentSpan = undefined;
  }

  init(options) {
    this.options = options;
    // this.logger = options.logger;
    // Checking singleton value before starting

    this.requestId = this.options.requestId;
  }

  static initJager(options) {
    if (!jaeger) {
      jaeger = InitJaegerClient(options.serviceName, {
        logger: options.logger,
        collectorEndpoint: options.collectorEndpoint
      });
    }
  }

  start(obj, spanName) {
    const methods = getMethods(obj.prototype);
    methods.forEach((method) => wrap(method));
    function wrap(method) {
      shimmer.wrap(obj.prototype, method, function wrapOrigin(original) {
        const isGeneratorFn = original.toString().includes('function*');

        if (isGeneratorFn) {
          return async function wrappedFunction(...args) {
            try {
              if (
                !args.length ||
                args[args.length - 1] == null ||
                !args[args.length - 1]?.traceContext
              ) {
                let result;
                let error;
                try {
                  result = await original.apply(this, [...args]);
                } catch (e) {
                  error = e;
                }

                if (error) throw error;
                return result;
              } else {
                // if (!args.length || !args[args.length - 1]?.traceContext)
                // args.push({ traceContext: '' });
                const metadata = clone(args.pop());
                const traceCxtArr = metadata.traceContext.split(',');
                const requestId = traceCxtArr.shift();
                const parentSpan = traceCxtArr.pop();
                const rootSpan = traceCxtArr.shift();

                const tracer = new TracerService();
                tracer.init({ requestId });

                tracer.SpanStart(`${spanName} - ${method}`, parentSpan);
                tracer.LogInput(...args);

                const currSpan = tracer.ExportTraceContext();

                metadata.traceContext = `${requestId},${
                  rootSpan || currSpan
                },${currSpan}`;

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
              }
            } catch (error) {
              console.log(error);
            }
          };
        } else {
          return function wrappedFunction(...args) {
            if (
              !args.length ||
              args[args.length - 1] == null ||
              !args[args.length - 1].traceContext
            ) {
              let result;
              let error;
              try {
                result = original.apply(this, [...args]);
              } catch (e) {
                error = e;
              }

              if (error) throw error;
              return result;
            } else {
              const metadata = clone(args.pop());
              const traceCxtArr = metadata.traceContext.split(',');
              const requestId = traceCxtArr.shift();
              const parentSpan = traceCxtArr.pop();
              const rootSpan = traceCxtArr.shift();

              const tracer = new TracerService();
              tracer.init({ requestId });

              tracer.SpanStart(`${spanName} - ${method}`, parentSpan);
              tracer.LogInput(...args);

              const currSpan = tracer.ExportTraceContext();

              metadata.traceContext = `${requestId},${
                rootSpan || currSpan
              },${currSpan}`;

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
              const hasResult = !!result;
              if (hasResult) {
                tracer.LogOutput(result);
                tracer.SpanFinish();
              }

              if (error) throw error;
              return result;
            }
          };
        }
      });
    }
  }

  ExportTraceContext() {
    const context = {
      requestId: ''
    };
    context.requestId = this.requestId;
    this.jaeger.inject(this.span, FORMAT_TEXT_MAP, context);
    return context['uber-trace-id'];
  }

  /**
   * @param {String} name name of span
   * @param {String} [parentSpanTraceContext] parent span context. This should be from `this.ExportTraceContext()`
   */
  SpanStart(name, parentSpanTraceContext) {
    if (parentSpanTraceContext) {
      this.parentSpan = this.jaeger.extract(FORMAT_TEXT_MAP, {
        'uber-trace-id': parentSpanTraceContext,
        span: parentSpanTraceContext
      });
    }

    this.span = this.jaeger.startSpan(name, {
      childOf: this.parentSpan
    });

    this.span.setTag('request_id', this.requestId);
  }

  /**
   * End of a span
   */
  SpanFinish() {
    if (this.span) this.span.finish();
  }

  /**
   * Log input values into span
   */
  LogInput(...params) {
    // this.logger.info(params)
    if (this.span)
      params.forEach((param, i) => {
        if (
          !!param &&
          !!param.constructor &&
          !['Object', 'String', 'Number'].includes(param.constructor.name)
        ) {
          return this.span.log({ [`param${i}`]: param.constructor.name });
        } else return this.span.log({ [`param${i}`]: param });
      });
  }

  /**
   * Log output values into span
   */
  LogOutput(...params) {
    if (this.span)
      params.forEach((param, i) => {
        if (
          !!param &&
          !!param.constructor &&
          ['ClientSession'].includes(param.constructor.name)
        ) {
          return this.span.log({ [`param${i}`]: param.constructor.name });
        } else {
          if (param instanceof ServerResponse) {
            //  console.log(param.req.prependOnceListener)
          } else if (JSON.stringify(param).length > 64569) {
            this.span.log({
              [`output${i}`]: {
                message: `span size ${
                  JSON.stringify(param).length
                } is larger than maxSpanSize 64569`
              }
            });
          } else {
            this.span.log({ [`output${i}`]: param });
          }
        }
      });
  }

  /**
   * Log error and make a tag error=true into span
   */
  LogError(error) {
    // this.logger.error(JSON.stringify(error.stack));
    if (this.span) {
      this.span.setTag('error', true);
      this.span.log({ error: error instanceof Error ? error.stack : error });
    }
  }

  /**
   * Make a tag for span
   */
  Tag(name, value) {
    if (this.span) this.span.setTag(name, value);
  }
}
