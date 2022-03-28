import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FormatUtil {
    constructor() { }

    upperCaseCode(code) {
        try {
            if (!code || !code.length) return code;

            return code
                .toString()
                .replace(/[^\w\s]/gi, '')
                .replace(/\s\s+/g, '_')
                .toUpperCase();
        } catch (err) {
            Logger.error(err, '', `FORMAT_UTIL FORMAT_CODE`);
        }
    }

    removeSpecialChar(code) {
        try {
            if (!code || !code.length) return code;

            return code.replace(/[-[\]{}()%_&*+?.,\\/^$|#\s]/gi, '\\$&');
        } catch (err) {
            Logger.error(err, '', `FORMAT_UTIL FORMAT_CODE`);
        }
    }
}
