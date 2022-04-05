import * as Module from 'module';
import * as path from 'path';

import { FORMAT_TEXT_MAP } from 'opentracing';

import { InitJaegerClient } from './providers/jaeger';
// import * as pluginService from './plugins/service.plugin';
import * as pluginService from './plugins/service.plugin';
import * as pluginController from './plugins/controller.plugin';

import { gatewayApp } from '../../../../apps/gateway/src/app/index';
import { memberApp } from '../../../../apps/member/src/app/index';
import { ServerResponse } from 'http';

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

    for (let i = 0; i < gatewayApp.length; ++i) {
      pluginService.Wrapper(Tracer, options, Object.values(gatewayApp[i])[0]);
    }
    for (let i = 0; i < memberApp.length; ++i) {
      pluginService.Wrapper(Tracer, options, Object.values(memberApp[i])[0]);
    }
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
        if (param instanceof ServerResponse) {
         console.log(param.req.prependOnceListener)
        } else
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
