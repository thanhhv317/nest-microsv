import * as Module from 'module';
import * as path from 'path';

import { FORMAT_TEXT_MAP } from 'opentracing';

import { InitJaegerClient } from './providers/jaeger';
import * as pluginService from './plugins/service.plugin';
// Singleton variable holds connection to Jaeger
let jaeger;

export class Tracer {
  options: any;
  jaeger: any;
  requestId: any;
  span: any;
  parentSpan: any;
  // logger: any;
  constructor(options) {
    this.options = options;
    // this.logger = options.logger;
    // Checking singleton value before starting
    if (!jaeger) {
      jaeger = InitJaegerClient(options.serviceName, {
        logger: options.logger,
      });
    }

    this.jaeger = jaeger;
    this.requestId = this.options.requestId;
    this.span = undefined;
    this.parentSpan = undefined;
  }

  /**
   * Entry method to run the tracer for the whole application
   * @param {Object} options
   * @param {String} options.serviceName
   * @param {Object} options.logger
   */
  static start(options) {
    if (!jaeger) {
      jaeger = InitJaegerClient(options.serviceName, {
        logger: options.logger,
      });
    }
    const originRequire = Module.prototype.require;
    const cached = [];

    // @ts-ignore: Unreachable code error
    Module.prototype.require = function require(file) {
      const { filename } = this;

      const exp = originRequire.bind(this)(file);
      const absFilePath = file.startsWith('.')
        ? path.resolve(path.dirname(filename), file)
        : file;
      Object.keys(exp).forEach((key) => {
        const cachedKey = `${absFilePath}::${key}`;

        if (
          !Object.prototype.hasOwnProperty.call(exp, key) ||
          cached.includes(cachedKey)
        )
          return;
        cached.push(cachedKey);

        // chua the load duoc file
        if (pluginService.Pattern.test(absFilePath)) {
        console.log(absFilePath)

          pluginService.Wrapper(exp, Tracer, options, key);
        }
      });

      return exp;
    };
  }

  /**
   * Export tracing context for inherited span
   */
  ExportTraceContext() {
    const context = {
      requestId: '',
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
      });
    }

    this.span = this.jaeger.startSpan(name, {
      childOf: this.parentSpan,
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
      params.forEach((param, i) => this.span.log({ [`param${i}`]: param }));
  }

  /**
   * Log output values into span
   */
  LogOutput(...params) {
    if (this.span)
      params.forEach((param, i) => {
        if (JSON.stringify(param).length > 64569) {
          this.span.log({
            [`output${i}`]: {
              message: `span size ${JSON.stringify(param).length
                } is larger than maxSpanSize 64569`,
            },
          });
        } else {
          this.span.log({ [`output${i}`]: param });
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
