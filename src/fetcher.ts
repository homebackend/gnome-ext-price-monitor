import GLib from "gi://GLib";
import Soup from "gi://Soup";
import { JsonCommodity, CsvCommodity, Parsers, Source } from "./source";
import Gio from "gi://Gio";

export class Fetcher {
    private _source: Source;
    private _httpSession: Soup.Session | undefined;
    private _log: (logs: string[]) => void;

    constructor(source: Source, log: (logs: string[]) => void) {
        this._source = source;
        this._log = log;
    }

    private _build_req(settings: Gio.Settings): Soup.Message {
        const url = this._source.getUrl(settings);
        let request = Soup.Message.new(this._source.method, url);
        this._source.getHeaders(settings).forEach((value, name) => request.request_headers.append(name, value));

        if (this._source.getBody) {
            const body = this._source.getBody(settings);
            const payload = Object.fromEntries(body);
            const payloadJson = JSON.stringify(payload);
            const encoder = new TextEncoder();
            const payloadUint8 = encoder.encode(payloadJson);
            const bodyBytes = new GLib.Bytes(payloadUint8);
            request.set_request_body_from_bytes('application/json', bodyBytes);
        }

        this._log([url]);
        return request;
    }

    private _get_value(r: Map<string, number>, item: any, key: string, indexes: string | string[] | undefined) {
        if (!indexes) {
            return;
        }

        if (typeof indexes == 'string') {
            indexes = [indexes];
        }

        indexes.forEach(index => {
            item = item[index];
        });
        r.set(key, item);
    }

    fetch(settings: Gio.Settings, callback: (result: Map<string, Map<string, number>> | undefined) => void) {
        let msg = this._build_req(settings);
        this._httpSession = new Soup.Session();
        this._httpSession.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (_, r) => {
            if (!this._httpSession) {
                this._log(['_httpSession is undefined']);
                return callback(undefined);
            }

            const bytes = this._httpSession!.send_and_read_finish(r).get_data();
            if (!bytes) {
                this._log(['Invalid response from server']);
                this._httpSession = undefined;
                return callback(undefined);
            }

            this._log(['Recieved response']);

            this._httpSession = undefined;
            const response = new TextDecoder("utf-8").decode(bytes);

            if (msg.get_status() > 299) {
                this._log(["Remote server error:", msg.get_status().toString(), response]);
                return callback(undefined);
            }

            let data: any;
            if (this._source.parser == Parsers.Json) {
                data = JSON.parse(response);
                if (data.length === 0) {
                    this._log(["Remote server error:", response]);
                    return callback(undefined);
                }
            } else if (this._source.parser == Parsers.NewLineWithTabs) {
                const rows: string[] = response.split('\n');
                data = rows.map(row => row.split('\t'));
            } else {
                this._log(['Unsupported parser']);
                return callback(undefined);
            }

            const items = this._source.getItems(data);
            const result: Map<string, Map<string, number>> = new Map();
            this._source.commodities.forEach((c, names) => {
                names = Array.isArray(names) ? names : [names];
                names.forEach(name => {
                    if (!items.has(name)) {
                        this._log(['Not found', name]);
                        return;
                    }

                    const item = items.get(name);
                    const r: Map<string, number> = new Map();
                    if (this._source.parser == Parsers.Json) {
                        const commodity = c as JsonCommodity;
                        this._get_value(r, item, 'price', commodity.price);
                        this._get_value(r, item, 'change', commodity.change);
                        this._get_value(r, item, 'pchange', commodity.pchange);
                        this._get_value(r, item, 'close', commodity.close);
                        this._get_value(r, item, 'gratio', commodity.goldRatio);
                        this._get_value(r, item, 'unit', commodity.unit);
                    }
                    result.set(name, r);
                });
            });

            callback(result);
        });
    }

    disable() {
        if (this._httpSession) {
            this._httpSession?.abort();
            this._httpSession = undefined;
        }
    }
}
